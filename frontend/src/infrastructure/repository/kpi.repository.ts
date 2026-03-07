import { KPIGateway } from '../../domain/gateway/kpi.gateway';
import { KPIValues } from '../../domain/models/kpi.model';
import { httpService } from '../helpers/http-service';
import { environment } from '../../environments/environment';
import { kpiWebSocketService } from '../helpers/kpi-websocket.service';

export class KPIRepository implements KPIGateway {
    async getKPIs(): Promise<KPIValues> {
        const url = `${environment.apiUrl}/api/kpis`;
        return await httpService.get<KPIValues>(url);
    }

    subscribeToKPIs(callback: (kpis: KPIValues) => void): () => void {
        return kpiWebSocketService.subscribe(callback);
    }

    connectWebSocket(): void {
        kpiWebSocketService.connect();
    }

    disconnectWebSocket(): void {
        kpiWebSocketService.disconnect();
    }
}
