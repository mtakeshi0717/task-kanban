"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Pencil, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import Dialog from "@/components/Dialog";
import TaskForm, { statusLabels } from "@/components/TaskForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createTask, deleteTask, fetchTasks, updateTask } from "@/lib/tasks";
import type { Task, TaskInput, TaskStatus } from "@/lib/tasks";
import { cn } from "@/lib/utils";

const columnStatuses: TaskStatus[] = ["doing", "todo", "done"];

const statusDotClass: Record<TaskStatus, string> = {
  todo: "bg-status-todo",
  doing: "bg-status-doing",
  done: "bg-status-done",
};

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
    return <p className="text-muted-foreground">読み込み中...</p>;
  }

  if (loadError) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertDescription>{loadError}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>タスクを追加</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskForm formLabel="タスク追加" submitLabel="追加" resetOnSuccess onSubmit={handleCreate} />
        </CardContent>
      </Card>

      {actionError && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      <div className="grid max-w-md grid-cols-1 gap-4">
        {columnStatuses.map((status) => {
          const columnTasks = tasks.filter((task) => task.status === status);
          return (
            <section
              key={status}
              aria-label={statusLabels[status]}
              className="flex flex-col gap-3 rounded-xl bg-muted/50 p-3 ring-1 ring-foreground/5"
            >
              <div className="flex items-center gap-2 px-1">
                <span aria-hidden className={cn("size-2 rounded-full", statusDotClass[status])} />
                <h2 className="text-sm font-semibold">{statusLabels[status]}</h2>
                <Badge variant="secondary" className="ml-auto">
                  {columnTasks.length}
                </Badge>
              </div>
              {columnTasks.length === 0 ? (
                <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                  タスクはありません
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {columnTasks.map((task) => (
                    <li key={task.id}>
                      <Card size="sm" className="shadow-xs">
                        <CardHeader>
                          <CardTitle>
                            <h3>{task.title}</h3>
                          </CardTitle>
                          {task.description && <CardDescription>{task.description}</CardDescription>}
                        </CardHeader>
                        <CardContent className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-label={`${task.title}を編集`}
                            onClick={() => setEditingTask(task)}
                          >
                            <Pencil />
                            編集
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-label={`${task.title}を削除`}
                            onClick={() => setDeletingTask(task)}
                          >
                            <Trash2 />
                            削除
                          </Button>
                        </CardContent>
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      {editingTask && (
        <Dialog label="タスクを編集" onClose={() => setEditingTask(null)}>
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
