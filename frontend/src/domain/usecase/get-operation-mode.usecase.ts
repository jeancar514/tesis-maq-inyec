import { OperationModeGateway } from '../gateway/operation-mode.gateway';
import { OperationMode } from '../models/operation-mode.model';

export class GetOperationModeUseCase {
    constructor(private readonly gateway: OperationModeGateway) {}

    async execute(): Promise<OperationMode> {
        return await this.gateway.getOperationMode();
    }

    subscribeToOperationMode(callback: (mode: OperationMode) => void): () => void {
        return this.gateway.subscribeToOperationMode(callback);
    }

    connectWebSocket(): void {
        this.gateway.connectWebSocket();
    }

    disconnectWebSocket(): void {
        this.gateway.disconnectWebSocket();
    }
}
