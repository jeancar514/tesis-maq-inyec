import { KPIValues } from '../models/kpi.model';

export interface KPIGateway {
    getKPIs(): Promise<KPIValues>;
    subscribeToKPIs(callback: (kpis: KPIValues) => void): () => void;
    connectWebSocket(): void;
    disconnectWebSocket(): void;
}
