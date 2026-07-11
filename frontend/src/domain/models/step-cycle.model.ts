export type FaseEstado = 'completado' | 'activo' | 'pendiente' | 'bloqueado';

export interface CicloPaso {
    orden: number;
    nombre: string;
    estado: FaseEstado;
    duracion: number; // segundos
}
