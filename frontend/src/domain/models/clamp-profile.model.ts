// Origen de datos de las variables del módulo de molde en la pantalla.
export type DataSource = 'modbus' | 'db';

// Etapa del perfil de CIERRE del molde (variables originales de la pantalla).
export interface ClosingStage {
    orden: number;
    etiqueta: string;
    inicio: number;    // mm  — posición de inicio de la etapa
    velocidad: number; // mm/s
    torqueMax: number; // %
}

// Etapa del perfil de APERTURA del molde (variables originales de la pantalla).
export interface OpeningStage {
    orden: number;
    etiqueta: string;
    posicion: number;    // mm
    velocidad: number;   // mm/s
    aceleracion: number; // mm/s²
}
