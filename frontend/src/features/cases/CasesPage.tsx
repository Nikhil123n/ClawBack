import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Shield, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { getCases } from "../../services/casesApi";
import { StatusBadge } from "../../shared/components/Badge";
import { Spinner } from "../../shared/components/Spinner";
import type { Case } from "../../shared/types";

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="glass rounded-lg p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-950">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getCases().then(setCases).finally(() => setLoading(false));
  }, []);

  const stats = {
    total: cases.length,
    pending: cases.filter((c) => c.status === "review_pending").length,
    processing: cases.filter((c) => c.status === "processing").length,
    approved: cases.filter((c) => c.status === "approved").length,
  };

  return (
    <div className="page-shell">
      {/* Header */}
      <header className="page-header px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-700 flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-950 tracking-tight">CaseFile AI</h1>
              <p className="text-xs text-slate-500">Fraud Intelligence Platform</p>
            </div>
          </div>
          <button onClick={() => navigate("/cases/new")} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New Case
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-10">
        {/* Hero */}
        <div className="mb-10">
          <h2 className="text-4xl font-bold tracking-tight">
            <span className="gradient-text">Active Investigations</span>
          </h2>
          <p className="text-slate-600 mt-2 text-sm">
            AI-powered FCA fraud intelligence. Every finding is citation-grounded.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard icon={Shield}       label="Total Cases"    value={stats.total}      color="bg-blue-50 text-blue-700 border border-blue-100" />
          <StatCard icon={Clock}        label="Processing"     value={stats.processing} color="bg-indigo-50 text-indigo-700 border border-indigo-100" />
          <StatCard icon={AlertTriangle} label="Pending Review" value={stats.pending}    color="bg-amber-50 text-amber-700 border border-amber-100" />
          <StatCard icon={CheckCircle}  label="Approved"       value={stats.approved}   color="bg-emerald-50 text-emerald-700 border border-emerald-100" />
        </div>

        {/* Cases grid */}
        {loading ? (
          <div className="flex justify-center py-24"><Spinner size={32} /></div>
        ) : cases.length === 0 ? (
          <div className="glass rounded-lg p-12 text-center">
            <div className="w-16 h-16 rounded-lg bg-blue-50 flex items-center justify-center mx-auto mb-4 border border-blue-100">
              <Shield size={28} className="text-blue-700" />
            </div>
            <h3 className="text-xl font-semibold text-slate-950 mb-2">No cases yet</h3>
            <p className="text-slate-600 text-sm mb-6">Create your first fraud investigation case to get started.</p>
            <button onClick={() => navigate("/cases/new")} className="btn-primary">
              Create First Case
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cases.map((c, i) => (
              <button
                key={c.id}
                onClick={() => navigate(`/cases/${c.id}`)}
                className="glass rounded-lg p-6 text-left hover:border-blue-200 hover:-translate-y-1 transition-all duration-200 group"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <StatusBadge status={c.status} />
                  {c.confidence_floor_met && (
                    <span className="text-xs text-emerald-700 font-medium">Evidence confirmed</span>
                  )}
                </div>
                <h3 className="font-semibold text-slate-950 text-sm leading-snug mb-2 group-hover:text-blue-700 transition-colors">
                  {c.title}
                </h3>
                {c.tip_text && (
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{c.tip_text}</p>
                )}
                <p className="text-xs text-slate-500 mt-4">
                  {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
