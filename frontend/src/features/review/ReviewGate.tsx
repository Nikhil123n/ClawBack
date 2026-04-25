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
      <div className="glass rounded-2xl p-5 border border-amber-500/20 bg-amber-500/5">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300">Attorney Review Required</p>
            <p className="text-xs text-amber-400/70 mt-1">{brief.disclaimer}</p>
          </div>
        </div>
      </div>

      {/* Brief content */}
      <div className="glass rounded-2xl p-6 space-y-5">
        <div>
          <h2 className="text-xl font-bold text-white">{brief.case_title}</h2>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">{brief.executive_summary}</p>
        </div>

        {brief.allegations.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Allegations</h3>
            <div className="space-y-3">
              {brief.allegations.map((a, i) => (
                <div key={i} className="bg-white/3 rounded-xl p-4 border-l-2 border-blue-500/30">
                  <p className="text-sm text-white font-medium">{a.allegation}</p>
                  <p className="text-xs text-slate-500 mt-1 font-mono">{a.statutory_basis}</p>
                  <p className="text-xs text-slate-400 mt-1 italic">"{a.supporting_evidence}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {brief.recommended_next_steps.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Recommended Next Steps</h3>
            <ul className="space-y-2">
              {brief.recommended_next_steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-blue-500/15 text-blue-400 text-xs flex items-center justify-center shrink-0 mt-0.5 font-semibold">
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
          className="flex-1 btn-ghost flex items-center justify-center gap-2 border-red-500/20 text-red-400 hover:bg-red-500/5"
        >
          {loading === "reject" ? <Spinner size={16} color="#f87171" /> : <ShieldX size={16} />}
          Reject & Return
        </button>
        <button
          onClick={() => decide(true)}
          disabled={!!loading}
          className="flex-1 btn-primary flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #00d294, #005f46)" }}
        >
          {loading === "approve" ? <Spinner size={16} color="white" /> : <ShieldCheck size={16} />}
          Approve Case
        </button>
      </div>
    </div>
  );
}
