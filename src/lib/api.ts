// src/lib/api.ts

// Base URL for the API
// For local development, if you run PHP server on port 8000: http://localhost:8000
// For production: https://yourdomain.com/api
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Gets the full URL for a file stored in the uploads directory
 * Handles both relative paths from DB and absolute/root-relative paths
 */
export const getFileUrl = (path: string | null | undefined): string => {
    if (!path) return '';
    if (path.startsWith('http')) return path;

    // Ensure path starts with a slash
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    // In production (VITE_API_URL=/api), files are at /uploads/...
    // but in local dev, they might be served through the API port
    if (API_BASE_URL === '/api') {
        // If normalization already handled /uploads, just return it
        // Note: previous implementation returned /uploads/filename
        return normalizedPath;
    }

    // Local development: prepend the API base URL
    return `${API_BASE_URL}${normalizedPath}`;
};

interface RequestOptions extends RequestInit {
    token?: string;
}

export const api = {
    async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const headers: HeadersInit = {
            'Accept': 'application/json',
            ...(options.headers || {})
        };

        // Only set Content-Type if not FormData (browser sets it automatically with boundary)
        if (!(options.body instanceof FormData)) {
            (headers as Record<string, string>)['Content-Type'] = 'application/json';
        }

        // Attach Token if exists in localStorage (or passed via options)
        const token = localStorage.getItem('access_token');
        if (token) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        }

        const config: RequestInit = {
            ...options,
            headers
        };

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

            // Handle 401 Unauthorized (Token Expired)
            if (response.status === 401) {
                localStorage.removeItem('access_token');
                window.location.href = '/login';
                throw new Error('Session expired');
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Request failed with status ${response.status}`);
            }

            return response.json() as Promise<T>;
        } catch (error) {
            console.error('API Request Failed:', error);
            throw error;
        }
    },

    get<T>(endpoint: string) {
        return this.request<T>(endpoint, { method: 'GET' });
    },

    post<T>(endpoint: string, body: any) {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: body instanceof FormData ? body : JSON.stringify(body)
        });
    },

    put<T>(endpoint: string, body: any) {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: body instanceof FormData ? body : JSON.stringify(body)
        });
    },

    delete<T>(endpoint: string) {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }
};
