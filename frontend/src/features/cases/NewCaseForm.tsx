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
    <div className="page-shell flex flex-col">
      <header className="page-header px-8 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-slate-500 hover:text-blue-700 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-blue-700" />
            <span className="text-sm font-medium text-slate-950">New Investigation</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-8 py-16">
        <div className="w-full max-w-2xl">
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-5">
            <div className="flex items-start gap-3">
              <Shield size={18} className="text-blue-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-950">How CaseFile AI works</p>
                <p className="text-sm text-blue-900 mt-1 leading-relaxed">
                  Tip = allegation. Uploaded documents = evidence. AI only creates serious findings when documents support the claim.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-950">Open a new case</h1>
            <p className="text-slate-600 mt-2 text-sm">
              Provide the case title and optional whistleblower narrative. You'll upload documents next.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-6">
            <div className="glass rounded-lg p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Case Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Medicare Phantom Billing — Dr. Webb 2024"
                  className="field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Whistleblower Tip <span className="text-slate-500 font-normal">(optional — treated as allegation, not evidence)</span>
                </label>
                <textarea
                  value={tip}
                  onChange={(e) => setTip(e.target.value)}
                  placeholder="Describe what the whistleblower reported. This will be cross-checked against uploaded documents."
                  rows={5}
                  className="field resize-none"
                />
                <div className="flex items-center gap-2 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                  <FileText size={13} className="text-amber-700 shrink-0" />
                  <p className="text-xs text-amber-800">
                    Tip text alone cannot produce HIGH severity findings — document evidence required.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-lg px-4 py-3 border border-red-200 bg-red-50">
                <p className="text-red-700 text-sm">{error}</p>
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
