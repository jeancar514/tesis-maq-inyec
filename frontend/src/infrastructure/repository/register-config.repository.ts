import { RegisterConfig, RegisterPatch } from '../../domain/models/register-config.model';
import { httpService } from '../helpers/http-service';
import { environment } from '../../environments/environment';

const BASE = `${environment.apiUrl}/api/registers`;

interface RegistersResponse {
    success: boolean;
    registers: RegisterConfig[];
}

interface BatchResult {
    success: boolean;
    results: Array<{ name: string | null; success?: boolean; error?: string; register?: RegisterConfig }>;
}

export class RegisterConfigRepository {
    async getAll(): Promise<RegisterConfig[]> {
        const res = await httpService.get<RegistersResponse>(BASE);
        return res?.registers ?? [];
    }

    /** Guarda en lote solo los registros modificados. */
    async saveBatch(changes: RegisterPatch[]): Promise<BatchResult> {
        return httpService.post<BatchResult>(`${BASE}/batch`, { changes });
    }
}
