import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, AlertTriangle, CheckCircle, Ban, FileText } from "lucide-react";
import { getCase } from "../../services/casesApi";
import { getDocuments } from "../../services/documentsApi";
import { runPipeline, getFindings, getPipelineStatus } from "../../services/pipelineApi";
import { StatusBadge } from "../../shared/components/Badge";
import { Spinner } from "../../shared/components/Spinner";
import { DocumentUpload, DocumentList } from "../documents/DocumentUpload";
import { FindingCard } from "../findings/FindingCard";
import { ReviewGate } from "../review/ReviewGate";
import { ComplaintViewer } from "../complaint/ComplaintViewer";
import type { Case, Document, Finding, AttorneyBrief } from "../../shared/types";

type Tab = "documents" | "findings" | "brief" | "complaint";

function EvidenceStatusPanel({
  tipProvided,
  documentCount,
  crossValidation,
  unsupportedClaims,
  threshold,
}: {
  tipProvided: boolean;
  documentCount: number;
  crossValidation: string;
  unsupportedClaims: number;
  threshold: string;
}) {
  const items = [
    { label: "Whistleblower tip", value: tipProvided ? "Provided" : "Not provided", tone: tipProvided ? "text-blue-800" : "text-slate-600" },
    { label: "Uploaded documents", value: String(documentCount), tone: documentCount > 0 ? "text-blue-800" : "text-slate-600" },
    { label: "Cross-validation", value: crossValidation, tone: crossValidation === "Passed" ? "text-emerald-700" : crossValidation === "Running" ? "text-blue-800" : "text-amber-700" },
    { label: "Unsupported claims", value: String(unsupportedClaims), tone: unsupportedClaims === 0 ? "text-emerald-700" : "text-amber-700" },
    { label: "Evidence threshold", value: threshold, tone: threshold === "Met" ? "text-emerald-700" : threshold === "Checking" ? "text-blue-800" : "text-amber-700" },
  ];

  return (
    <section className="glass rounded-lg p-5 mb-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-950">Evidence Status</h2>
          <p className="text-xs text-slate-600 mt-1">
            Tip text is treated as an allegation. Uploaded documents determine whether a serious finding can be supported.
          </p>
        </div>
        <CheckCircle size={18} className={threshold === "Met" ? "text-emerald-700" : "text-slate-400"} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{item.label}</p>
            <p className={`text-sm font-semibold mt-1 ${item.tone}`}>{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function getEvidenceSource(finding: Finding, documents: Document[]) {
  if (finding.source_type === "TIP_ALLEGATION") return "Whistleblower tip only";
  if (finding.source_type === "AI_INFERENCE") return "AI inference across uploaded documents";
  if (finding.source_type === "PUBLIC_DATA_EVIDENCE") return "Public data evidence";

  const citedDocument = documents.find((doc) => finding.citation?.includes(doc.filename));
  if (citedDocument) return citedDocument.filename;
  if (documents.length === 1) return documents[0].filename;
  return "Uploaded document";
}

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
    <div className="page-shell flex items-center justify-center">
      <Spinner size={32} />
    </div>
  );

  if (!caseData) return (
    <div className="page-shell flex items-center justify-center">
      <p className="text-slate-600">Case not found.</p>
    </div>
  );

  const canRun = docs.length > 0 && !["processing", "approved", "rejected"].includes(caseData.status);
  const isProcessing = caseData.status === "processing" || running;
  const highCount = findings.filter(f => f.severity === "HIGH").length;
  const documentSupportedFindings = findings.filter(
    (f) => f.source_type === "DOCUMENT_EVIDENCE" && f.verification_status === "document_supported",
  ).length;
  const unsupportedClaims = findings.filter(
    (f) => f.source_type === "TIP_ALLEGATION" || f.verification_status === "unverified",
  ).length;
  const crossValidation = isProcessing
    ? "Running"
    : findings.length === 0
      ? "Pending"
      : documentSupportedFindings > 0 || caseData.confidence_floor_met
        ? "Passed"
        : caseData.status === "blocked"
          ? "Not passed"
          : "Needs review";
  const evidenceThreshold = caseData.confidence_floor_met
    ? "Met"
    : isProcessing
      ? "Checking"
      : findings.length > 0 || caseData.status === "blocked"
        ? "Not met"
        : "Pending";

  return (
    <div className="page-shell">
      {/* Header */}
      <header className="page-header px-8 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => navigate("/")} className="text-slate-500 hover:text-blue-700 transition-colors shrink-0">
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-semibold text-slate-950 truncate">{caseData.title}</h1>
                <StatusBadge status={caseData.status} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">{id}</p>
            </div>
          </div>

          {/* Run pipeline button */}
          {isProcessing ? (
            <div className="flex items-center gap-2 text-sm text-blue-700 shrink-0">
              <Spinner size={16} /> Analyzing...
            </div>
          ) : canRun ? (
            <button onClick={run} className="btn-primary flex items-center gap-2 shrink-0">
              <Play size={15} /> Run Analysis
            </button>
          ) : caseData.status === "approved" ? (
            <div className="flex items-center gap-2 text-sm text-emerald-700 shrink-0">
              <CheckCircle size={16} /> Approved
            </div>
          ) : caseData.status === "blocked" ? (
            <div className="flex items-center gap-2 text-sm text-amber-700 shrink-0">
              <Ban size={16} /> Insufficient evidence
            </div>
          ) : null}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-8">
        {/* Stats row */}
        {findings.length > 0 && (
          <div className="flex gap-4 mb-6 flex-wrap">
            <div className="glass rounded-lg px-4 py-3 flex items-center gap-2">
              <span className="text-2xl font-bold text-slate-950">{findings.length}</span>
              <span className="text-xs text-slate-600">findings</span>
            </div>
            <div className="glass rounded-lg px-4 py-3 flex items-center gap-2">
              <span className="text-2xl font-bold text-red-700">{highCount}</span>
              <span className="text-xs text-slate-600">HIGH severity</span>
            </div>
            <div className="glass rounded-lg px-4 py-3 flex items-center gap-2">
              <span className="text-2xl font-bold text-blue-700">{docs.length}</span>
              <span className="text-xs text-slate-600">document{docs.length !== 1 ? "s" : ""}</span>
            </div>
            {caseData.confidence_floor_met && (
              <div className="rounded-lg px-4 py-3 flex items-center gap-2 border border-emerald-200 bg-emerald-50">
                <CheckCircle size={14} className="text-emerald-700" />
                <span className="text-xs text-emerald-800">Evidence threshold met</span>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg px-4 py-3 mb-6 border border-red-200 bg-red-50 flex items-center gap-2">
            <AlertTriangle size={15} className="text-red-700" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <EvidenceStatusPanel
          tipProvided={Boolean(caseData.tip_text?.trim())}
          documentCount={docs.length}
          crossValidation={crossValidation}
          unsupportedClaims={unsupportedClaims}
          threshold={evidenceThreshold}
        />

        {/* Tabs */}
        <div className="flex gap-1 mb-6 glass rounded-lg p-1 w-fit">
          {(["documents", "findings", "brief", ...(caseData.status === "approved" && brief ? ["complaint" as Tab] : [])] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize ${
                tab === t
                  ? "bg-blue-700 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-100"
              }`}
            >
              {t === "complaint" ? "Complaint" : t}
              {t === "findings" && findings.length > 0 && (
                <span className={`ml-1.5 text-xs rounded-md px-1.5 py-0.5 ${
                  tab === t ? "bg-white/20 text-white" : "bg-blue-50 text-blue-700"
                }`}>
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
              <div className="rounded-lg p-5 mt-6 border border-blue-200 bg-blue-50">
                <p className="text-sm text-slate-700">
                  <span className="font-semibold text-blue-800">{docs.length} document{docs.length !== 1 ? "s" : ""} ready.</span>{" "}
                  Evidence analysis can run when you are ready.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Findings tab */}
        {tab === "findings" && (
          <div>
            {findings.length === 0 ? (
              <div className="glass rounded-lg p-12 text-center">
                <p className="text-slate-600 text-sm">No findings yet. Run the pipeline to analyse uploaded documents.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {findings.map((f, i) => (
                  <FindingCard
                    key={f.id}
                    finding={f}
                    index={i}
                    evidenceSource={getEvidenceSource(f, docs)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Complaint tab */}
        {tab === "complaint" && caseData.status === "approved" && brief && (
          <ComplaintViewer caseData={caseData} brief={brief} />
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
                <div className="rounded-lg p-5 border border-emerald-200 bg-emerald-50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle size={18} className="text-emerald-700" />
                    <p className="text-sm text-emerald-800 font-medium">This case has been attorney-approved.</p>
                  </div>
                  <button
                    onClick={() => setTab("complaint")}
                    className="btn-primary flex items-center gap-2 shrink-0"
                  >
                    <FileText size={14} /> View Formal Complaint
                  </button>
                </div>
                <div className="glass rounded-lg p-6">
                  <h2 className="text-xl font-bold text-slate-950 mb-2">{brief.case_title}</h2>
                  <p className="text-sm text-slate-600 leading-relaxed">{brief.executive_summary}</p>
                </div>
              </div>
            ) : caseData.status === "blocked" ? (
              <div className="glass rounded-lg p-12 text-center border border-amber-200">
                <Ban size={32} className="text-amber-700 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-slate-950 mb-2">Insufficient Evidence</h3>
                <p className="text-sm text-slate-600">
                  No HIGH severity findings from document evidence. Upload additional supporting documents and re-run.
                </p>
              </div>
            ) : (
              <div className="glass rounded-lg p-12 text-center">
                <p className="text-slate-600 text-sm">
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
