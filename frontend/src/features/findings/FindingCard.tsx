import { ChevronDown, ChevronUp, Quote } from "lucide-react";
import { useState } from "react";
import { SeverityBadge, SourceBadge } from "../../shared/components/Badge";
import type { Finding } from "../../shared/types";

const FRAUD_LABELS: Record<string, string> = {
  phantom_billing:     "Phantom Billing",
  duplicate_billing:   "Duplicate Billing",
  upcoding:            "Upcoding",
  unbundling:          "Unbundling",
  kickback:            "Kickback",
  medically_unnecessary: "Medically Unnecessary",
  identity_theft:      "Identity Theft",
  corporate_shell:     "Corporate Shell",
};

export function FindingCard({ finding, index }: { finding: Finding; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const statutes = finding.applicable_statutes
    ? JSON.parse(finding.applicable_statutes)
    : [];

  const confidencePct = Math.round(finding.confidence * 100);
  const barColor =
    finding.severity === "HIGH"   ? "#ef4444" :
    finding.severity === "MEDIUM" ? "#edb200" : "#64748b";

  return (
    <div
      className="glass rounded-2xl overflow-hidden transition-all duration-200 hover:border-white/12"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <SeverityBadge severity={finding.severity} />
            <SourceBadge source={finding.source_type} />
          </div>
          <span className="text-xs text-slate-500 shrink-0">
            {confidencePct}% confidence
          </span>
        </div>

        {/* Confidence bar */}
        <div className="w-full bg-white/5 rounded-full h-1 mb-4">
          <div
            className="h-1 rounded-full transition-all duration-700"
            style={{ width: `${confidencePct}%`, backgroundColor: barColor }}
          />
        </div>

        <h3 className="font-semibold text-white text-sm mb-1">
          {FRAUD_LABELS[finding.fraud_type] ?? finding.fraud_type.replace(/_/g, " ")}
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
          {finding.description}
        </p>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 mt-3 transition-colors"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? "Hide details" : "Show citation & statutes"}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-white/5 px-5 pb-5 pt-4 space-y-4">
          {/* Citation */}
          <div className="bg-white/3 rounded-xl p-4 border-l-2 border-blue-500/40">
            <div className="flex items-center gap-1.5 mb-2">
              <Quote size={12} className="text-blue-400" />
              <span className="text-xs font-medium text-blue-400 uppercase tracking-wide">Source Citation</span>
            </div>
            <p className="text-sm text-slate-300 italic leading-relaxed">"{finding.citation}"</p>
          </div>

          {/* Verification */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Verification:</span>
            <span className={`text-xs font-medium ${
              finding.verification_status === "document_supported" ? "text-emerald-400" :
              finding.verification_status === "ai_inferred"        ? "text-blue-400" : "text-amber-400"
            }`}>
              {finding.verification_status.replace(/_/g, " ")}
            </span>
          </div>

          {/* Statutes */}
          {statutes.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide font-medium">Applicable Statutes</p>
              <div className="flex flex-wrap gap-2">
                {statutes.map((s: string, i: number) => (
                  <span key={i} className="text-xs bg-white/5 border border-white/8 rounded-lg px-2.5 py-1 text-slate-300 font-mono">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Provenance */}
          {finding.model_version && (
            <p className="text-xs text-slate-600 font-mono">
              model: {finding.model_version} · prompt: {finding.prompt_version}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
