export interface KPIValues {
    cycleTime: number;
    productionCount: number;
    productionTarget: number;
    qualityYield: number;
    operationMode: number;
    command: 'start' | 'stop';

}
