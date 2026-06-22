import { MoldControlData } from '../../domain/models/mold-control.model';
import { httpService } from '../helpers/http-service';
import { environment } from '../../environments/environment';

const BASE = `${environment.apiUrl}/api/mold-control`;

export class MoldControlRepository {
    async get(): Promise<MoldControlData> {
        return httpService.get<MoldControlData>(BASE);
    }

    async update(payload: Partial<MoldControlData>): Promise<Record<string, { success?: boolean; error?: string; value?: number }>> {
        return httpService.post(BASE, payload);
    }

    /** Mueve a la posición objetivo: el backend fija Pos1=actual, Pos2=objetivo y dispara Cambio de Posición. */
    async move(target: number, cambio?: number): Promise<{ success?: boolean; currentPosition?: number; target?: number; error?: string }> {
        return httpService.post(`${BASE}/move`, cambio !== undefined ? { target, cambio } : { target });
    }
}
