interface BadgeProps { label: string; variant: "high" | "medium" | "low" | "blue" | "emerald" | "slate" }

const styles = {
  high:    "bg-red-50 text-red-700 border border-red-200",
  medium:  "bg-amber-50 text-amber-700 border border-amber-200",
  low:     "bg-slate-100 text-slate-600 border border-slate-200",
  blue:    "bg-blue-50 text-blue-700 border border-blue-200",
  emerald: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  slate:   "bg-slate-100 text-slate-700 border border-slate-200",
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
