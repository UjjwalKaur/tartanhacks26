import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { CheckIn } from '@/types/schemas';

export const useDashboard = () => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiClient.getDashboard(),
  });
};

export const useCreateCheckIn = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (checkIn: CheckIn) => apiClient.createCheckIn(checkIn),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['checkins'] });
    },
  });
};

export const useTransactionsSummary = () => {
  return useQuery({
    queryKey: ['transactions-summary'],
    queryFn: () => apiClient.getTransactionsSummary(),
  });
};

export const useHealthSummary = () => {
  return useQuery({
    queryKey: ['health-summary'],
    queryFn: () => apiClient.getHealthSummary(),
  });
};

export const useCheckIns = () => {
  return useQuery({
    queryKey: ['checkins'],
    queryFn: () => apiClient.getCheckIns(),
  });
};