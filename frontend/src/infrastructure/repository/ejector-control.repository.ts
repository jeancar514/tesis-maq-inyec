import { EjectorControlData } from '../../domain/models/ejector-control.model';
import { httpService } from '../helpers/http-service';
import { environment } from '../../environments/environment';

const BASE = `${environment.apiUrl}/api/ejector-control`;

export class EjectorControlRepository {
    async get(): Promise<EjectorControlData> {
        return httpService.get<EjectorControlData>(BASE);
    }

    async update(payload: Partial<EjectorControlData>): Promise<Record<string, { success?: boolean; error?: string; value?: number }>> {
        return httpService.post(BASE, payload);
    }
}
