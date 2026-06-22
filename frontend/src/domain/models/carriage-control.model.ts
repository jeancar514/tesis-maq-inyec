export interface CarriageControlData {
    // ── Setpoints (escribibles) ──
    carriageControlEncendido: number;   // 0 | 37  — Encender               — Modbus 140
    carriageTorque: number;             // %       — Torque                 — Modbus 160
    carriageCambioPosicion: number;     // mm      — Cambio de Posición     — Modbus 170
    carriagePosicion1: number;          // mm      — Posición 1             — Modbus 180
    carriagePosicion2: number;          // mm      — Posición 2             — Modbus 190
    carriageVelocidadPosicion: number;  // mm/s    — Velocidad en Posición  — Modbus 200
    // ── Lecturas (solo lectura) ──
    carriageVelocidad: number;          // mm/s    — Velocidad              — Modbus 158
    carriagePosicion: number;           // mm      — Posición actual        — Modbus 178
    carriageTorqueSecundario: number;   // %       — Torque secundario      — Modbus 168
}
