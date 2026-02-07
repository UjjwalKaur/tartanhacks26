import { useQuery } from '@tanstack/react-query';
import { Checkin } from '@/types/checkin';

export const useCheckinsData = () => {
  return useQuery({
    queryKey: ['checkins'],
    queryFn: async () => {
      const res = await fetch('/api/checkins');
      if (!res.ok) throw new Error('Failed to fetch checkins');
      const data = await res.json();
      return (data.checkins || []) as Checkin[];
    },
  });
};
