import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, FileUp, AlertTriangle, CheckCircle, Ban } from "lucide-react";
import { getCase } from "../../services/casesApi";
import { getDocuments } from "../../services/documentsApi";
import { runPipeline, getFindings, getPipelineStatus } from "../../services/pipelineApi";
import { StatusBadge } from "../../shared/components/Badge";
import { Spinner } from "../../shared/components/Spinner";
import { DocumentUpload, DocumentList } from "../documents/DocumentUpload";
import { FindingCard } from "../findings/FindingCard";
import { ReviewGate } from "../review/ReviewGate";
import type { Case, Document, Finding, AttorneyBrief } from "../../shared/types";

type Tab = "documents" | "findings" | "brief";

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [docs, setDocs] = useState<Document[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [brief, setBrief] = useState<AttorneyBrief | null>(null);
  const [tab, setTab] = useState<Tab>("documents");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!id) return;
    const [c, d, f, s] = await Promise.all([
      getCase(id),
      getDocuments(id),
      getFindings(id),
      getPipelineStatus(id),
    ]);
    setCaseData(c);
    setDocs(d);
    setFindings(f);
    if (s.attorney_brief) setBrief(s.attorney_brief);
  }, [id]);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  // Poll while processing
  useEffect(() => {
    if (caseData?.status !== "processing") return;
    const interval = setInterval(refresh, 4000);
    return () => clearInterval(interval);
  }, [caseData?.status, refresh]);

  const run = async () => {
    if (!id) return;
    setError("");
    setRunning(true);
    try {
      const updated = await runPipeline(id);
      setCaseData(updated);
      if (updated.status === "review_pending" || updated.status === "approved") {
        setTab("findings");
        await refresh();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#080b11] flex items-center justify-center">
      <Spinner size={32} />
    </div>
  );

  if (!caseData) return (
    <div className="min-h-screen bg-[#080b11] flex items-center justify-center">
      <p className="text-slate-400">Case not found.</p>
    </div>
  );

  const canRun = docs.length > 0 && !["processing", "approved", "rejected"].includes(caseData.status);
  const isProcessing = caseData.status === "processing" || running;
  const highCount = findings.filter(f => f.severity === "HIGH").length;

  return (
    <div className="min-h-screen bg-[#080b11]">
      {/* Header */}
      <header className="border-b border-white/5 px-8 py-5 sticky top-0 z-10 bg-[#080b11]/90 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => navigate("/")} className="text-slate-400 hover:text-white transition-colors shrink-0">
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-semibold text-white truncate">{caseData.title}</h1>
                <StatusBadge status={caseData.status} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">{id}</p>
            </div>
          </div>

          {/* Run pipeline button */}
          {isProcessing ? (
            <div className="flex items-center gap-2 text-sm text-blue-400 shrink-0">
              <Spinner size={16} /> Analyzing...
            </div>
          ) : canRun ? (
            <button onClick={run} className="btn-primary flex items-center gap-2 shrink-0">
              <Play size={15} /> Run Analysis
            </button>
          ) : caseData.status === "approved" ? (
            <div className="flex items-center gap-2 text-sm text-emerald-400 shrink-0">
              <CheckCircle size={16} /> Approved
            </div>
          ) : caseData.status === "blocked" ? (
            <div className="flex items-center gap-2 text-sm text-amber-400 shrink-0">
              <Ban size={16} /> Insufficient evidence
            </div>
          ) : null}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-8">
        {/* Stats row */}
        {findings.length > 0 && (
          <div className="flex gap-4 mb-6 flex-wrap">
            <div className="glass rounded-xl px-4 py-3 flex items-center gap-2">
              <span className="text-2xl font-bold text-white">{findings.length}</span>
              <span className="text-xs text-slate-400">findings</span>
            </div>
            <div className="glass rounded-xl px-4 py-3 flex items-center gap-2">
              <span className="text-2xl font-bold text-red-400">{highCount}</span>
              <span className="text-xs text-slate-400">HIGH severity</span>
            </div>
            <div className="glass rounded-xl px-4 py-3 flex items-center gap-2">
              <span className="text-2xl font-bold text-blue-400">{docs.length}</span>
              <span className="text-xs text-slate-400">document{docs.length !== 1 ? "s" : ""}</span>
            </div>
            {caseData.confidence_floor_met && (
              <div className="glass rounded-xl px-4 py-3 flex items-center gap-2 border-emerald-500/20 bg-emerald-500/5">
                <CheckCircle size={14} className="text-emerald-400" />
                <span className="text-xs text-emerald-400">Evidence threshold met</span>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="glass rounded-xl px-4 py-3 mb-6 border border-red-500/30 flex items-center gap-2">
            <AlertTriangle size={15} className="text-red-400" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 glass rounded-xl p-1 w-fit">
          {(["documents", "findings", "brief"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                tab === t
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t}
              {t === "findings" && findings.length > 0 && (
                <span className="ml-1.5 text-xs bg-blue-500/20 text-blue-400 rounded-md px-1.5 py-0.5">
                  {findings.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Documents tab */}
        {tab === "documents" && (
          <div>
            <DocumentUpload caseId={caseData.id} onUploaded={(doc) => setDocs(prev => [...prev, doc])} />
            <DocumentList docs={docs} />
            {docs.length > 0 && !["processing","approved","rejected"].includes(caseData.status) && (
              <div className="glass rounded-2xl p-5 mt-6 border border-blue-500/15 bg-blue-500/5">
                <p className="text-sm text-slate-300">
                  <span className="font-semibold text-blue-400">{docs.length} document{docs.length !== 1 ? "s" : ""} ready.</span>{" "}
                  Click <strong>Run Analysis</strong> above to start the agent pipeline.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Findings tab */}
        {tab === "findings" && (
          <div>
            {findings.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <p className="text-slate-400 text-sm">No findings yet. Run the pipeline to analyse uploaded documents.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {findings.map((f, i) => <FindingCard key={f.id} finding={f} index={i} />)}
              </div>
            )}
          </div>
        )}

        {/* Brief tab */}
        {tab === "brief" && (
          <div>
            {caseData.status === "review_pending" && brief ? (
              <ReviewGate
                caseId={caseData.id}
                brief={brief}
                onDecision={(approved) => {
                  setCaseData(prev => prev ? { ...prev, status: approved ? "approved" : "rejected" } : prev);
                }}
              />
            ) : caseData.status === "approved" && brief ? (
              <div className="space-y-4">
                <div className="glass rounded-2xl p-5 border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-3">
                  <CheckCircle size={18} className="text-emerald-400" />
                  <p className="text-sm text-emerald-300 font-medium">This case has been attorney-approved.</p>
                </div>
                <div className="glass rounded-2xl p-6">
                  <h2 className="text-xl font-bold text-white mb-2">{brief.case_title}</h2>
                  <p className="text-sm text-slate-400 leading-relaxed">{brief.executive_summary}</p>
                </div>
              </div>
            ) : caseData.status === "blocked" ? (
              <div className="glass rounded-2xl p-12 text-center border border-amber-500/15">
                <Ban size={32} className="text-amber-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">Insufficient Evidence</h3>
                <p className="text-sm text-slate-400">
                  No HIGH severity findings from document evidence. Upload additional supporting documents and re-run.
                </p>
              </div>
            ) : (
              <div className="glass rounded-2xl p-12 text-center">
                <p className="text-slate-400 text-sm">
                  Attorney brief will appear here after the pipeline finds evidence-backed HIGH severity findings.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
