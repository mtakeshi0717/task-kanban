import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

export const taskStatuses = ["todo", "doing", "done"] as const;
export type TaskStatus = (typeof taskStatuses)[number];

export type Task = Omit<Database["public"]["Tables"]["tasks"]["Row"], "status"> & {
  status: TaskStatus;
};

export type TaskInput = {
  title: string;
  description: string;
  status: TaskStatus;
};

const emptyTitleMessage = "タイトルを入力してください";

const toPayload = (input: TaskInput) => {
  const title = input.title.trim();
  if (title === "") {
    throw new Error(emptyTitleMessage);
  }
  return {
    title,
    description: input.description.trim() === "" ? null : input.description,
    status: input.status,
  };
};

export const fetchTasks = async (): Promise<Task[]> => {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  return data as Task[];
};

export const createTask = async (input: TaskInput): Promise<Task> => {
  const { data, error } = await supabase.from("tasks").insert(toPayload(input)).select().single();
  if (error) {
    throw new Error(error.message);
  }
  return data as Task;
};

export const updateTask = async (id: string, input: TaskInput): Promise<Task> => {
  const { data, error } = await supabase
    .from("tasks")
    .update(toPayload(input))
    .eq("id", id)
    .select()
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return data as Task;
};

export const deleteTask = async (id: string): Promise<void> => {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
};
