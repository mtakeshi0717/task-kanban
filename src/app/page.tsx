import KanbanBoard from "@/components/KanbanBoard";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">タスクカンバン</h1>
      <KanbanBoard />
    </main>
  );
}
