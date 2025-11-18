import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import { toast } from '../stores/ui-store';
import type { User, CreateAgentRequest, AgentHierarchy } from '../types';

/**
 * Get agents list query
 */
export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const response = await apiClient.get<User[]>('/users');
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get agent by ID query
 */
export function useAgent(id: number) {
  return useQuery({
    queryKey: ['agents', id],
    queryFn: async () => {
      const response = await apiClient.get<User>(`/users/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Get my downlines query
 */
export function useMyDownlines() {
  return useQuery({
    queryKey: ['agents', 'downlines'],
    queryFn: async () => {
      const response = await apiClient.get<User[]>('/users/me/downlines');
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get agent hierarchy query
 */
export function useAgentHierarchy() {
  return useQuery({
    queryKey: ['agents', 'hierarchy'],
    queryFn: async () => {
      const response = await apiClient.get<AgentHierarchy>(
        '/users/me/hierarchy'
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Create agent mutation
 */
export function useCreateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAgentRequest) => {
      const response = await apiClient.post<User>('/users', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agents', 'downlines'] });
      toast.success('Agent created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create agent');
    },
  });
}

/**
 * Update agent limits mutation
 */
export function useUpdateAgentLimits() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agentId,
      weeklyLimit,
    }: {
      agentId: number;
      weeklyLimit: number;
    }) => {
      const response = await apiClient.patch<User>(`/users/${agentId}/limits`, {
        weeklyLimit,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agents', data.id] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success('Limits updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update limits');
    },
  });
}

/**
 * Toggle agent status mutation
 */
export function useToggleAgentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agentId,
      isActive,
    }: {
      agentId: number;
      isActive: boolean;
    }) => {
      const response = await apiClient.patch<User>(`/users/${agentId}/status`, {
        isActive,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agents', data.id] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success(`Agent ${data.isActive ? 'activated' : 'deactivated'} successfully`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update agent status');
    },
  });
}
