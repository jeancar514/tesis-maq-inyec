export interface ScrewControlData {
    controlEncendido: number;   // 0 = apagado, 1 = encendido — modbusAddress 10
    velocidadHusillo: number;   // RPM — modbusAddress 20
    torqueHusillo: number;      // Nm  — modbusAddress 30
}
