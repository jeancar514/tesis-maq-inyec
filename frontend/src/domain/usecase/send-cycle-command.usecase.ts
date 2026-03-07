import { CycleCommandGateway } from '../gateway/cycle-command.gateway';
import { CycleCommand } from '../models/cycle-command.model';

export class SendCycleCommandUseCase {
    constructor(private readonly gateway: CycleCommandGateway) {}

    async execute(command: 'start' | 'stop'): Promise<CycleCommand> {
        return await this.gateway.sendCycleCommand(command);
    }
}
