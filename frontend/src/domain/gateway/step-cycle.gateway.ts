import { CicloPaso } from '../models/step-cycle.model';

export interface StepCycleGateway {
    getStepCycle(): Promise<CicloPaso[]>;
}
