export interface EjectorControlData {
    // ── Setpoints (escribibles) ──
    ejectorControlEncendido: number;    // 0 | 37  — Encender               — Modbus 220
    ejectorTorque: number;              // %       — Torque                 — Modbus 240
    ejectorCambioPosicion: number;      // mm      — Cambio de Posición     — Modbus 250
    ejectorPosicion1: number;           // mm      — Posición 1             — Modbus 260
    ejectorPosicion2: number;           // mm      — Posición 2             — Modbus 270
    ejectorVelocidadPosicion: number;   // mm/s    — Velocidad en Posición  — Modbus 280
    // ── Lecturas (solo lectura) ──
    ejectorVelocidad: number;           // mm/s    — Velocidad              — Modbus 238
    ejectorPosicion: number;            // mm      — Posición actual        — Modbus 258
    ejectorTorqueSecundario: number;    // %       — Torque secundario      — Modbus 248
}
