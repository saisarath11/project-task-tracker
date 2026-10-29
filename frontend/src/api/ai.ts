import { apiClient } from './client';

export interface AiTaskSummary {
  executiveSummary: string;
  discussionContext: string;
  suggestedActionItems: string[];
  aiConfidenceScore: number;
  generatedAt: string;
}

export interface AiEffortEstimate {
  suggestedStoryPoints: number;
  estimatedHours: number;
  complexityLevel: string;
  riskAssessment: string;
  recommendedReviewers: number;
}

export const aiApi = {
  summarizeTask: (taskId: string) =>
    apiClient<AiTaskSummary>('/ai/summarize', {
      method: 'POST',
      body: JSON.stringify({ taskId }),
    }),

  estimateEffort: (data: { title: string; description?: string; priority: string }) =>
    apiClient<AiEffortEstimate>('/ai/estimate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
