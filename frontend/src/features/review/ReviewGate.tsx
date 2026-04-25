import { useState } from "react";
import { ShieldCheck, ShieldX, AlertTriangle } from "lucide-react";
import { approveCase } from "../../services/casesApi";
import { Spinner } from "../../shared/components/Spinner";
import type { AttorneyBrief } from "../../shared/types";

interface Props {
  caseId: string;
  brief: AttorneyBrief;
  onDecision: (approved: boolean) => void;
}

export function ReviewGate({ caseId, brief, onDecision }: Props) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  const decide = async (approved: boolean) => {
    setLoading(approved ? "approve" : "reject");
    try {
      await approveCase(caseId, approved);
      onDecision(approved);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Disclaimer banner */}
      <div className="rounded-lg p-5 border border-amber-200 bg-amber-50">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-700 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Attorney Review Required</p>
            <p className="text-xs text-amber-800 mt-1">{brief.disclaimer}</p>
          </div>
        </div>
      </div>

      {/* Brief content */}
      <div className="glass rounded-lg p-6 space-y-5">
        <div>
          <h2 className="text-xl font-bold text-slate-950">{brief.case_title}</h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">{brief.executive_summary}</p>
        </div>

        {brief.allegations.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Allegations</h3>
            <div className="space-y-3">
              {brief.allegations.map((a, i) => (
                <div key={i} className="bg-slate-50 rounded-lg p-4 border-l-2 border-blue-300">
                  <p className="text-sm text-slate-950 font-medium">{a.allegation}</p>
                  <p className="text-xs text-slate-500 mt-1 font-mono">{a.statutory_basis}</p>
                  <p className="text-xs text-slate-600 mt-1 italic">"{a.supporting_evidence}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {brief.recommended_next_steps.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Recommended Next Steps</h3>
            <ul className="space-y-2">
              {brief.recommended_next_steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 text-xs flex items-center justify-center shrink-0 mt-0.5 font-semibold">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Approve / Reject */}
      <div className="flex gap-3">
        <button
          onClick={() => decide(false)}
          disabled={!!loading}
          className="flex-1 btn-ghost flex items-center justify-center gap-2 border-red-200 text-red-700 hover:bg-red-50"
        >
          {loading === "reject" ? <Spinner size={16} color="#f87171" /> : <ShieldX size={16} />}
          Reject & Return
        </button>
        <button
          onClick={() => decide(true)}
          disabled={!!loading}
          className="flex-1 btn-primary flex items-center justify-center gap-2"
          style={{ background: "#047857" }}
        >
          {loading === "approve" ? <Spinner size={16} color="white" /> : <ShieldCheck size={16} />}
          Approve Case
        </button>
      </div>
    </div>
  );
}
