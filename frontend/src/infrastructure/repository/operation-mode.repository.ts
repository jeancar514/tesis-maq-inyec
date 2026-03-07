import { OperationModeGateway } from '../../domain/gateway/operation-mode.gateway';
import { OperationMode } from '../../domain/models/operation-mode.model';
import { httpService } from '../helpers/http-service';
import { environment } from '../../environments/environment';

const OPERATION_MODE_ENDPOINT = `${environment.apiUrl}/api/operation-mode`;
const OPERATION_MODE_WS = `/ws/operation-mode`;

export class OperationModeRepository implements OperationModeGateway {
    private wsService: any;

    constructor(wsService: any) {
        this.wsService = wsService;
    }

    async getOperationMode(): Promise<OperationMode> {
        // No hay GET, pero podrías implementarlo si el backend lo soporta
        return { mode: 2 };
    }

    async setOperationMode(mode: number): Promise<OperationMode> {
        const result = await httpService.post<OperationMode>(OPERATION_MODE_ENDPOINT, { mode });
        return result;
    }

    subscribeToOperationMode(callback: (mode: OperationMode) => void): () => void {
        return this.wsService.subscribe((msg: any) => {
            if (typeof msg.mode === 'number') callback({ mode: msg.mode });
        });
    }

    connectWebSocket(): void {
        this.wsService.connect();
    }

    disconnectWebSocket(): void {
        this.wsService.disconnect();
    }
}
