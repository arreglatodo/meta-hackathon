export type Role = "user" | "assistant";

export interface ChatMessage {
  role: Role;
  content: string;
}

/** One step the agent took, shown in the trace panel and kept for audits. */
export interface TraceStep {
  kind: "model" | "tool";
  name: string;
  /** Short, human-readable summary of what went in. */
  input: string;
  /** Short, human-readable summary of what came out. */
  output: string;
  ms: number;
}

export interface AgentTurn {
  reply: string;
  trace: TraceStep[];
}
