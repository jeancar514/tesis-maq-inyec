import { EmergencyStopState } from '../../domain/models/emergency-stop.model';
import { httpService } from '../helpers/http-service';
import { environment } from '../../environments/environment';

const BASE = `${environment.apiUrl}/api/emergency-stop`;

export class EmergencyStopRepository {
    async get(): Promise<EmergencyStopState> {
        return httpService.get<EmergencyStopState>(BASE);
    }

    /** Envía 1 (activa) o 0 (inactiva) al backend, que lo escribe en la dirección Modbus 352. */
    async set(active: boolean): Promise<EmergencyStopState & { success?: boolean; error?: string }> {
        return httpService.post(BASE, { active });
    }
}
