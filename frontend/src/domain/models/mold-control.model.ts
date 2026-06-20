export interface MoldControlData {
    moldControlEncendido: number;   // 0 | 37  — dirección Modbus 40
    moldTorque: number;             // %       — dirección Modbus 41
    moldCambioPosicion: number;     // mm      — dirección Modbus 42
    moldPosicion1: number;          // mm      — dirección Modbus 43
    moldPosicion2: number;          // mm      — dirección Modbus 44
    moldVelocidadPosicion: number;  // mm/s    — dirección Modbus 45
}
