import { useCallback, useState } from "react";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
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
      className={`block rounded-lg border-2 border-dashed transition-all duration-200 cursor-pointer
        ${dragging ? "border-blue-500 bg-blue-50 glow-blue" : "border-slate-300 bg-white hover:border-blue-300 hover:bg-blue-50/50"}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <input type="file" accept={ACCEPTED} className="sr-only" onChange={onChange} />
      <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
        {uploading ? (
          <><Spinner size={28} /><p className="mt-3 text-sm text-slate-600">Uploading...</p></>
        ) : (
          <>
            <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center mb-3">
              <Upload size={22} className="text-blue-700" />
            </div>
            <p className="text-sm font-medium text-slate-950">Drop a file or click to browse</p>
            <p className="text-xs text-slate-500 mt-1">PDF, DOCX, TXT, CSV — max 50MB</p>
          </>
        )}
      </div>
      {error && (
        <div className="flex items-center gap-2 px-5 pb-4 text-red-700 text-xs">
          <AlertCircle size={13} />{error}
        </div>
      )}
    </label>
  );
}

export function DocumentList({ docs }: { docs: Document[] }) {
  if (docs.length === 0) return null;

  return (
    <div className="space-y-2 mt-4">
      {docs.map((d) => (
        <div key={d.id} className="glass rounded-lg px-4 py-3 flex items-center gap-3">
          <FileText size={18} className="text-blue-700 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-950 font-medium truncate">{d.filename}</p>
            <p className="text-xs text-slate-500">
              {d.doc_type.toUpperCase()} {d.page_count ? `· ${d.page_count} pages` : ""}
            </p>
          </div>
          <CheckCircle size={16} className="text-emerald-600 shrink-0" />
        </div>
      ))}
    </div>
  );
}
