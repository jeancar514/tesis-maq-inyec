import { EjectionStage } from '../../domain/models/process-profile.model';
import { httpService } from '../helpers/http-service';
import { environment } from '../../environments/environment';

const BASE = `${environment.apiUrl}/api/ejection`;

interface EjectionResponse { success: boolean; stages: EjectionStage[]; }

export class EjectionProfileRepository {
    async getEjectionProfile(): Promise<EjectionStage[]> {
        const res = await httpService.get<EjectionResponse>(`${BASE}/ejection-profile`);
        return res?.stages ?? [];
    }
    async saveEjectionProfile(stages: EjectionStage[]): Promise<EjectionStage[]> {
        const res = await httpService.post<EjectionResponse>(`${BASE}/ejection-profile`, { stages });
        return res?.stages ?? [];
    }
}
