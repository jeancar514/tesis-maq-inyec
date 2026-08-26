export interface CarriageControlData {
    // ── Setpoints (escribibles) ──
    carriageControlEncendido: number;   // 0 | 37  — Encender               — Modbus 140
    carriageTorque: number;             // %       — Torque                 — Modbus 160
    carriageCambioPosicion: number;     // 1 | 2   — selector Pos.1/Pos.2   — Modbus 170
    carriagePosicion1: number;          // mm — int32 con signo — Modbus 180 (low) / 181 (high)
    carriagePosicion2: number;          // mm — int32 con signo — Modbus 190 (low) / 191 (high)
    carriageVelocidadPosicion: number;  // mm/s    — Velocidad en Posición  — Modbus 200
    // ── Lecturas (solo lectura) ──
    carriageVelocidad: number;          // mm/s    — Velocidad              — Modbus 158
    carriagePosicion: number;           // mm — int32 con signo — Modbus 178 (low) / 179 (high)
    carriageTorqueSecundario: number;   // %       — Torque secundario      — Modbus 168
}
