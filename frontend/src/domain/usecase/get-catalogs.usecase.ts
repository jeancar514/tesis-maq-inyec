import { CatalogGateway } from '../gateway/catalog.gateway';
import { Catalogos } from '../models/catalog.model';

export class GetCatalogsUseCase {
    constructor(private readonly gateway: CatalogGateway) {}

    async execute(): Promise<Catalogos> {
        return await this.gateway.getCatalogos();
    }
}
