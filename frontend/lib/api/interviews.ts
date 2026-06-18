import { apiClient } from "./client";

export interface ConversationMessage {
  role: string;
  content: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface Interview {
  id: number;
  user_id: number;
  resume_id?: number | null;
  title: string;
  status: "pending" | "in_progress" | "completed" | string;
  conversation_history?: ConversationMessage[];
  resume_context?: Record<string, any> | null;
  job_description?: string | null;
  feedback?: Record<string, any> | null;
  turn_count: number;
  current_message?: string | null;
  sandbox?: Record<string, any> | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SkillDetail {
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface InterviewSkillBreakdown {
  interview_id: number;
  interview_title: string;
  completed_at?: string | null;
  skill_breakdown: {
    communication: SkillDetail;
    technical: SkillDetail;
    problem_solving: SkillDetail;
    code_quality: SkillDetail;
  };
}

export interface SkillPoint {
  interview_id: number;
  interview_title: string;
  date: string;
  score: number;
}

export interface SkillProgression {
  communication: SkillPoint[];
  technical: SkillPoint[];
  problem_solving: SkillPoint[];
  code_quality: SkillPoint[];
}

export interface SkillComparisonResponse {
  comparison: {
    communication: Record<number, number>;
    technical: Record<number, number>;
    problem_solving: Record<number, number>;
    code_quality: Record<number, number>;
  };
  interviews: Array<{
    id: number;
    title: string;
    completed_at?: string | null;
  }>;
}

export const interviewsApi = {
  list(): Promise<Interview[]> {
    return apiClient.get<Interview[]>("/api/v1/interviews");
  },

  get(id: number): Promise<Interview> {
    return apiClient.get<Interview>(`/api/v1/interviews/${id}`);
  },

  create(data: {
    title: string;
    resume_id?: number;
    job_description?: string;
  }): Promise<Interview> {
    return apiClient.post<Interview>("/api/v1/interviews", data);
  },

  start(interviewId: number): Promise<Interview> {
    return apiClient.post<Interview>("/api/v1/interviews/start", {
      interview_id: interviewId,
    });
  },

  respond(interviewId: number, message: string): Promise<Interview> {
    return apiClient.post<Interview>("/api/v1/interviews/respond", {
      interview_id: interviewId,
      message,
    });
  },

  complete(interviewId: number): Promise<Interview> {
    return apiClient.post<Interview>("/api/v1/interviews/complete", {
      interview_id: interviewId,
    });
  },

  submitCode(interviewId: number, code: string, language: string): Promise<Interview> {
    return apiClient.post<Interview>("/api/v1/interviews/submit-code", {
      interview_id: interviewId,
      code,
      language,
    });
  },

  updateSandboxCode(
    interviewId: number,
    code: string
  ): Promise<{ status: string; has_guidance: boolean }> {
    return apiClient.put<{ status: string; has_guidance: boolean }>(
      `/api/v1/interviews/${interviewId}/sandbox/code?code=${encodeURIComponent(code)}`
    );
  },

  delete(interviewId: number): Promise<void> {
    return apiClient.delete<void>(`/api/v1/interviews/${interviewId}`);
  },

  getFeedback(interviewId: number): Promise<Record<string, any>> {
    return apiClient.get<Record<string, any>>(
      `/api/v1/interviews/${interviewId}/feedback`
    );
  },

  getSkillProgression(): Promise<SkillProgression> {
    return apiClient.get<SkillProgression>(
      "/api/v1/interviews/analytics/skills/progression"
    );
  },

  getSkillAverages(): Promise<{
    communication: number;
    technical: number;
    problem_solving: number;
    code_quality: number;
  }> {
    return apiClient.get(
      "/api/v1/interviews/analytics/skills/averages"
    );
  },

  compareSkillInterviews(interviewIds: number[]): Promise<SkillComparisonResponse> {
    return apiClient.get<SkillComparisonResponse>(
      `/api/v1/interviews/analytics/skills/compare?interview_ids=${interviewIds.join(",")}`
    );
  },

  getInterviewSkills(interviewId: number): Promise<InterviewSkillBreakdown> {
    return apiClient.get<InterviewSkillBreakdown>(
      `/api/v1/interviews/${interviewId}/skills`
    );
  },
};
