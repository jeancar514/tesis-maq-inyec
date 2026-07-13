import { PhaseTimingGateway } from '../gateway/phase-timing.gateway';
import { FaseTiempo } from '../models/phase-timing.model';

export class SavePhaseTimingUseCase {
    constructor(private readonly gateway: PhaseTimingGateway) {}

    async execute(phases: FaseTiempo[]): Promise<FaseTiempo[]> {
        return await this.gateway.savePhaseTiming(phases);
    }
}
