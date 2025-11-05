import type { AgentTask } from "@/types/agent";

export interface Database {
  public: {
    Tables: {
      page_insights: {
        Row: {
          id: string;
          created_at: string;
          url: string | null;
          title: string | null;
          summary: string | null;
          key_points: string[] | null;
          tasks: AgentTask[] | null;
          metadata: Record<string, unknown> | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          url?: string | null;
          title?: string | null;
          summary?: string | null;
          key_points?: string[] | null;
          tasks?: AgentTask[] | null;
          metadata?: Record<string, unknown> | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          url?: string | null;
          title?: string | null;
          summary?: string | null;
          key_points?: string[] | null;
          tasks?: AgentTask[] | null;
          metadata?: Record<string, unknown> | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
