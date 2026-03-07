import { OperationModeGateway } from '../gateway/operation-mode.gateway';
import { OperationMode } from '../models/operation-mode.model';

export class SetOperationModeUseCase {
    constructor(private readonly gateway: OperationModeGateway) {}

    async execute(mode: number): Promise<OperationMode> {
        return await this.gateway.setOperationMode(mode);
    }
}
