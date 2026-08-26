export interface MoldControlData {
    moldControlEncendido: number;   // 0 | 37  — dirección Modbus 40
    moldTorque: number;             // %       — dirección Modbus 41
    moldCambioPosicion: number;     // 1 | 2   — selector Pos.1/Pos.2 — dirección Modbus 42
    moldPosicion1: number;          // mm — int32 con signo — Modbus 100 (low) / 101 (high)
    moldPosicion2: number;          // mm — int32 con signo — Modbus 110 (low) / 111 (high)
    moldVelocidadPosicion: number;  // mm/s    — dirección Modbus 45
}
