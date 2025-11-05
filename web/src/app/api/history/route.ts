import { NextResponse } from "next/server";
import { fetchLatestInsights } from "@/lib/data";

export async function GET() {
  try {
    const data = await fetchLatestInsights(20);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("History fetch failed:", error);
    return NextResponse.json({ data: [] }, { status: 200 });
  }
}
