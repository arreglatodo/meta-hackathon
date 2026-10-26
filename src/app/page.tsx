import { ChatSimulator } from "@/components/ChatSimulator";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-4 px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold">
          HomePlan <span className="text-accent">·</span>{" "}
          <span className="font-normal text-muted">by ArreglaTodo</span>
        </h1>
        <p className="text-sm text-muted">
          WhatsApp agent for recurring home cleaning, built on Meta Muse models. Chat on the left,
          every step the agent takes on the right.
        </p>
      </header>
      <ChatSimulator />
    </main>
  );
}
