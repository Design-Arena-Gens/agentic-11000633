import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { analyzePage } from "@/lib/analyzer";
import { getServiceSupabaseClient } from "@/lib/supabase";
import type { AgentRecord } from "@/types/agent";
import type { Database } from "@/types/database";
import { z } from "zod";

const requestSchema = z
  .object({
    url: z.string().url().optional(),
    content: z.string().min(1).optional(),
  })
  .refine((value) => value.url || value.content, {
    message: "Provide a URL or enriched content.",
    path: ["content"],
  });

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { url, content } = requestSchema.parse(payload);

    let rawHtml = content ?? "";

    if (!rawHtml && url) {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
        },
      });

      if (!response.ok) {
        throw new Error(`Unable to fetch ${url}: ${response.statusText}`);
      }

      rawHtml = await response.text();
    }

    if (!rawHtml) {
      throw new Error("No content available for analysis.");
    }

    const analysis = analyzePage(rawHtml, { url });

    let recordId: string | null = null;
    let saved = false;

    const supabase = getServiceSupabaseClient();

    if (supabase) {
      const insertPayload: Database["public"]["Tables"]["page_insights"]["Insert"] = {
        url: url ?? analysis.metadata.url ?? null,
        title: analysis.title,
        summary: analysis.summary,
        key_points: analysis.keyPoints,
        tasks: analysis.tasks,
        metadata: analysis.metadata as unknown as Record<string, unknown>,
      };

      const { data, error } = await supabase
        .from("page_insights")
        .insert(insertPayload)
        .select("*")
        .single();

      if (error) {
        console.error("Supabase insert failed:", error.message);
      } else if (data) {
        const inserted = data as Database["public"]["Tables"]["page_insights"]["Row"];
        recordId = inserted.id;
        saved = true;
      }
    }

    const responsePayload: {
      analysis: AgentRecord;
      saved: boolean;
      recordId: string | null;
    } = {
      analysis: {
        ...analysis,
        id: recordId ?? randomUUID(),
        createdAt: new Date().toISOString(),
        url: url ?? analysis.metadata.url ?? null,
        saved,
      },
      saved,
      recordId,
    };

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("Analysis failure:", error);
    const message =
      error instanceof z.ZodError
        ? error.issues.map((issue) => issue.message).join("; ")
        : error instanceof Error
          ? error.message
          : "Unexpected analysis failure.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
