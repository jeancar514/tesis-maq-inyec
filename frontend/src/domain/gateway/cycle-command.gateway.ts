import { CycleCommand } from '../models/cycle-command.model';

export interface CycleCommandGateway {
    getCycleCommand(): Promise<CycleCommand>;
    sendCycleCommand(command: 'start' | 'stop'): Promise<CycleCommand>;
    subscribeToCycleCommand(callback: (cmd: CycleCommand) => void): () => void;
    connectWebSocket(): void;
    disconnectWebSocket(): void;
}
