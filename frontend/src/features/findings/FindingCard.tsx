import { ChevronDown, ChevronUp, Quote, BarChart2 } from "lucide-react";
import { useState } from "react";
import { SeverityBadge, SourceBadge } from "../../shared/components/Badge";
import type { Finding } from "../../shared/types";

interface PeerBenchmark {
  cpt_code: string;
  description: string;
  provider_count: number;
  national_avg: number;
  deviation_multiplier: number;
}

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

function verificationLabel(status: Finding["verification_status"]) {
  if (status === "document_supported") return "Supported by uploaded document";
  if (status === "ai_inferred") return "Inferred from document context; attorney review needed";
  return "Unverified allegation";
}

export function FindingCard({
  finding,
  index,
  evidenceSource,
}: {
  finding: Finding;
  index: number;
  evidenceSource: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const statutes = finding.applicable_statutes
    ? JSON.parse(finding.applicable_statutes)
    : [];

  const confidencePct = Math.round(finding.confidence * 100);
  const barColor =
    finding.severity === "HIGH"   ? "#dc2626" :
    finding.severity === "MEDIUM" ? "#d97706" : "#64748b";
  const fraudLabel = FRAUD_LABELS[finding.fraud_type] ?? finding.fraud_type.replace(/_/g, " ");

  return (
    <div
      className="glass rounded-lg overflow-hidden transition-all duration-200 hover:border-blue-200"
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
        <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4">
          <div
            className="h-1 rounded-full transition-all duration-700"
            style={{ width: `${confidencePct}%`, backgroundColor: barColor }}
          />
        </div>

        <div className="space-y-2 text-sm">
          <p>
            <span className="font-medium text-slate-500">Fraud Type: </span>
            <span className="font-semibold text-slate-950">{fraudLabel}</span>
          </p>
          <p>
            <span className="font-medium text-slate-500">Severity: </span>
            <span className="font-semibold text-slate-950">{finding.severity}</span>
          </p>
          <p className="leading-relaxed">
            <span className="font-medium text-slate-500">Why flagged: </span>
            <span className="text-slate-700">{finding.description}</span>
          </p>
          <p>
            <span className="font-medium text-slate-500">Evidence source: </span>
            <span className="text-slate-700">{evidenceSource}</span>
          </p>
          <p className="leading-relaxed">
            <span className="font-medium text-slate-500">Citation: </span>
            <span className="text-slate-700 italic">"{finding.citation}"</span>
          </p>
          <p>
            <span className="font-medium text-slate-500">Verification: </span>
            <span className={`font-medium ${
              finding.verification_status === "document_supported" ? "text-emerald-700" :
              finding.verification_status === "ai_inferred"        ? "text-blue-700" : "text-amber-700"
            }`}>
              {verificationLabel(finding.verification_status)}
            </span>
          </p>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-900 mt-3 transition-colors"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? "Hide details" : "Show statutes & provenance"}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-slate-200 px-5 pb-5 pt-4 space-y-4">
          {/* Peer Benchmark */}
          {finding.peer_benchmark && (() => {
            const bm: PeerBenchmark = JSON.parse(finding.peer_benchmark);
            const isOutlier = bm.deviation_multiplier >= 2.0;
            return (
              <div className={`rounded-lg p-4 border-l-2 ${isOutlier ? "bg-red-50 border-red-400" : "bg-slate-50 border-slate-300"}`}>
                <div className="flex items-center gap-1.5 mb-3">
                  <BarChart2 size={13} className={isOutlier ? "text-red-600" : "text-slate-500"} />
                  <span className={`text-xs font-semibold uppercase tracking-wide ${isOutlier ? "text-red-700" : "text-slate-600"}`}>
                    CMS Peer Benchmark — CPT {bm.cpt_code}
                  </span>
                  {isOutlier && (
                    <span className="ml-auto text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                      Statistical Outlier
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mb-3">{bm.description}</p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-bold text-slate-900">{bm.provider_count}</p>
                    <p className="text-xs text-slate-500">Provider billed</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-500">{bm.national_avg}</p>
                    <p className="text-xs text-slate-500">National avg / 30 days</p>
                  </div>
                  <div>
                    <p className={`text-lg font-bold ${isOutlier ? "text-red-600" : "text-slate-700"}`}>
                      {bm.deviation_multiplier}x
                    </p>
                    <p className="text-xs text-slate-500">Deviation</p>
                  </div>
                </div>
                {isOutlier && (
                  <p className="mt-3 text-xs text-red-700 font-medium">
                    Provider bills CPT {bm.cpt_code} at {bm.deviation_multiplier}x the national average — statistically consistent with fraudulent upcoding or duplicate billing patterns.
                  </p>
                )}
              </div>
            );
          })()}

          {/* Citation */}
          <div className="bg-blue-50 rounded-lg p-4 border-l-2 border-blue-300">
            <div className="flex items-center gap-1.5 mb-2">
              <Quote size={12} className="text-blue-700" />
              <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">Source Citation</span>
            </div>
            <p className="text-sm text-slate-700 italic leading-relaxed">"{finding.citation}"</p>
          </div>

          {/* Verification */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Verification:</span>
            <span className={`text-xs font-medium ${
              finding.verification_status === "document_supported" ? "text-emerald-700" :
              finding.verification_status === "ai_inferred"        ? "text-blue-700" : "text-amber-700"
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
                  <span key={i} className="text-xs bg-slate-100 border border-slate-200 rounded-md px-2.5 py-1 text-slate-700 font-mono">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Provenance */}
          {finding.model_version && (
            <p className="text-xs text-slate-500 font-mono">
              model: {finding.model_version} · prompt: {finding.prompt_version}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
