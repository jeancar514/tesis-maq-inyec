import { InjectionStage, HoldingStage } from '../../domain/models/process-profile.model';
import { httpService } from '../helpers/http-service';
import { environment } from '../../environments/environment';

const BASE = `${environment.apiUrl}/api/injection`;

interface InjectionResponse { success: boolean; stages: InjectionStage[]; }
interface HoldingResponse { success: boolean; stages: HoldingStage[]; }

export class InjectionProfileRepository {
    async getInjectionProfile(): Promise<InjectionStage[]> {
        const res = await httpService.get<InjectionResponse>(`${BASE}/injection-profile`);
        return res?.stages ?? [];
    }
    async saveInjectionProfile(stages: InjectionStage[]): Promise<InjectionStage[]> {
        const res = await httpService.post<InjectionResponse>(`${BASE}/injection-profile`, { stages });
        return res?.stages ?? [];
    }

    async getHoldingProfile(): Promise<HoldingStage[]> {
        const res = await httpService.get<HoldingResponse>(`${BASE}/holding-profile`);
        return res?.stages ?? [];
    }
    async saveHoldingProfile(stages: HoldingStage[]): Promise<HoldingStage[]> {
        const res = await httpService.post<HoldingResponse>(`${BASE}/holding-profile`, { stages });
        return res?.stages ?? [];
    }
}
