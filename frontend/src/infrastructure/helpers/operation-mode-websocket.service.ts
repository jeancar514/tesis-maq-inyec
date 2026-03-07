import { WebSocketService } from './websocket-service';
import { OperationMode } from '../../domain/models/operation-mode.model';

class OperationModeWebSocketService {
    private wsService: WebSocketService<any>;

    constructor() {
        this.wsService = new WebSocketService('/ws/operation-mode');
    }

    connect(): void {
        this.wsService.connect();
    }

    disconnect(): void {
        this.wsService.disconnect();
    }

    subscribe(handler: (mode: OperationMode) => void): () => void {
        return this.wsService.subscribe((msg) => {
            if (typeof msg.mode === 'number') handler({ mode: msg.mode });
        });
    }

    isConnected(): boolean {
        return this.wsService.isConnected();
    }
}

export const operationModeWebSocketService = new OperationModeWebSocketService();
