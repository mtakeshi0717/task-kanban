import type { Task } from "@/lib/tasks";

type FakeError = { message: string };
type FakeResult = { data: unknown; error: FakeError | null };

type Operation = "select" | "insert" | "update" | "delete";

// Supabase クライアントのクエリビルダーのうち、tasks テーブルの CRUD で使う部分だけを再現するメモリ上のフェイク。
let rows: Task[] = [];
let sequence = 0;
let errorMessage: string | null = null;

export const fakeDb = {
  reset(initialRows: Task[] = []) {
    rows = [...initialRows];
    sequence = 0;
    errorMessage = null;
  },
  failWith(message: string) {
    errorMessage = message;
  },
  getRows() {
    return [...rows];
  },
};

function createBuilder() {
  let operation: Operation = "select";
  let payload: Record<string, unknown> = {};
  let targetId: string | null = null;
  let wantsSingle = false;

  const run = (): FakeResult => {
    if (errorMessage) {
      return { data: null, error: { message: errorMessage } };
    }
    if (operation === "select") {
      return { data: [...rows], error: null };
    }
    if (operation === "insert") {
      sequence += 1;
      const now = new Date().toISOString();
      const created = {
        id: `fake-${sequence}`,
        description: null,
        status: "todo",
        created_at: now,
        updated_at: now,
        ...payload,
      } as Task;
      rows = [...rows, created];
      return { data: wantsSingle ? created : [created], error: null };
    }
    if (operation === "update") {
      const target = rows.find((row) => row.id === targetId);
      if (!target) {
        return { data: null, error: { message: "対象のタスクがありません" } };
      }
      const updated = { ...target, ...payload } as Task;
      rows = rows.map((row) => (row.id === targetId ? updated : row));
      return { data: wantsSingle ? updated : [updated], error: null };
    }
    rows = rows.filter((row) => row.id !== targetId);
    return { data: null, error: null };
  };

  const builder = {
    select() {
      return builder;
    },
    order() {
      return builder;
    },
    insert(value: Record<string, unknown>) {
      operation = "insert";
      payload = value;
      return builder;
    },
    update(value: Record<string, unknown>) {
      operation = "update";
      payload = value;
      return builder;
    },
    delete() {
      operation = "delete";
      return builder;
    },
    eq(_column: string, value: string) {
      targetId = value;
      return builder;
    },
    single() {
      wantsSingle = true;
      return builder;
    },
    then<TResult>(
      onFulfilled: (result: FakeResult) => TResult,
      onRejected?: (reason: unknown) => TResult,
    ) {
      return Promise.resolve(run()).then(onFulfilled, onRejected);
    },
  };

  return builder;
}

export const fakeSupabase = {
  from: () => createBuilder(),
};
