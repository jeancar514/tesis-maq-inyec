import { WebSocketService } from './websocket-service';
import { KPIValues } from '../../domain/models/kpi.model';

interface KPIWebSocketMessage {
    kpis: KPIValues;
}

class KPIWebSocketService {
    private wsService: WebSocketService<KPIWebSocketMessage>;

    constructor() {
        this.wsService = new WebSocketService<KPIWebSocketMessage>('/ws/kpis');
    }

    connect(): void {
        this.wsService.connect();
    }

    disconnect(): void {
        this.wsService.disconnect();
    }

    subscribe(handler: (kpis: KPIValues) => void): () => void {
        return this.wsService.subscribe((message) => {
            if (message.kpis) {
                handler(message.kpis);
            }
        });
    }

    isConnected(): boolean {
        return this.wsService.isConnected();
    }
}

export const kpiWebSocketService = new KPIWebSocketService();
