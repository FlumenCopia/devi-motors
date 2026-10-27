const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('dm_token');
  }
  return null;
}

export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('dm_token', token);
  }
}

export function removeAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('dm_token');
    localStorage.removeItem('dm_user');
  }
}

export function getCurrentUserStored(): any | null {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('dm_user');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        return null;
      }
    }
  }
  return null;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      removeAuthToken();
      window.location.href = '/login';
    }
    throw new Error(data.message || `API Error: ${response.status} ${response.statusText}`);
  }

  return data as T;
}

export const api = {
  // Auth
  login: async (credentials: { email: string; password: string }) => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (res.token) {
      setAuthToken(res.token);
      localStorage.setItem('dm_user', JSON.stringify(res.user));
    }
    return res;
  },
  getMe: () => apiRequest('/auth/me'),
  logout: () => {
    removeAuthToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  // Dashboard
  getDashboardMetrics: (financialYear?: string) =>
    apiRequest(`/dashboard/metrics${financialYear ? `?financialYear=${financialYear}` : ''}`),

  // Customers
  listCustomers: (params?: { search?: string; type?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.type && params.type !== 'all') q.append('type', params.type);
    if (params?.page) q.append('page', String(params.page));
    if (params?.limit) q.append('limit', String(params.limit));
    return apiRequest(`/customers?${q.toString()}`);
  },
  getCustomer: (id: string) => apiRequest(`/customers/${id}`),
  createCustomer: (data: any) =>
    apiRequest('/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id: string, data: any) =>
    apiRequest(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCustomer: (id: string) =>
    apiRequest(`/customers/${id}`, { method: 'DELETE' }),
  restoreCustomer: (id: string) =>
    apiRequest(`/customers/${id}/restore`, { method: 'POST' }),
  archiveCustomer: (id: string) =>
    apiRequest(`/customers/${id}/archive`, { method: 'PATCH' }),

  // Invoices
  listInvoices: (params?: any) => {
    const q = new URLSearchParams(params || {});
    return apiRequest(`/invoices?${q.toString()}`);
  },
  getInvoice: (id: string) => apiRequest(`/invoices/${id}`),
  calculateInvoice: (data: { lineItems: any[]; customerStateCode?: string }) =>
    apiRequest('/invoices/calculate', { method: 'POST', body: JSON.stringify(data) }),
  createInvoiceDraft: (data: any) =>
    apiRequest('/invoices', { method: 'POST', body: JSON.stringify(data) }),
  updateInvoiceDraft: (id: string, data: any) =>
    apiRequest(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateInvoice: (id: string, data: any) =>
    apiRequest(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInvoice: (id: string) =>
    apiRequest(`/invoices/${id}`, { method: 'DELETE' }),
  restoreInvoice: (id: string) =>
    apiRequest(`/invoices/${id}/restore`, { method: 'POST' }),
  issueInvoice: (id: string) =>
    apiRequest(`/invoices/${id}/issue`, { method: 'POST' }),
  previewInvoiceUrl: (id: string, withSignature = false) =>
    `${API_BASE}/invoices/${id}/preview${withSignature ? '?withSignature=true' : ''}`,
  downloadInvoiceUrl: (id: string, withSignature = false) =>
    `${API_BASE}/invoices/${id}/pdf${withSignature ? '?withSignature=true' : ''}`,

  // Quotations
  listQuotations: (params?: any) => {
    const q = new URLSearchParams(params || {});
    return apiRequest(`/quotations?${q.toString()}`);
  },
  getQuotation: (id: string) => apiRequest(`/quotations/${id}`),
  createQuotation: (data: any) =>
    apiRequest('/quotations', { method: 'POST', body: JSON.stringify(data) }),
  updateQuotation: (id: string, data: any) =>
    apiRequest(`/quotations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteQuotation: (id: string) =>
    apiRequest(`/quotations/${id}`, { method: 'DELETE' }),
  restoreQuotation: (id: string) =>
    apiRequest(`/quotations/${id}/restore`, { method: 'POST' }),
  updateQuotationStatus: (id: string, status: string) =>
    apiRequest(`/quotations/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  convertQuotationToInvoice: (id: string) =>
    apiRequest(`/quotations/${id}/convert`, { method: 'POST' }),
  previewQuotationUrl: (id: string, withSignature = false) =>
    `${API_BASE}/quotations/${id}/preview${withSignature ? '?withSignature=true' : ''}`,
  downloadQuotationUrl: (id: string, withSignature = false) =>
    `${API_BASE}/quotations/${id}/pdf${withSignature ? '?withSignature=true' : ''}`,

  // Payments
  recordPayment: (data: {
    invoiceId: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    transactionReference?: string;
    notes?: string;
  }) => apiRequest('/payments', { method: 'POST', body: JSON.stringify(data) }),
  getInvoicePayments: (invoiceId: string) => apiRequest(`/payments/invoice/${invoiceId}`),

  // Reports
  getReports: (financialYear?: string) =>
    apiRequest(`/reports${financialYear ? `?financialYear=${financialYear}` : ''}`),

  // Settings
  getSettings: () => apiRequest('/settings'),
  updateSettings: (data: any) =>
    apiRequest('/settings', { method: 'PUT', body: JSON.stringify(data) }),
};
