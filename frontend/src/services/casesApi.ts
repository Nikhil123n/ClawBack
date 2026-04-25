import { apiFetch } from "../shared/utils/api";
import type { Case } from "../shared/types";

export const getCases = () => apiFetch<Case[]>("/cases/");
export const getCase = (id: string) => apiFetch<Case>(`/cases/${id}`);
export const createCase = (body: { title: string; tip_text?: string }) =>
  apiFetch<Case>("/cases/", { method: "POST", body: JSON.stringify(body) });
export const approveCase = (id: string, approved: boolean) =>
  apiFetch<Case>(`/cases/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ attorney_approved: approved }),
  });
