import { getAuthToken } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5006';

class ApiClient {
  private async getHeaders(): Promise<HeadersInit> {
    const token = await getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  async get<T>(path: string): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async post<T>(path: string, body: any): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async put<T>(path: string, body: any): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async patch<T>(path: string, body: any): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async delete<T>(path: string): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();

export const adminApi = {
  Problems: {
    list: () => apiClient.get<any>('/api/admin/problems'),
    get: (slug: string) => apiClient.get<any>(`/api/problems/${slug}`),
    create: (data: any) => apiClient.post('/api/admin/problems', data),
    update: (id: string, data: any) => apiClient.put(`/api/admin/problems/${id}`, data),
    delete: (id: string) => apiClient.delete(`/api/admin/problems/${id}`),
  },
  Pods: {
    list: () => apiClient.get<any>('/api/admin/pods'),
    getProgress: (problemId: string) => apiClient.get<any>(`/api/pods/progress/${problemId}`),
    create: (data: any) => apiClient.post('/api/admin/pods', data),
    update: (id: string, data: any) => apiClient.put(`/api/admin/pods/${id}`, data),
    delete: (id: string) => apiClient.delete(`/api/admin/pods/${id}`),
  },
  Stages: {
    list: (podId?: string) => apiClient.get<any>(podId ? `/api/admin/stages?podId=${podId}` : '/api/admin/stages'),
    get: (podId: string, stageId: string) => apiClient.get<any>(`/api/pods/${podId}/stages/${stageId}`),
    create: (data: any) => apiClient.post('/api/admin/stages', data),
    update: (id: string, data: any) => apiClient.put(`/api/admin/stages/${id}`, data),
    delete: (id: string) => apiClient.delete(`/api/admin/stages/${id}`),
  },
  Users: {
    search: (query: string) => apiClient.get<any[]>(`/api/profile/search?q=${encodeURIComponent(query)}`),
    list: () => apiClient.get<any>('/api/admin/users'),
    get: (id: string) => apiClient.get<any>(`/api/admin/users/${id}`),
    updateSubscription: (id: string, tier: string) => apiClient.put(`/api/admin/users/${id}/subscription`, { subscriptionTier: tier }),
    delete: (id: string) => apiClient.delete(`/api/admin/users/${id}`),
  },
  Analytics: {
    users: () => apiClient.get<any>('/api/admin/analytics/users'),
    problems: () => apiClient.get<any>('/api/admin/analytics/problems'),
    pods: () => apiClient.get<any>('/api/admin/analytics/pods'),
    stages: () => apiClient.get<any>('/api/admin/analytics/stages'),
    progress: () => apiClient.get<any>('/api/admin/analytics/progress'),
  },
  Monitoring: {
    attempts: () => apiClient.get<any>('/api/admin/monitoring/attempts'),
    errors: () => apiClient.get<any>('/api/admin/monitoring/errors'),
    performance: () => apiClient.get<any>('/api/admin/monitoring/performance'),
  },
};
