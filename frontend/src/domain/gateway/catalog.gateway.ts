import { Catalogos } from '../models/catalog.model';

export interface CatalogGateway {
    getCatalogos(): Promise<Catalogos>;
}
