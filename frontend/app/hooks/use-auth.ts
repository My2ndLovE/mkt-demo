import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import apiClient from '../lib/api';
import { useAuthStore } from '../stores/auth.store';
import type { LoginRequest, LoginResponse } from '../types/user';

export function useAuth() {
  const { user, setAuth, clearAuth } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest): Promise<LoginResponse> => {
      const response = await apiClient.post('/auth/login', credentials);
      return response.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      navigate('/dashboard');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    },
    onSettled: () => {
      clearAuth();
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      queryClient.clear();
      navigate('/login');
    },
  });

  return {
    user,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
  };
}
