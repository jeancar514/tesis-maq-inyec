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

    /**
     * Mueve a la posición objetivo. Solo se envía "target": el backend decide
     * internamente Pos1/Pos2 (según dónde está realmente el eje) y dispara
     * "Cambio de Posición" por su cuenta — el front nunca debe fijar ese valor.
     */
    async move(target: number): Promise<{ success?: boolean; currentPosition?: number; target?: number; error?: string }> {
        return httpService.post(`${BASE}/move`, { target });
    }
}
