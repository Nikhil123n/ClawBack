import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, FileText } from "lucide-react";
import { createCase } from "../../services/casesApi";
import { Spinner } from "../../shared/components/Spinner";

export default function NewCaseForm() {
  const [title, setTitle] = useState("");
  const [tip, setTip] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError("");
    try {
      const c = await createCase({ title: title.trim(), tip_text: tip.trim() || undefined });
      navigate(`/cases/${c.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080b11] flex flex-col">
      <header className="border-b border-white/5 px-8 py-5">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-blue-400" />
            <span className="text-sm font-medium text-white">New Investigation</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-8 py-16">
        <div className="w-full max-w-2xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Open a new case</h1>
            <p className="text-slate-400 mt-2 text-sm">
              Provide the case title and optional whistleblower narrative. You'll upload documents next.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-6">
            <div className="glass rounded-2xl p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Case Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Medicare Phantom Billing — Dr. Webb 2024"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Whistleblower Tip <span className="text-slate-600 font-normal">(optional — treated as allegation, not evidence)</span>
                </label>
                <textarea
                  value={tip}
                  onChange={(e) => setTip(e.target.value)}
                  placeholder="Describe what the whistleblower reported. This will be cross-checked against uploaded documents."
                  rows={5}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all resize-none"
                />
                <div className="flex items-center gap-2 mt-2">
                  <FileText size={12} className="text-amber-400" />
                  <p className="text-xs text-amber-400/80">
                    Tip text alone cannot produce HIGH severity findings — document evidence required.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="glass rounded-xl px-4 py-3 border border-red-500/30">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={() => navigate("/")} className="btn-ghost flex-1">Cancel</button>
              <button type="submit" disabled={loading || !title.trim()} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {loading ? <><Spinner size={16} color="white" /> Creating...</> : "Create Case →"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
