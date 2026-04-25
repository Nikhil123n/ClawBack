import { apiFetch } from "../shared/utils/api";
import type { Case, Finding, PipelineStatus } from "../shared/types";

export const runPipeline = (caseId: string) =>
  apiFetch<Case>(`/pipeline/${caseId}/run`, { method: "POST" });

export const getPipelineStatus = (caseId: string) =>
  apiFetch<PipelineStatus>(`/pipeline/${caseId}/status`);

export const getFindings = (caseId: string) =>
  apiFetch<Finding[]>(`/findings/${caseId}`);
