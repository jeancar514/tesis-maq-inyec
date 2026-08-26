export interface EjectorControlData {
    // ── Setpoints (escribibles) ──
    ejectorControlEncendido: number;    // 0 | 37  — Encender               — Modbus 220
    ejectorTorque: number;              // %       — Torque                 — Modbus 240
    ejectorCambioPosicion: number;      // 1 | 2   — selector Pos.1/Pos.2   — Modbus 250
    ejectorPosicion1: number;           // mm — int32 con signo — Modbus 260 (low) / 261 (high)
    ejectorPosicion2: number;           // mm — int32 con signo — Modbus 270 (low) / 271 (high)
    ejectorVelocidadPosicion: number;   // mm/s    — Velocidad en Posición  — Modbus 280
    // ── Lecturas (solo lectura) ──
    ejectorVelocidad: number;           // mm/s    — Velocidad              — Modbus 238
    ejectorPosicion: number;            // mm — int32 con signo — Modbus 258 (low) / 259 (high)
    ejectorTorqueSecundario: number;    // %       — Torque secundario      — Modbus 248
}
