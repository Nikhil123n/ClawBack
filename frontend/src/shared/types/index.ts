export interface Case {
  id: string;
  title: string;
  tip_text: string | null;
  status: "intake" | "processing" | "review_pending" | "approved" | "rejected" | "blocked" | "failed";
  confidence_floor_met: boolean;
  attorney_approved: boolean | null;
  attorney_brief: string | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  case_id: string;
  filename: string;
  doc_type: string;
  page_count: number | null;
  parsed_at: string | null;
  uploaded_at: string;
}

export interface Finding {
  id: string;
  case_id: string;
  fraud_type: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  source_type: "DOCUMENT_EVIDENCE" | "TIP_ALLEGATION" | "AI_INFERENCE" | "PUBLIC_DATA_EVIDENCE";
  verification_status: "document_supported" | "unverified" | "ai_inferred";
  description: string;
  citation: string;
  confidence: number;
  applicable_statutes: string | null;
  peer_benchmark: string | null;
  attorney_brief: string | null;
  model_version: string | null;
  prompt_version: string | null;
  created_at: string;
}

export interface AttorneyBrief {
  case_title: string;
  executive_summary: string;
  allegations: { allegation: string; statutory_basis: string; supporting_evidence: string; severity: string }[];
  recommended_next_steps: string[];
  disclaimer: string;
}

export interface PipelineStatus {
  case_id: string;
  status: string;
  confidence_floor_met: boolean;
  finding_count: number;
  high_finding_count: number;
  attorney_brief: AttorneyBrief | null;
}
