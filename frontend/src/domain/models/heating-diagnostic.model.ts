export interface ZonaDiagnostico {
    codigo: string;
    nombre: string;
    setpoint: number;
    toleranciaSup: number;
    toleranciaInf: number;
    temperaturaPv: number | null;
    salidaSsr: number | null;
    error: number | null;
    estado: 'on' | 'off';
}
