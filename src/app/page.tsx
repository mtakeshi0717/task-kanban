import KanbanBoard from "@/components/KanbanBoard";
import Image from "next/image";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <header className="mb-8">
        <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight">
          <Image src="/drifloon.png" alt="" width={48} height={48} className="shrink-0" />
          優ちゃんの読書記録
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">未着手・進行中・完了でタスクを管理します</p>
      </header>
      <KanbanBoard />
    </main>
  );
}
