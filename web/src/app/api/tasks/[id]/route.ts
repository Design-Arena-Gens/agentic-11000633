import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceSupabaseClient } from "@/lib/supabase";
import type { AgentTask } from "@/types/agent";

const bodySchema = z.object({
  tasks: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      status: z.enum(["pending", "completed"]),
      confidence: z.number(),
      source: z.string().nullable().optional(),
    }),
  ),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }>; },
) {
  const supabase = getServiceSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 200 });
  }

  try {
    const payload = await request.json();
    const { tasks } = bodySchema.parse(payload);

    const { id } = await context.params;

    const { error } = await supabase
      .from("page_insights")
      .update({ tasks: tasks as AgentTask[] })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Task update failed:", error);
    const message =
      error instanceof z.ZodError
        ? error.issues.map((issue) => issue.message).join(", ")
        : error instanceof Error
          ? error.message
          : "Unexpected error updating tasks.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
