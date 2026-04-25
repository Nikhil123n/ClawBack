interface BadgeProps { label: string; variant: "high" | "medium" | "low" | "blue" | "emerald" | "slate" }

const styles = {
  high:    "bg-red-500/15 text-red-400 border border-red-500/30",
  medium:  "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  low:     "bg-slate-500/15 text-slate-400 border border-slate-500/30",
  blue:    "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  emerald: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  slate:   "bg-slate-700/40 text-slate-400 border border-slate-600/30",
};

export function Badge({ label, variant }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold tracking-wide uppercase ${styles[variant]}`}>
      {label}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: "HIGH" | "MEDIUM" | "LOW" }) {
  const map = { HIGH: "high", MEDIUM: "medium", LOW: "low" } as const;
  return <Badge label={severity} variant={map[severity]} />;
}

export function SourceBadge({ source }: { source: string }) {
  if (source === "DOCUMENT_EVIDENCE") return <Badge label="Document" variant="emerald" />;
  if (source === "TIP_ALLEGATION")    return <Badge label="Tip only" variant="medium" />;
  if (source === "AI_INFERENCE")      return <Badge label="Inferred" variant="blue" />;
  return <Badge label={source} variant="slate" />;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, "emerald" | "blue" | "medium" | "high" | "slate"> = {
    intake: "slate", processing: "blue", review_pending: "medium",
    approved: "emerald", rejected: "high", blocked: "medium", failed: "high",
  };
  return <Badge label={status.replace("_", " ")} variant={map[status] ?? "slate"} />;
}
