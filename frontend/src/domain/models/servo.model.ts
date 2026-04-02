export interface ServoData {
    speed: number;        // Lectura de Velocidad - Modbus address 18
    torque: number;       // Lectura de Torque - Modbus address 28
    position: number;     // Posición - Modbus address 38
    current: number;      // Corriente - Modbus address 48
    voltage: number;      // Voltaje del Servo - Modbus address 58
}
