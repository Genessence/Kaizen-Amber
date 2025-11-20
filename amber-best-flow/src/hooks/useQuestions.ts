/**
 * Custom hooks for Q&A system
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import type { Question } from '@/types/api';
import { toast } from 'sonner';

export const usePracticeQuestions = (practiceId: string | undefined) => {
  return useQuery<Question[]>({
    queryKey: ['questions', practiceId],
    queryFn: () => apiService.getPracticeQuestions(practiceId!),
    enabled: !!practiceId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useAskQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ practiceId, questionText }: { practiceId: string; questionText: string }) =>
      apiService.askQuestion(practiceId, questionText),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['questions', variables.practiceId] });
      queryClient.invalidateQueries({ queryKey: ['best-practice', variables.practiceId] });
      queryClient.invalidateQueries({ queryKey: ['best-practices'] });
      toast.success('Question submitted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit question');
    },
  });
};

export const useAnswerQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ questionId, answerText, practiceId }: { questionId: string; answerText: string; practiceId: string }) =>
      apiService.answerQuestion(questionId, answerText),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['questions', variables.practiceId] });
      toast.success('Answer posted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to post answer');
    },
  });
};

export const useDeleteQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ questionId, practiceId }: { questionId: string; practiceId: string }) =>
      apiService.deleteQuestion(questionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['questions', variables.practiceId] });
      queryClient.invalidateQueries({ queryKey: ['best-practice', variables.practiceId] });
      toast.success('Question deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete question');
    },
  });
};

