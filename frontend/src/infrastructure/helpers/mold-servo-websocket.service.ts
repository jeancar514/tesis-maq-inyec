import { WebSocketService } from './websocket-service';
import { ServoData } from '../../domain/models/servo.model';

/**
 * Canal WS dedicado al servomotor de cierre/molde (servomotor_2), separado
 * del servo de inyección (servomotor_1) para no mezclar ambos ejes en el
 * mismo flujo de datos.
 */
class MoldServoWebSocketService {
    private wsService: WebSocketService<any>;

    constructor() {
        this.wsService = new WebSocketService('/ws/mold-servo');
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

export const moldServoWebSocketService = new MoldServoWebSocketService();
