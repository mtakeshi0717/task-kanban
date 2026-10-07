"use client";

import { useId, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { taskStatuses } from "@/lib/tasks";
import type { TaskInput, TaskStatus } from "@/lib/tasks";

export const statusLabels: Record<TaskStatus, string> = {
  todo: "未着手",
  doing: "進行中",
  done: "完了",
};

const statusItems = taskStatuses.map((status) => ({ value: status, label: statusLabels[status] }));

type TaskFormProps = {
  formLabel: string;
  submitLabel: string;
  initialValues?: TaskInput;
  resetOnSuccess?: boolean;
  onSubmit: (input: TaskInput) => Promise<void>;
  onCancel?: () => void;
};

const emptyValues: TaskInput = { title: "", description: "", status: "todo" };

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
  const fieldId = useId();

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
    <form aria-label={formLabel} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${fieldId}-title`}>タイトル</Label>
        <Input
          id={`${fieldId}-title`}
          type="text"
          value={values.title}
          onChange={(event) => setValues({ ...values, title: event.target.value })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${fieldId}-description`}>説明</Label>
        <Textarea
          id={`${fieldId}-description`}
          value={values.description}
          onChange={(event) => setValues({ ...values, description: event.target.value })}
          rows={2}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${fieldId}-status`}>ステータス</Label>
        <Select
          items={statusItems}
          value={values.status}
          onValueChange={(status) => status && setValues({ ...values, status: status as TaskStatus })}
        >
          <SelectTrigger id={`${fieldId}-status`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {statusItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {errorMessage && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            キャンセル
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
