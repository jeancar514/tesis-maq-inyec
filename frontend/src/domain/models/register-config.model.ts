export type ModbusType = 'inputRegister' | 'holdingRegister' | 'coil' | 'discreteInput';

export interface RegisterConfig {
    name: string;                 // identidad (no editable)
    type: string;                 // agrupación por módulo (no editable): kpis, servo, mold_control...
    description?: string;
    modbusType: ModbusType;
    modbusAddress: number;        // ← dirección dinámica editable
    opcuaDataType: string;        // Boolean, Int16, Int32, Double...
    scaleFactor: number;
    unit: string;
    readable: boolean;
    writable: boolean;
    is32Bit?: boolean;
    bitPosition?: 'low' | 'high';
    value?: number | boolean | null;  // lectura actual (referencia)
}

/** Campos que el módulo de configuración puede modificar. */
export type RegisterPatch = Partial<Pick<RegisterConfig,
    'description' | 'modbusType' | 'modbusAddress' | 'opcuaDataType' |
    'scaleFactor' | 'unit' | 'readable' | 'writable' | 'is32Bit' | 'bitPosition'
>> & { name: string };
