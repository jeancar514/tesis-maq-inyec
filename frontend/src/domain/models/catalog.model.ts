export interface CatalogItem<T = string> {
    codigo: T;
    etiqueta: string;
}

export interface ModoOperacionItem extends CatalogItem<number> {
    descripcion?: string;
}

export interface EstadoFaseItem extends CatalogItem<string> {
    orden: number;
    color: string | null;
}

export interface Catalogos {
    modoOperacion: ModoOperacionItem[];
    valorModo: CatalogItem<string>[];
    comandoCiclo: CatalogItem<string>[];
    activacion: CatalogItem<boolean>[];
    estadoFase: EstadoFaseItem[];
}
