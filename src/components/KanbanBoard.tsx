"use client";

import { useEffect, useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import Dialog from "@/components/Dialog";
import TaskForm, { statusLabels } from "@/components/TaskForm";
import { createTask, deleteTask, fetchTasks, taskStatuses, updateTask } from "@/lib/tasks";
import type { Task, TaskInput } from "@/lib/tasks";

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  useEffect(() => {
    let isCancelled = false;
    const load = async () => {
      try {
        const loadedTasks = await fetchTasks();
        if (!isCancelled) {
          setTasks(loadedTasks);
        }
      } catch {
        if (!isCancelled) {
          setLoadError("タスクの取得に失敗しました");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };
    void load();
    return () => {
      isCancelled = true;
    };
  }, []);

  const handleCreate = async (input: TaskInput) => {
    const created = await createTask(input);
    setTasks((current) => [...current, created]);
  };

  const handleUpdate = async (input: TaskInput) => {
    if (!editingTask) {
      return;
    }
    const updated = await updateTask(editingTask.id, input);
    setTasks((current) => current.map((task) => (task.id === updated.id ? updated : task)));
    setEditingTask(null);
  };

  const handleDelete = async () => {
    if (!deletingTask) {
      return;
    }
    const target = deletingTask;
    setDeletingTask(null);
    setActionError(null);
    try {
      await deleteTask(target.id);
      setTasks((current) => current.filter((task) => task.id !== target.id));
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      setActionError(`削除に失敗しました: ${message}`);
    }
  };

  if (isLoading) {
    return <p>読み込み中...</p>;
  }

  if (loadError) {
    return (
      <p role="alert" className="text-red-600">
        {loadError}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="max-w-md rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="mb-3 font-semibold">タスクを追加</h2>
        <TaskForm formLabel="タスク追加" submitLabel="追加" resetOnSuccess onSubmit={handleCreate} />
      </section>

      {actionError && (
        <p role="alert" className="text-red-600">
          {actionError}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {taskStatuses.map((status) => {
          const columnTasks = tasks.filter((task) => task.status === status);
          return (
            <section
              key={status}
              aria-label={statusLabels[status]}
              className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-900"
            >
              <h2 className="mb-3 font-semibold">{statusLabels[status]}</h2>
              {columnTasks.length === 0 ? (
                <p className="text-sm text-zinc-500">タスクはありません</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {columnTasks.map((task) => (
                    <li key={task.id}>
                      <article className="rounded border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800">
                        <h3 className="font-medium">{task.title}</h3>
                        {task.description && (
                          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{task.description}</p>
                        )}
                        <div className="mt-3 flex gap-2 text-sm">
                          <button
                            type="button"
                            aria-label={`${task.title}を編集`}
                            onClick={() => setEditingTask(task)}
                            className="rounded border border-zinc-300 px-3 py-1 dark:border-zinc-600"
                          >
                            編集
                          </button>
                          <button
                            type="button"
                            aria-label={`${task.title}を削除`}
                            onClick={() => setDeletingTask(task)}
                            className="rounded border border-red-300 px-3 py-1 text-red-600 dark:border-red-800"
                          >
                            削除
                          </button>
                        </div>
                      </article>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      {editingTask && (
        <Dialog label="タスクを編集">
          <TaskForm
            formLabel="編集フォーム"
            submitLabel="保存"
            initialValues={{
              title: editingTask.title,
              description: editingTask.description ?? "",
              status: editingTask.status,
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditingTask(null)}
          />
        </Dialog>
      )}

      {deletingTask && (
        <ConfirmDialog
          label="削除の確認"
          message={`「${deletingTask.title}」を削除します。よろしいですか？`}
          confirmLabel="削除する"
          onConfirm={handleDelete}
          onCancel={() => setDeletingTask(null)}
        />
      )}
    </div>
  );
}
