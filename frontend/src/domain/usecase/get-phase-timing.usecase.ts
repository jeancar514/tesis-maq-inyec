import { PhaseTimingGateway } from '../gateway/phase-timing.gateway';
import { FaseTiempo } from '../models/phase-timing.model';

export class GetPhaseTimingUseCase {
    constructor(private readonly gateway: PhaseTimingGateway) {}

    async execute(): Promise<FaseTiempo[]> {
        return await this.gateway.getPhaseTiming();
    }
}
