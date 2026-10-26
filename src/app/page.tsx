import Link from "next/link";
import { QuoteFlow } from "@/components/QuoteFlow";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-4 px-4 py-6">
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-semibold">
          HomePlan <span className="font-normal text-muted">by ArreglaTodo</span>
        </h1>
        <Link href="/chat" className="text-sm text-muted underline">
          chat
        </Link>
      </header>
      <QuoteFlow />
    </main>
  );
}
