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
}
