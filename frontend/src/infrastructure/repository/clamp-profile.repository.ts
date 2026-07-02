import { ClosingStage, OpeningStage, DataSource } from '../../domain/models/clamp-profile.model';
import { httpService } from '../helpers/http-service';
import { environment } from '../../environments/environment';

const BASE = `${environment.apiUrl}/api`;

interface ClosingResponse { success: boolean; source?: string; stages: ClosingStage[]; error?: string; }
interface OpeningResponse { success: boolean; source?: string; stages: OpeningStage[]; error?: string; }
interface DataSourceResponse { source: DataSource; }

export class ClampProfileRepository {
    /** Origen de datos configurado en el bridge (variable de entorno DATA_SOURCE). */
    async getDataSource(): Promise<DataSource> {
        const res = await httpService.get<DataSourceResponse>(`${BASE}/config/data-source`);
        return res?.source ?? 'modbus';
    }

    // ── Perfil de Cierre ──────────────────────────────────────────────
    async getClosingProfile(): Promise<ClosingStage[]> {
        const res = await httpService.get<ClosingResponse>(`${BASE}/clamp/closing-profile`);
        return res?.stages ?? [];
    }

    async saveClosingProfile(stages: ClosingStage[]): Promise<ClosingStage[]> {
        const res = await httpService.post<ClosingResponse>(`${BASE}/clamp/closing-profile`, { stages });
        return res?.stages ?? [];
    }

    // ── Perfil de Apertura ────────────────────────────────────────────
    async getOpeningProfile(): Promise<OpeningStage[]> {
        const res = await httpService.get<OpeningResponse>(`${BASE}/clamp/opening-profile`);
        return res?.stages ?? [];
    }

    async saveOpeningProfile(stages: OpeningStage[]): Promise<OpeningStage[]> {
        const res = await httpService.post<OpeningResponse>(`${BASE}/clamp/opening-profile`, { stages });
        return res?.stages ?? [];
    }
}
