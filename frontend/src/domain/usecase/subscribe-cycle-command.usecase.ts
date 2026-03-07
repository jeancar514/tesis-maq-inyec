import { CycleCommandGateway } from '../gateway/cycle-command.gateway';
import { CycleCommand } from '../models/cycle-command.model';

export class SubscribeCycleCommandUseCase {
    constructor(private readonly gateway: CycleCommandGateway) {}

    subscribe(callback: (cmd: CycleCommand) => void): () => void {
        return this.gateway.subscribeToCycleCommand(callback);
    }

    connectWebSocket(): void {
        this.gateway.connectWebSocket();
    }

    disconnectWebSocket(): void {
        this.gateway.disconnectWebSocket();
    }
}
