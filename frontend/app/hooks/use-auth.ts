import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import { useAuthStore } from '../stores/auth-store';
import { toast } from '../stores/ui-store';
import type {
  LoginRequest,
  LoginResponse,
  ChangePasswordRequest,
  User,
} from '../types';

/**
 * Login mutation
 */
export function useLogin() {
  const { setAuth } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const response = await apiClient.post<LoginResponse>('/auth/login', data);
      return response.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      toast.success('Login successful');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Login failed');
    },
  });
}

/**
 * Logout mutation
 */
export function useLogout() {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/logout');
    },
    onSuccess: () => {
      logout();
      queryClient.clear();
      toast.success('Logged out successfully');
    },
    onError: () => {
      // Even if API call fails, still logout locally
      logout();
      queryClient.clear();
    },
  });
}

/**
 * Change password mutation
 */
export function useChangePassword() {
  const { updateUser } = useAuthStore();

  return useMutation({
    mutationFn: async (data: ChangePasswordRequest) => {
      const response = await apiClient.post<User>(
        '/auth/change-password',
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      updateUser({ firstLogin: false });
      toast.success('Password changed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to change password');
    },
  });
}

/**
 * Get current user query
 */
export function useCurrentUser() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const response = await apiClient.get<User>('/users/me');
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Refresh user data
 */
export function useRefreshUser() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.get<User>('/users/me');
      return response.data;
    },
    onSuccess: (data) => {
      updateUser(data);
      queryClient.setQueryData(['user', 'me'], data);
    },
  });
}
