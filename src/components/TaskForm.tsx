"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { taskStatuses } from "@/lib/tasks";
import type { TaskInput, TaskStatus } from "@/lib/tasks";

export const statusLabels: Record<TaskStatus, string> = {
  todo: "未着手",
  doing: "進行中",
  done: "完了",
};

type TaskFormProps = {
  formLabel: string;
  submitLabel: string;
  initialValues?: TaskInput;
  resetOnSuccess?: boolean;
  onSubmit: (input: TaskInput) => Promise<void>;
  onCancel?: () => void;
};

const emptyValues: TaskInput = { title: "", description: "", status: "todo" };

const fieldClass =
  "w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800";

export default function TaskForm({
  formLabel,
  submitLabel,
  initialValues = emptyValues,
  resetOnSuccess = false,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const [values, setValues] = useState<TaskInput>(initialValues);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await onSubmit(values);
      if (resetOnSuccess) {
        setValues(emptyValues);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "処理に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form aria-label={formLabel} onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        タイトル
        <input
          type="text"
          value={values.title}
          onChange={(event) => setValues({ ...values, title: event.target.value })}
          className={fieldClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        説明
        <textarea
          value={values.description}
          onChange={(event) => setValues({ ...values, description: event.target.value })}
          rows={2}
          className={fieldClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        ステータス
        <select
          value={values.status}
          onChange={(event) => setValues({ ...values, status: event.target.value as TaskStatus })}
          className={fieldClass}
        >
          {taskStatuses.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </label>
      {errorMessage && (
        <p role="alert" className="text-sm text-red-600">
          {errorMessage}
        </p>
      )}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
          >
            キャンセル
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
