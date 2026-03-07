import { KPIGateway } from '../gateway/kpi.gateway';
import { KPIValues } from '../models/kpi.model';

export class GetKPIsUseCase {
    constructor(private readonly kpiGateway: KPIGateway) { }

    async execute(): Promise<KPIValues> {
        return await this.kpiGateway.getKPIs();
    }

    subscribeToKPIs(callback: (kpis: KPIValues) => void): () => void {
        return this.kpiGateway.subscribeToKPIs(callback);
    }

    connectWebSocket(): void {
        this.kpiGateway.connectWebSocket();
    }

    disconnectWebSocket(): void {
        this.kpiGateway.disconnectWebSocket();
    }
}
