import { ZonaDiagnostico } from '../models/heating-diagnostic.model';

export interface HeatingDiagnosticGateway {
    getDiagnostic(): Promise<ZonaDiagnostico[]>;
}
