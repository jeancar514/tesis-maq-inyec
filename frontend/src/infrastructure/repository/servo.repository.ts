import { ServoGateway } from '../../domain/gateway/servo.gateway';
import { ServoData } from '../../domain/models/servo.model';
import { httpService } from '../helpers/http-service';
import { environment } from '../../environments/environment';
import { servoWebSocketService } from '../helpers/servo-websocket.service';

export class ServoRepository implements ServoGateway {
    async getServoData(): Promise<ServoData> {
        const url = `${environment.apiUrl}/api/servo`;
        return await httpService.get<ServoData>(url);
    }

    subscribeToServoData(callback: (data: ServoData) => void): () => void {
        return servoWebSocketService.subscribe(callback);
    }

    connectWebSocket(): void {
        servoWebSocketService.connect();
    }

    disconnectWebSocket(): void {
        servoWebSocketService.disconnect();
    }
}
