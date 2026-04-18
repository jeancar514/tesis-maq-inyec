import { ScrewControlData } from '../../domain/models/screw-control.model';
import { httpService } from '../helpers/http-service';
import { environment } from '../../environments/environment';

const BASE = `${environment.apiUrl}/api/screw-control`;

export class ScrewControlRepository {
    async get(): Promise<ScrewControlData> {
        return httpService.get<ScrewControlData>(BASE);
    }

    async update(payload: Partial<ScrewControlData>): Promise<Record<string, { success?: boolean; error?: string; value?: number }>> {
        return httpService.post(BASE, payload);
    }
}
