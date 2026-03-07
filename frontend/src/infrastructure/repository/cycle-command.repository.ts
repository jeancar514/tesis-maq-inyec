import { CycleCommandGateway } from '../../domain/gateway/cycle-command.gateway';
import { CycleCommand } from '../../domain/models/cycle-command.model';
import { httpService } from '../helpers/http-service';
import { environment } from '../../environments/environment';

const CYCLE_COMMAND_ENDPOINT = `${environment.apiUrl}/api/cycle-command`;
const CYCLE_COMMAND_WS = `/ws/cycle-command`;

export class CycleCommandRepository implements CycleCommandGateway {
    private wsService: any;

    constructor(wsService: any) {
        this.wsService = wsService;
    }

    async sendCycleCommand(command: 'start' | 'stop'): Promise<CycleCommand> {
        const result = await httpService.post<CycleCommand>(CYCLE_COMMAND_ENDPOINT, { command });
        return result;
    }

    subscribeToCycleCommand(callback: (cmd: CycleCommand) => void): () => void {
        return this.wsService.subscribe((msg: any) => {
            if (typeof msg.command === 'string') callback({ command: msg.command });
        });
    }

    connectWebSocket(): void {
        this.wsService.connect();
    }

    disconnectWebSocket(): void {
        this.wsService.disconnect();
    }
}
