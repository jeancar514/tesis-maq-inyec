import { CatalogGateway } from '../../domain/gateway/catalog.gateway';
import { Catalogos } from '../../domain/models/catalog.model';
import { httpService } from '../helpers/http-service';
import { environment } from '../../environments/environment';

const EMPTY: Catalogos = {
    modoOperacion: [], valorModo: [], comandoCiclo: [], activacion: [], estadoFase: [],
};

export class CatalogRepository implements CatalogGateway {
    async getCatalogos(): Promise<Catalogos> {
        const url = `${environment.apiUrl}/api/catalogos`;
        const res = await httpService.get<Catalogos>(url);
        return { ...EMPTY, ...res };
    }
}
