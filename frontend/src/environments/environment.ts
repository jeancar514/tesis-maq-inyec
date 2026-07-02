
export const environment = {
    production: false,
    apiUrl: (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000',
    // Valor de respaldo para mostrar el origen de datos antes de consultar al bridge.
    // El origen real lo determina el bridge vía la variable de entorno DATA_SOURCE
    // (endpoint GET /api/config/data-source). Valores: 'modbus' | 'db'.
    dataSource: ((import.meta as any).env?.VITE_DATA_SOURCE || 'modbus') as 'modbus' | 'db'
};
