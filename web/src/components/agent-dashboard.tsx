"use client";

import { useEffect, useMemo, useState } from "react";
import type { AgentRecord, AgentTask } from "@/types/agent";

interface AgentDashboardProps {
  initialHistory: AgentRecord[];
}

interface AnalyzeResponse {
  analysis: AgentRecord;
  saved: boolean;
  recordId: string | null;
}

export default function AgentDashboard({
  initialHistory,
}: AgentDashboardProps) {
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [history, setHistory] = useState<AgentRecord[]>(initialHistory ?? []);
  const [activeIndex, setActiveIndex] = useState(0);

  const activeRecord = useMemo(
    () => history[activeIndex] ?? null,
    [history, activeIndex],
  );

  useEffect(() => {
    let isCancelled = false;

    async function refreshHistory() {
      try {
        const response = await fetch("/api/history", { method: "GET" });
        if (!response.ok) {
          return;
        }
        const payload = await response.json();
        if (!isCancelled && Array.isArray(payload?.data)) {
          setHistory((prev) => {
            if (prev.length === 0) {
              return payload.data;
            }
            const existingIds = new Set(prev.map((item) => item.id));
            const merged = [
              ...prev,
              ...payload.data.filter((item: AgentRecord) => !existingIds.has(item.id)),
            ];
            return merged.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            );
          });
        }
      } catch (refreshError) {
        console.error("History refresh failed:", refreshError);
      }
    }

    refreshHistory();
    return () => {
      isCancelled = true;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!url.trim() && !content.trim()) {
      setError("Provide a URL or paste page content for analysis.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim() || undefined,
          content: content.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Failed to analyze the page.");
      }

      const payload: AnalyzeResponse = await response.json();
      const now = new Date().toISOString();

      const record: AgentRecord = {
        ...payload.analysis,
        id: payload.recordId ?? crypto.randomUUID(),
        createdAt: now,
        url: payload.analysis.metadata.url ?? url.trim(),
        saved: payload.saved,
      };

      setHistory((prev) => [record, ...prev]);
      setActiveIndex(0);
      setNotice(
        payload.saved
          ? "Analysis stored in Supabase."
          : "Analysis ready. Configure Supabase to enable persistence.",
      );
    } catch (submitError) {
      console.error(submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unexpected error during analysis.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTaskStatus = async (task: AgentTask) => {
    if (!activeRecord) {
      return;
    }

    const updatedTask: AgentTask = {
      ...task,
      status: task.status === "completed" ? "pending" : "completed",
    };

    const updatedHistory = history.map((item, index) =>
      index === activeIndex
        ? {
            ...item,
            tasks: item.tasks.map((current) =>
              current.id === task.id ? updatedTask : current,
            ),
          }
        : item,
    );

    setHistory(updatedHistory);

    if (!activeRecord.saved || !activeRecord.id) {
      return;
    }

    try {
      await fetch(`/api/tasks/${activeRecord.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: updatedHistory[activeIndex].tasks,
        }),
      });
    } catch (updateError) {
      console.error("Failed to persist task state:", updateError);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 bg-slate-950/90 px-4 py-10 font-sans text-slate-100 md:px-12">
      <header className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
          Agentic workspace
        </p>
        <h1 className="text-3xl font-semibold text-white md:text-4xl">
          Chrome browsing assistant
        </h1>
        <p className="max-w-2xl text-sm text-slate-400 md:text-base">
          Capture a live page from Chrome or paste its contents. The agent
          extracts key ideas, action items, and persists them to Supabase so you
          can resume your work on any device.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-6 rounded-2xl bg-slate-900/70 p-6 shadow-2xl shadow-slate-900/50 ring-1 ring-slate-800">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-slate-200">
                Page URL
                <span className="text-xs font-normal text-slate-500">
                  Optional when pasting HTML
                </span>
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50"
              />
            </div>

            <div>
              <label className="flex items-center justify-between text-sm font-medium text-slate-200">
                Page content
                <span className="text-xs font-normal text-slate-500">
                  Paste readable text or HTML
                </span>
              </label>
              <textarea
                rows={8}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Paste copied HTML or article text from Chrome"
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-500/50"
              >
                {isLoading ? "Analyzing…" : "Analyze page"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setUrl("");
                  setContent("");
                  setError(null);
                  setNotice(null);
                }}
                className="w-full rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
              >
                Reset
              </button>
            </div>
          </form>

          {error && (
            <p className="rounded-lg border border-rose-600/50 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </p>
          )}

          {notice && !error && (
            <p className="rounded-lg border border-emerald-600/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {notice}
            </p>
          )}

          {activeRecord ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-xl font-semibold text-white">
                    {activeRecord.title}
                  </h2>
                  <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">
                    {new Date(activeRecord.createdAt).toLocaleString()}
                  </span>
                </div>
                {activeRecord.url && (
                  <a
                    href={activeRecord.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-emerald-300 transition hover:text-emerald-200"
                  >
                    {activeRecord.url}
                  </a>
                )}
                <p className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm leading-6 text-slate-200">
                  {activeRecord.summary}
                </p>
              </div>

              {!!activeRecord.keyPoints.length && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                    Key takeaways
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {activeRecord.keyPoints.map((point) => (
                      <li
                        key={point}
                        className="rounded-xl border border-slate-800 bg-slate-950/30 px-3 py-2 text-sm text-slate-200"
                      >
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Action items
                </h3>
                <ul className="mt-3 space-y-2">
                  {activeRecord.tasks.map((task) => (
                    <li
                      key={task.id}
                      className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/30 px-3 py-3 text-sm text-slate-200"
                    >
                      <button
                        onClick={() => toggleTaskStatus(task)}
                        className={`mt-0.5 h-5 w-5 flex-shrink-0 rounded-full border ${
                          task.status === "completed"
                            ? "border-emerald-400 bg-emerald-400/30"
                            : "border-slate-600 bg-slate-900"
                        }`}
                        aria-label="Toggle task status"
                      />
                      <div className="space-y-1">
                        <p
                          className={`text-sm ${
                            task.status === "completed"
                              ? "text-slate-500 line-through"
                              : "text-slate-200"
                          }`}
                        >
                          {task.text}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span>
                            Confidence: {(task.confidence * 100).toFixed(0)}%
                          </span>
                          {task.source && (
                            <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[11px] uppercase tracking-wide">
                              {task.source}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                  {!activeRecord.tasks.length && (
                    <li className="rounded-xl border border-slate-800 bg-slate-950/30 px-3 py-3 text-sm text-slate-400">
                      No actionable tasks were detected on this page.
                    </li>
                  )}
                </ul>
              </div>

              {!!activeRecord.metadata.links.length && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                    Useful links
                  </h3>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {activeRecord.metadata.links.map((link) => (
                      <li key={`${link.href}-${link.label}`}>
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 transition hover:border-emerald-400 hover:text-emerald-200"
                        >
                          <span className="truncate">{link.label}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-10 text-center text-sm text-slate-400">
              Run an analysis to populate the agent workspace.
            </div>
          )}
        </div>

        <aside className="flex h-full flex-col gap-4 rounded-2xl bg-slate-900/60 p-6 shadow-lg shadow-slate-900/60 ring-1 ring-slate-800">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Recent analyses
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Tap an entry to load its summary and tasks.
            </p>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto pr-2">
            {history.map((record, index) => (
              <button
                key={record.id}
                onClick={() => setActiveIndex(index)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                  index === activeIndex
                    ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-100"
                    : "border-slate-800 bg-slate-950/20 text-slate-200 hover:border-slate-600"
                }`}
              >
                <p className="line-clamp-2 text-sm font-semibold">
                  {record.title}
                </p>
                <p className="mt-1 line-clamp-1 text-xs text-slate-400">
                  {record.url ?? "Manual capture"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(record.createdAt).toLocaleString()}
                </p>
              </button>
            ))}
            {!history.length && (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/20 px-4 py-6 text-center text-sm text-slate-500">
                Saved analyses will appear here once Supabase is configured.
              </div>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
