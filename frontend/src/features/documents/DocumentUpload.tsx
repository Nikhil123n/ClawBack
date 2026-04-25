import { useCallback, useState } from "react";
import { Upload, File, CheckCircle, X, AlertCircle } from "lucide-react";
import { uploadDocument } from "../../services/documentsApi";
import { Spinner } from "../../shared/components/Spinner";
import type { Document } from "../../shared/types";

const ACCEPTED = ".pdf,.docx,.doc,.txt,.csv";

interface Props {
  caseId: string;
  onUploaded: (doc: Document) => void;
}

export function DocumentUpload({ caseId, onUploaded }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const upload = useCallback(async (file: File) => {
    setError("");
    setUploading(true);
    try {
      const doc = await uploadDocument(caseId, file);
      onUploaded(doc);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }, [caseId, onUploaded]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }, [upload]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = "";
  };

  return (
    <label
      className={`block rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer
        ${dragging ? "border-blue-500/60 bg-blue-500/5 glow-blue" : "border-white/10 hover:border-white/20 hover:bg-white/2"}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <input type="file" accept={ACCEPTED} className="sr-only" onChange={onChange} />
      <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
        {uploading ? (
          <><Spinner size={28} /><p className="mt-3 text-sm text-slate-400">Uploading...</p></>
        ) : (
          <>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-3">
              <Upload size={22} className="text-blue-400" />
            </div>
            <p className="text-sm font-medium text-white">Drop a file or click to browse</p>
            <p className="text-xs text-slate-500 mt-1">PDF, DOCX, TXT, CSV — max 50MB</p>
          </>
        )}
      </div>
      {error && (
        <div className="flex items-center gap-2 px-5 pb-4 text-red-400 text-xs">
          <AlertCircle size={13} />{error}
        </div>
      )}
    </label>
  );
}

export function DocumentList({ docs }: { docs: Document[] }) {
  if (docs.length === 0) return null;
  const icons: Record<string, string> = { pdf: "📄", docx: "📝", doc: "📝", txt: "📃", csv: "📊" };

  return (
    <div className="space-y-2 mt-4">
      {docs.map((d) => (
        <div key={d.id} className="glass rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-lg">{icons[d.doc_type] ?? "📁"}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate">{d.filename}</p>
            <p className="text-xs text-slate-500">
              {d.doc_type.toUpperCase()} {d.page_count ? `· ${d.page_count} pages` : ""}
            </p>
          </div>
          <CheckCircle size={16} className="text-emerald-400 shrink-0" />
        </div>
      ))}
    </div>
  );
}
