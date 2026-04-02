import { ServoData } from '../models/servo.model';

export interface ServoGateway {
    getServoData(): Promise<ServoData>;
    // Preparado para futura integración WebSocket
    subscribeToServoData(callback: (data: ServoData) => void): () => void;
    connectWebSocket(): void;
    disconnectWebSocket(): void;
}
