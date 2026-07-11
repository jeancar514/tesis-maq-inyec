import { HeatingDiagnosticGateway } from '../../domain/gateway/heating-diagnostic.gateway';
import { ZonaDiagnostico } from '../../domain/models/heating-diagnostic.model';
import { httpService } from '../helpers/http-service';
import { environment } from '../../environments/environment';

interface DiagnosticResponse {
    success: boolean;
    source?: string;
    zonas: ZonaDiagnostico[];
}

export class HeatingDiagnosticRepository implements HeatingDiagnosticGateway {
    async getDiagnostic(): Promise<ZonaDiagnostico[]> {
        const url = `${environment.apiUrl}/api/heating/diagnostic`;
        const res = await httpService.get<DiagnosticResponse>(url);
        return res?.zonas ?? [];
    }
}
