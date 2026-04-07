import { WebSocketService } from './websocket-service';
import { ServoData } from '../../domain/models/servo.model';

class ServoWebSocketService {
    private wsService: WebSocketService<any>;

    constructor() {
        this.wsService = new WebSocketService('/ws/servo');
    }

    connect(): void { this.wsService.connect(); }
    disconnect(): void { this.wsService.disconnect(); }
    isConnected(): boolean { return this.wsService.isConnected(); }

    subscribe(handler: (data: ServoData) => void): () => void {
        return this.wsService.subscribe((msg) => {
            if (msg.servo) handler(msg.servo);
        });
    }
}

export const servoWebSocketService = new ServoWebSocketService();
