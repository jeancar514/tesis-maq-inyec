import { PhaseTimingGateway } from '../../domain/gateway/phase-timing.gateway';
import { FaseTiempo } from '../../domain/models/phase-timing.model';
import { httpService } from '../helpers/http-service';
import { environment } from '../../environments/environment';

interface PhaseTimingResponse {
    success: boolean;
    source?: string;
    phases: FaseTiempo[];
}

export class PhaseTimingRepository implements PhaseTimingGateway {
    async getPhaseTiming(): Promise<FaseTiempo[]> {
        const url = `${environment.apiUrl}/api/dashboard/phase-timing`;
        const res = await httpService.get<PhaseTimingResponse>(url);
        return res?.phases ?? [];
    }

    async savePhaseTiming(phases: FaseTiempo[]): Promise<FaseTiempo[]> {
        const url = `${environment.apiUrl}/api/dashboard/phase-timing`;
        const res = await httpService.put<PhaseTimingResponse>(url, { phases });
        return res?.phases ?? [];
    }
}
