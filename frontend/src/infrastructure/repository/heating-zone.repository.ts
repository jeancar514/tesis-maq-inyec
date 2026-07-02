import { HeatingZone } from '../../domain/models/process-profile.model';
import { httpService } from '../helpers/http-service';
import { environment } from '../../environments/environment';

const BASE = `${environment.apiUrl}/api/heating`;

interface ZonesResponse { success: boolean; zones: HeatingZone[]; }

export class HeatingZoneRepository {
    async getZones(): Promise<HeatingZone[]> {
        const res = await httpService.get<ZonesResponse>(`${BASE}/zones`);
        return res?.zones ?? [];
    }
    async saveZones(zones: HeatingZone[]): Promise<HeatingZone[]> {
        const res = await httpService.post<ZonesResponse>(`${BASE}/zones`, { zones });
        return res?.zones ?? [];
    }
}
