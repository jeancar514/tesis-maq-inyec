// Modelos de etapas/perfiles de proceso (DB-backed) para inyección, sostenimiento,
// eyección y zonas de calefacción. Reflejan las variables ya existentes en la
// pantalla (sin agregar variables nuevas).

export interface InjectionStage {
    orden: number;
    puntoInicio: number; // mm
    velocidad: number;   // mm/s
}

export interface HoldingStage {
    orden: number;
    presion: number;   // bar
    tiempo: number;    // s
    velocidad: number; // mm/s
    posicion: number;  // mm
}

export interface EjectionStage {
    orden: number;
    etiqueta: string;
    posicion: number;  // mm
    velocidad: number; // mm/s
}

export interface HeatingZone {
    id: number;
    nombre: string;
    setpoint: number;      // °C
    toleranciaSup: number; // °C
    toleranciaInf: number; // °C
    activa: boolean;
}
