export class HttpService {
    async get<T>(url: string, options?: RequestInit): Promise<T> {
        return this.request<T>(url, { ...options, method: 'GET' });
    }

    async post<T>(url: string, body: any, options?: RequestInit): Promise<T> {
        return this.request<T>(url, {
            ...options,
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });
    }

    async put<T>(url: string, body: any, options?: RequestInit): Promise<T> {
        return this.request<T>(url, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });
    }

    async delete<T>(url: string, body?: any, headers?: any): Promise<T> {
        const options: RequestInit = {
            method: 'DELETE',
            headers: headers || {},
        };
        if (body) {
            options.body = JSON.stringify(body);
            options.headers = {
                'Content-Type': 'application/json',
                ...options.headers,
            };
        }
        return this.request<T>(url, options);
    }

    private async request<T>(url: string, options: RequestInit): Promise<T> {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                await this.handleError(response);
            }

            const text = await response.text();
            if (!text) {
                return {} as T;
            }

            try {
                return JSON.parse(text) as T;
            } catch (err) {
                return text as unknown as T;
            }
        } catch (error) {
            throw error;
        }
    }

    private async handleError(response: Response): Promise<never> {
        let errorMessage = 'An unknown error occurred';
        try {
            const errorBody = await response.text();
            try {
                const parsedError = JSON.parse(errorBody);
                errorMessage = `Server-side error: ${response.status} - ${parsedError.message || errorBody}`;
            } catch {
                errorMessage = `Server-side error: ${response.status} - ${errorBody || response.statusText}`;
            }
        } catch (e) {
            errorMessage = `Server-side error: ${response.status} - ${response.statusText}`;
        }
        throw new Error(errorMessage);
    }
}

export const httpService = new HttpService();
