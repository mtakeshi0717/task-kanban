import { beforeEach, describe, expect, test, vi } from "vitest";
import { createTask, deleteTask, fetchTasks, updateTask } from "@/lib/tasks";
import type { Task } from "@/lib/tasks";
import { fakeDb } from "@/test/fakeSupabase";

vi.mock("@/lib/supabase/client", async () => ({
  supabase: (await import("@/test/fakeSupabase")).fakeSupabase,
}));

const baseTask: Task = {
  id: "t-1",
  title: "既存タスク",
  description: null,
  status: "todo",
  created_at: "2026-10-01T00:00:00.000Z",
  updated_at: "2026-10-01T00:00:00.000Z",
};

beforeEach(() => {
  fakeDb.reset([baseTask]);
});

describe("fetchTasks", () => {
  test("登録済みのタスクを一覧で取得できる", async () => {
    await expect(fetchTasks()).resolves.toEqual([baseTask]);
  });

  test("タスクが0件のときは空配列を返す", async () => {
    fakeDb.reset([]);
    await expect(fetchTasks()).resolves.toEqual([]);
  });

  test("DBがエラーを返したときは例外を投げる", async () => {
    fakeDb.failWith("接続失敗");
    await expect(fetchTasks()).rejects.toThrow("接続失敗");
  });
});

describe("createTask", () => {
  test("タイトルと説明を指定して追加すると、作成したタスクを返す", async () => {
    const created = await createTask({ title: "新規", description: "詳細", status: "doing" });

    expect(created).toMatchObject({ title: "新規", description: "詳細", status: "doing" });
    expect(fakeDb.getRows()).toHaveLength(2);
  });

  test("タイトルの前後の空白は取り除いて保存する", async () => {
    const created = await createTask({ title: "  新規  ", description: "", status: "todo" });

    expect(created.title).toBe("新規");
  });

  test("タイトルが1文字でも追加できる", async () => {
    await expect(createTask({ title: "a", description: "", status: "todo" })).resolves.toMatchObject({
      title: "a",
    });
  });

  test.each([["空文字", ""], ["空白のみ", "   "]])(
    "タイトルが%sのときは例外を投げ、DBに追加しない",
    async (_label, title) => {
      await expect(createTask({ title, description: "", status: "todo" })).rejects.toThrow(
        "タイトルを入力してください",
      );
      expect(fakeDb.getRows()).toHaveLength(1);
    },
  );

  test("DBがエラーを返したときは例外を投げる", async () => {
    fakeDb.failWith("追加失敗");
    await expect(createTask({ title: "新規", description: "", status: "todo" })).rejects.toThrow("追加失敗");
  });
});

describe("updateTask", () => {
  test("タイトル・説明・ステータスを更新し、更新後のタスクを返す", async () => {
    const updated = await updateTask("t-1", { title: "変更後", description: "メモ", status: "done" });

    expect(updated).toMatchObject({ id: "t-1", title: "変更後", description: "メモ", status: "done" });
    expect(fakeDb.getRows()[0]).toMatchObject({ title: "変更後", status: "done" });
  });

  test("タイトルが空白のみのときは例外を投げ、更新しない", async () => {
    await expect(updateTask("t-1", { title: " ", description: "", status: "todo" })).rejects.toThrow(
      "タイトルを入力してください",
    );
    expect(fakeDb.getRows()[0].title).toBe("既存タスク");
  });

  test("存在しないIDを指定したときは例外を投げる", async () => {
    await expect(updateTask("missing", { title: "x", description: "", status: "todo" })).rejects.toThrow();
  });
});

describe("deleteTask", () => {
  test("指定したタスクを削除できる", async () => {
    await deleteTask("t-1");
    expect(fakeDb.getRows()).toEqual([]);
  });

  test("DBがエラーを返したときは例外を投げる", async () => {
    fakeDb.failWith("削除失敗");
    await expect(deleteTask("t-1")).rejects.toThrow("削除失敗");
  });
});
