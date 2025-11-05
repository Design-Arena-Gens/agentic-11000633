export type AgentTaskStatus = "pending" | "completed";

export interface AgentTask {
  id: string;
  text: string;
  status: AgentTaskStatus;
  confidence: number;
  source?: string | null;
}

export interface AnalysisMetadata {
  url?: string | null;
  headings: string[];
  links: { href: string; label: string }[];
  extractedAt: string;
  wordCount: number;
}

export interface AnalysisResult {
  title: string;
  summary: string;
  keyPoints: string[];
  tasks: AgentTask[];
  metadata: AnalysisMetadata;
}

export interface AgentRecord extends AnalysisResult {
  id: string;
  createdAt: string;
  url?: string | null;
  saved?: boolean;
}
