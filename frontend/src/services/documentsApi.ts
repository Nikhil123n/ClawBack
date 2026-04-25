import type { Document } from "../shared/types";
import { API_BASE } from "../shared/utils/api";

export const getDocuments = (caseId: string): Promise<Document[]> =>
  fetch(`${API_BASE}/documents/${caseId}`).then((r) => r.json());

export const uploadDocument = async (caseId: string, file: File): Promise<Document> => {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/documents/${caseId}/upload`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Upload failed");
  }
  return res.json();
};
