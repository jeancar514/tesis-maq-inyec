
export const environment = {
    production: false,
    apiUrl: (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000'
};
