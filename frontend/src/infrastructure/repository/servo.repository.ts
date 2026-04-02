import { ServoGateway } from '../../domain/gateway/servo.gateway';
import { ServoData } from '../../domain/models/servo.model';
import { httpService } from '../helpers/http-service';
import { environment } from '../../environments/environment';

export class ServoRepository implements ServoGateway {
    async getServoData(): Promise<ServoData> {
        const url = `${environment.apiUrl}/api/servo`;
        return await httpService.get<ServoData>(url);
    }

    // Stubs para futura integración WebSocket
    subscribeToServoData(callback: (data: ServoData) => void): () => void {
        // TODO: implementar cuando se agregue WebSocket
        return () => {};
    }

    connectWebSocket(): void {
        // TODO: implementar
    }

    disconnectWebSocket(): void {
        // TODO: implementar
    }
}
