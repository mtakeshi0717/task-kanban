import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import KanbanBoard from "@/components/KanbanBoard";
import type { Task } from "@/lib/tasks";
import { fakeDb } from "@/test/fakeSupabase";

vi.mock("@/lib/supabase/client", async () => ({
  supabase: (await import("@/test/fakeSupabase")).fakeSupabase,
}));

const createSampleTask = (overrides: Partial<Task>): Task => ({
  id: "t-1",
  title: "サンプル",
  description: null,
  status: "todo",
  created_at: "2026-10-01T00:00:00.000Z",
  updated_at: "2026-10-01T00:00:00.000Z",
  ...overrides,
});

const getColumn = (name: string) => screen.getByRole("region", { name });

const renderBoard = async () => {
  render(<KanbanBoard />);
  await waitFor(() => expect(screen.queryByText("読み込み中...")).not.toBeInTheDocument());
};

beforeEach(() => {
  fakeDb.reset([
    createSampleTask({ id: "t-1", title: "設計する", status: "todo" }),
    createSampleTask({ id: "t-2", title: "実装する", status: "doing", description: "画面を作る" }),
    createSampleTask({ id: "t-3", title: "リリースする", status: "done" }),
  ]);
});

describe("一覧表示", () => {
  test("読み込み中は読み込み表示が出て、完了後にタスクが表示される", async () => {
    render(<KanbanBoard />);
    expect(screen.getByText("読み込み中...")).toBeInTheDocument();
    expect(await screen.findByText("設計する")).toBeInTheDocument();
  });

  test("タスクがステータスごとの列に振り分けて表示される", async () => {
    await renderBoard();

    expect(within(getColumn("未着手")).getByText("設計する")).toBeInTheDocument();
    expect(within(getColumn("進行中")).getByText("実装する")).toBeInTheDocument();
    expect(within(getColumn("進行中")).getByText("画面を作る")).toBeInTheDocument();
    expect(within(getColumn("完了")).getByText("リリースする")).toBeInTheDocument();
    expect(within(getColumn("未着手")).queryByText("実装する")).not.toBeInTheDocument();
  });

  test("タスクが0件のときは各列に空の案内が表示される", async () => {
    fakeDb.reset([]);
    await renderBoard();

    expect(within(getColumn("未着手")).getByText("タスクはありません")).toBeInTheDocument();
    expect(within(getColumn("進行中")).getByText("タスクはありません")).toBeInTheDocument();
    expect(within(getColumn("完了")).getByText("タスクはありません")).toBeInTheDocument();
  });

  test("取得に失敗したときはエラーメッセージが表示される", async () => {
    fakeDb.failWith("接続失敗");
    render(<KanbanBoard />);

    expect(await screen.findByRole("alert")).toHaveTextContent("タスクの取得に失敗しました");
  });
});

describe("追加", () => {
  test("タイトルを入力して追加すると、再読み込みなしで未着手の列にすぐ表示される", async () => {
    await renderBoard();
    const form = screen.getByRole("form", { name: "タスク追加" });

    fireEvent.change(within(form).getByLabelText("タイトル"), { target: { value: "調査する" } });
    fireEvent.click(within(form).getByRole("button", { name: "追加" }));

    expect(await within(getColumn("未着手")).findByText("調査する")).toBeInTheDocument();
    expect(within(form).getByLabelText("タイトル")).toHaveValue("");
    expect(fakeDb.getRows()).toHaveLength(4);
  });

  test("ステータスを選んで追加すると、そのステータスの列に表示される", async () => {
    await renderBoard();
    const form = screen.getByRole("form", { name: "タスク追加" });

    fireEvent.change(within(form).getByLabelText("タイトル"), { target: { value: "確認する" } });
    fireEvent.change(within(form).getByLabelText("ステータス"), { target: { value: "done" } });
    fireEvent.click(within(form).getByRole("button", { name: "追加" }));

    expect(await within(getColumn("完了")).findByText("確認する")).toBeInTheDocument();
  });

  test("タイトルが空のまま追加するとエラーが表示され、タスクは増えない", async () => {
    await renderBoard();
    const form = screen.getByRole("form", { name: "タスク追加" });

    fireEvent.click(within(form).getByRole("button", { name: "追加" }));

    expect(await within(form).findByRole("alert")).toHaveTextContent("タイトルを入力してください");
    expect(fakeDb.getRows()).toHaveLength(3);
  });

  test("追加に失敗したときはエラーが表示され、入力内容は残る", async () => {
    await renderBoard();
    const form = screen.getByRole("form", { name: "タスク追加" });
    fakeDb.failWith("追加失敗");

    fireEvent.change(within(form).getByLabelText("タイトル"), { target: { value: "調査する" } });
    fireEvent.click(within(form).getByRole("button", { name: "追加" }));

    expect(await within(form).findByRole("alert")).toHaveTextContent("追加失敗");
    expect(within(form).getByLabelText("タイトル")).toHaveValue("調査する");
    expect(screen.queryByText("調査する", { selector: "h3" })).not.toBeInTheDocument();
  });
});

describe("編集", () => {
  const openEditDialog = (title: string) => {
    fireEvent.click(screen.getByRole("button", { name: `${title}を編集` }));
    return screen.getByRole("dialog", { name: "タスクを編集" });
  };

  test("編集ダイアログには現在の内容が入力済みで表示される", async () => {
    await renderBoard();
    const dialog = openEditDialog("実装する");

    expect(within(dialog).getByLabelText("タイトル")).toHaveValue("実装する");
    expect(within(dialog).getByLabelText("説明")).toHaveValue("画面を作る");
    expect(within(dialog).getByLabelText("ステータス")).toHaveValue("doing");
  });

  test("タイトルと説明を変更して保存すると、すぐ一覧に反映されダイアログが閉じる", async () => {
    await renderBoard();
    const dialog = openEditDialog("設計する");

    fireEvent.change(within(dialog).getByLabelText("タイトル"), { target: { value: "詳細設計する" } });
    fireEvent.change(within(dialog).getByLabelText("説明"), { target: { value: "DB設計" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "保存" }));

    expect(await within(getColumn("未着手")).findByText("詳細設計する")).toBeInTheDocument();
    expect(within(getColumn("未着手")).getByText("DB設計")).toBeInTheDocument();
    expect(within(getColumn("未着手")).queryByText("設計する")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("ステータスを変更して保存すると、タスクが別の列へ移動する（順方向）", async () => {
    await renderBoard();
    const dialog = openEditDialog("設計する");

    fireEvent.change(within(dialog).getByLabelText("ステータス"), { target: { value: "doing" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "保存" }));

    expect(await within(getColumn("進行中")).findByText("設計する")).toBeInTheDocument();
    expect(within(getColumn("未着手")).queryByText("設計する")).not.toBeInTheDocument();
  });

  test("ステータスを元の列へ戻すと、タスクが逆方向にも移動する（逆方向）", async () => {
    await renderBoard();
    const dialog = openEditDialog("リリースする");

    fireEvent.change(within(dialog).getByLabelText("ステータス"), { target: { value: "todo" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "保存" }));

    expect(await within(getColumn("未着手")).findByText("リリースする")).toBeInTheDocument();
    expect(within(getColumn("完了")).queryByText("リリースする")).not.toBeInTheDocument();
  });

  test("タイトルを空にして保存するとエラーが表示され、ダイアログは開いたまま", async () => {
    await renderBoard();
    const dialog = openEditDialog("設計する");

    fireEvent.change(within(dialog).getByLabelText("タイトル"), { target: { value: "" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "保存" }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent("タイトルを入力してください");
    expect(screen.getByRole("dialog", { name: "タスクを編集" })).toBeInTheDocument();
    expect(fakeDb.getRows()[0].title).toBe("設計する");
  });

  test("キャンセルすると変更は破棄され、一覧は元のまま", async () => {
    await renderBoard();
    const dialog = openEditDialog("設計する");

    fireEvent.change(within(dialog).getByLabelText("タイトル"), { target: { value: "破棄される" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "キャンセル" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(within(getColumn("未着手")).getByText("設計する")).toBeInTheDocument();
    expect(screen.queryByText("破棄される")).not.toBeInTheDocument();
  });
});

describe("削除", () => {
  test("削除ボタンを押すと確認ダイアログが表示され、この時点ではタスクは消えない", async () => {
    await renderBoard();

    fireEvent.click(screen.getByRole("button", { name: "設計するを削除" }));

    const dialog = screen.getByRole("dialog", { name: "削除の確認" });
    expect(dialog).toHaveTextContent("設計する");
    expect(within(getColumn("未着手")).getByText("設計する")).toBeInTheDocument();
    expect(fakeDb.getRows()).toHaveLength(3);
  });

  test("確認ダイアログで削除を実行すると、すぐ一覧から消える", async () => {
    await renderBoard();

    fireEvent.click(screen.getByRole("button", { name: "設計するを削除" }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "削除の確認" })).getByRole("button", { name: "削除する" }));

    await waitFor(() => expect(within(getColumn("未着手")).queryByText("設計する")).not.toBeInTheDocument());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(fakeDb.getRows().map((row) => row.id)).toEqual(["t-2", "t-3"]);
  });

  test("確認ダイアログでキャンセルすると、タスクは残る", async () => {
    await renderBoard();

    fireEvent.click(screen.getByRole("button", { name: "設計するを削除" }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "削除の確認" })).getByRole("button", { name: "キャンセル" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(within(getColumn("未着手")).getByText("設計する")).toBeInTheDocument();
    expect(fakeDb.getRows()).toHaveLength(3);
  });

  test("削除に失敗したときはエラーが表示され、タスクは残る", async () => {
    await renderBoard();
    fakeDb.failWith("削除失敗");

    fireEvent.click(screen.getByRole("button", { name: "設計するを削除" }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "削除の確認" })).getByRole("button", { name: "削除する" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("削除失敗");
    expect(within(getColumn("未着手")).getByText("設計する")).toBeInTheDocument();
  });
});
