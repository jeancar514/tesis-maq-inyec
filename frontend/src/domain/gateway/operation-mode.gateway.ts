import { OperationMode } from '../models/operation-mode.model';

export interface OperationModeGateway {
    getOperationMode(): Promise<OperationMode>;
    setOperationMode(mode: number): Promise<OperationMode>;
    subscribeToOperationMode(callback: (mode: OperationMode) => void): () => void;
    connectWebSocket(): void;
    disconnectWebSocket(): void;
}
