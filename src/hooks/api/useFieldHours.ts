import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/lib/axios';
import type { ApiResponse, OpeningHour } from '@/types/api';

export function useUpdateFieldHours(fieldId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (hours: OpeningHour[]) =>
      axiosClient
        .put<ApiResponse<OpeningHour[]>>(`/v1/admin/fields/${fieldId}/hours`, { hours })
        .then(r => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field', fieldId] });
    },
  });
}
