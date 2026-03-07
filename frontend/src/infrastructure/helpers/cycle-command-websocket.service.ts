import { WebSocketService } from './websocket-service';
import { CycleCommand } from '../../domain/models/cycle-command.model';

class CycleCommandWebSocketService {
    private wsService: WebSocketService<any>;

    constructor() {
        this.wsService = new WebSocketService('/ws/cycle-command');
    }

    connect(): void {
        this.wsService.connect();
    }

    disconnect(): void {
        this.wsService.disconnect();
    }

    subscribe(handler: (cmd: CycleCommand) => void): () => void {
        return this.wsService.subscribe((msg) => {
            if (typeof msg.command === 'string') handler({ command: msg.command });
        });
    }

    isConnected(): boolean {
        return this.wsService.isConnected();
    }
}

export const cycleCommandWebSocketService = new CycleCommandWebSocketService();
