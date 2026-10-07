import KanbanBoard from "@/components/KanbanBoard";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">タスクカンバン</h1>
        <p className="mt-1 text-sm text-muted-foreground">未着手・進行中・完了でタスクを管理します</p>
      </header>
      <KanbanBoard />
    </main>
  );
}
