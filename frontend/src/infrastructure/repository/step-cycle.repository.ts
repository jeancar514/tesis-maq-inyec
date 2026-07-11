import { StepCycleGateway } from '../../domain/gateway/step-cycle.gateway';
import { CicloPaso } from '../../domain/models/step-cycle.model';
import { httpService } from '../helpers/http-service';
import { environment } from '../../environments/environment';

interface StepCycleResponse {
    success: boolean;
    source?: string;
    phases: CicloPaso[];
}

export class StepCycleRepository implements StepCycleGateway {
    async getStepCycle(): Promise<CicloPaso[]> {
        const url = `${environment.apiUrl}/api/dashboard/step-cycle`;
        const res = await httpService.get<StepCycleResponse>(url);
        return res?.phases ?? [];
    }
}
