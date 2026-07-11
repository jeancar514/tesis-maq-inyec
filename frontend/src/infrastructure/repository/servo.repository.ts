import { ServoGateway } from '../../domain/gateway/servo.gateway';
import { ServoData } from '../../domain/models/servo.model';
import { httpService } from '../helpers/http-service';
import { environment } from '../../environments/environment';
import { servoWebSocketService } from '../helpers/servo-websocket.service';

/** Contrato mínimo compartido por los servicios WS de servo (inyección / molde). */
interface ServoSocket {
    connect(): void;
    disconnect(): void;
    subscribe(handler: (data: ServoData) => void): () => void;
}

export class ServoRepository implements ServoGateway {
    /**
     * @param endpoint Ruta HTTP del servo a consultar. Por defecto el servo de
     *   inyección (servomotor_1). El módulo Molde inyecta '/api/mold-control/servo'
     *   para leer el servo de cierre (servomotor_2).
     * @param wsService Servicio WebSocket correspondiente al mismo servo.
     */
    constructor(
        private readonly endpoint: string = '/api/servo',
        private readonly wsService: ServoSocket = servoWebSocketService,
    ) {}

    async getServoData(): Promise<ServoData> {
        const url = `${environment.apiUrl}${this.endpoint}`;
        return await httpService.get<ServoData>(url);
    }

    subscribeToServoData(callback: (data: ServoData) => void): () => void {
        return this.wsService.subscribe(callback);
    }

    connectWebSocket(): void {
        this.wsService.connect();
    }

    disconnectWebSocket(): void {
        this.wsService.disconnect();
    }
}
