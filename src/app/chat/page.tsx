import { ChatSimulator } from "@/components/ChatSimulator";

export default async function ChatPage({ searchParams }: { searchParams: Promise<{ telefono?: string }> }) {
  const { telefono } = await searchParams;
  if (telefono !== undefined) return <ChatSimulator phone />;
  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-4 px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold">HomePlan · chat</h1>
        <p className="text-sm text-muted">WhatsApp simulator: chat on the left, every agent step on the right.</p>
      </header>
      <ChatSimulator />
    </main>
  );
}
