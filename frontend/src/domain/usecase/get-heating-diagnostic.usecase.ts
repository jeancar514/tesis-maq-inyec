import { HeatingDiagnosticGateway } from '../gateway/heating-diagnostic.gateway';
import { ZonaDiagnostico } from '../models/heating-diagnostic.model';

export class GetHeatingDiagnosticUseCase {
    constructor(private readonly gateway: HeatingDiagnosticGateway) {}

    async execute(): Promise<ZonaDiagnostico[]> {
        return await this.gateway.getDiagnostic();
    }
}
