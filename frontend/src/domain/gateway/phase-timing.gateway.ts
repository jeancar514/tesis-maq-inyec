import { FaseTiempo } from '../models/phase-timing.model';

export interface PhaseTimingGateway {
    getPhaseTiming(): Promise<FaseTiempo[]>;
}
