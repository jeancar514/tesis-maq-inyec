import { StepCycleGateway } from '../gateway/step-cycle.gateway';
import { CicloPaso } from '../models/step-cycle.model';

export class GetStepCycleUseCase {
    constructor(private readonly gateway: StepCycleGateway) {}

    async execute(): Promise<CicloPaso[]> {
        return await this.gateway.getStepCycle();
    }
}
