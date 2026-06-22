import { CarriageControlData } from '../../domain/models/carriage-control.model';
import { httpService } from '../helpers/http-service';
import { environment } from '../../environments/environment';

const BASE = `${environment.apiUrl}/api/carriage-control`;

export class CarriageControlRepository {
    async get(): Promise<CarriageControlData> {
        return httpService.get<CarriageControlData>(BASE);
    }

    async update(payload: Partial<CarriageControlData>): Promise<Record<string, { success?: boolean; error?: string; value?: number }>> {
        return httpService.post(BASE, payload);
    }

    /** Mueve a la posición objetivo: el backend fija Pos1=actual, Pos2=objetivo y dispara Cambio de Posición. */
    async move(target: number, cambio?: number): Promise<{ success?: boolean; currentPosition?: number; target?: number; error?: string }> {
        return httpService.post(`${BASE}/move`, cambio !== undefined ? { target, cambio } : { target });
    }
}
