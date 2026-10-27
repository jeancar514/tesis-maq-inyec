/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CONFIGURACIÓN DE SWAGGER / OPENAPI
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'SPX5 OPC UA Bridge - API REST',
            version: '1.0.0',
            description: `
## 🌉 Puente OPC UA ↔ Modbus TCP para Gateway Industrial SPX5

Esta API permite **leer y escribir** registros del gateway industrial SPX5 
a través de endpoints HTTP REST.

### Protocolos soportados:
- **Modbus TCP** → Comunicación directa con el SPX5 (puerto 502)
- **OPC UA** → Servidor estándar industrial (puerto 4840)
- **REST API** → Esta interfaz HTTP (puerto 3000)

### Tipos de registros Modbus:
| Tipo | Función | Acceso |
|------|---------|--------|
| Input Register | Función 4 | Solo lectura |
| Holding Register | Función 3/6 | Lectura/Escritura |
| Coil | Función 1/5 | Lectura/Escritura |
| Discrete Input | Función 2 | Solo lectura |
            `,
            contact: {
                name: 'SPX5 Bridge Support'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Servidor de desarrollo'
            }
        ],
        tags: [
            {
                name: 'Registros',
                description: 'Lectura y escritura de registros del SPX5'
            },
            {
                name: 'Sistema',
                description: 'Estado y diagnóstico del sistema'
            }
        ],
        components: {
            schemas: {
                Register: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            example: 'Temperature',
                            description: 'Nombre del registro'
                        },
                        description: {
                            type: 'string',
                            example: 'Temperatura del proceso en °C',
                            description: 'Descripción del registro'
                        },
                        value: {
                            oneOf: [
                                { type: 'number' },
                                { type: 'boolean' },
                                { type: 'string' }
                            ],
                            example: 25.3,
                            description: 'Valor actual del registro',
                            nullable: true
                        },
                        unit: {
                            type: 'string',
                            example: '°C',
                            description: 'Unidad de medida'
                        },
                        modbusType: {
                            type: 'string',
                            enum: ['inputRegister', 'holdingRegister', 'coil', 'discreteInput'],
                            example: 'inputRegister',
                            description: 'Tipo de registro Modbus'
                        },
                        modbusAddress: {
                            type: 'integer',
                            example: 0,
                            description: 'Dirección del registro Modbus'
                        },
                        readable: {
                            type: 'boolean',
                            example: true
                        },
                        writable: {
                            type: 'boolean',
                            example: false
                        }
                    }
                },
                RegistersResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        timestamp: { type: 'string', format: 'date-time' },
                        modbusConnected: { type: 'boolean', example: false },
                        modbusHost: { type: 'string', example: '192.168.1.100' },
                        totalRegisters: { type: 'integer', example: 12 },
                        registers: {
                            type: 'array',
                            items: { '$ref': '#/components/schemas/Register' }
                        }
                    }
                },
                SingleRegisterResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        timestamp: { type: 'string', format: 'date-time' },
                        register: { '$ref': '#/components/schemas/Register' }
                    }
                },
                WriteRequest: {
                    type: 'object',
                    required: ['value'],
                    properties: {
                        value: {
                            oneOf: [
                                { type: 'number' },
                                { type: 'boolean' }
                            ],
                            description: 'Valor a escribir en el registro'
                        }
                    },
                    examples: {
                        temperature: {
                            summary: 'Setpoint de temperatura',
                            value: { value: 25.5 }
                        },
                        boolean: {
                            summary: 'Control de bomba',
                            value: { value: true }
                        }
                    }
                },
                WriteResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string', example: 'Valor escrito exitosamente en TemperatureSetpoint' },
                        register: { type: 'string', example: 'TemperatureSetpoint' },
                        value: { type: 'number', example: 25.5 },
                        unit: { type: 'string', example: '°C' },
                        warning: {
                            type: 'string',
                            description: 'Advertencia si el SPX5 no está conectado',
                            nullable: true
                        }
                    }
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        error: { type: 'string', example: 'Descripción del error' }
                    }
                },
                StatusResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        timestamp: { type: 'string', format: 'date-time' },
                        system: {
                            type: 'object',
                            properties: {
                                modbus: {
                                    type: 'object',
                                    properties: {
                                        connected: { type: 'boolean', example: false },
                                        host: { type: 'string', example: '192.168.1.100' },
                                        port: { type: 'integer', example: 502 }
                                    }
                                },
                                opcua: {
                                    type: 'object',
                                    properties: {
                                        endpoint: { type: 'string', example: 'opc.tcp://localhost:4840/UA/SPX5Bridge' },
                                        nodesCount: { type: 'integer', example: 12 }
                                    }
                                },
                                api: {
                                    type: 'object',
                                    properties: {
                                        port: { type: 'integer', example: 3000 }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        paths: {
            '/api/kpis': {
                get: {
                    tags: ['Registros'],
                    summary: 'Obtener los KPIs',
                    description: 'Retorna un objeto con los valores actuales de los KPIs (registros de tipo "kpis").\n\nNuevo: Para recibir actualizaciones automáticas, conecta un WebSocket a ws://<host>:<port>/ws/kpis. El servidor enviará los KPIs cada vez que cambien.',
                    responses: {
                        '200': {
                            description: 'KPIs obtenidos exitosamente',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        additionalProperties: {
                                            type: 'number'
                                        },
                                        example: {
                                            "Tiempo de Ciclo": 12.5,
                                            "Producción": 1500,
                                            "Rendimiento de Calidad": 98.7
                                        }
                                    }
                                }
                            }
                        },
                        '500': {
                            description: 'Error interno del servidor',
                            content: {
                                'application/json': {
                                    schema: { '$ref': '#/components/schemas/ErrorResponse' }
                                }
                            }
                        }
                    }
                }
            },
            '/api/registers': {
                get: {
                    tags: ['Registros'],
                    summary: 'Obtener todos los registros del SPX5',
                    description: 'Retorna el valor actual de **todos** los registros configurados del gateway SPX5, incluyendo temperaturas, presiones, estados de bomba/válvulas, etc.',
                    responses: {
                        '200': {
                            description: 'Lista de registros obtenida exitosamente',
                            content: {
                                'application/json': {
                                    schema: { '$ref': '#/components/schemas/RegistersResponse' }
                                }
                            }
                        },
                        '500': {
                            description: 'Error interno del servidor',
                            content: {
                                'application/json': {
                                    schema: { '$ref': '#/components/schemas/ErrorResponse' }
                                }
                            }
                        }
                    }
                }
            },
            '/api/registers/{name}': {
                get: {
                    tags: ['Registros'],
                    summary: 'Obtener un registro específico',
                    description: 'Retorna el valor actual de un registro específico identificado por su nombre.',
                    parameters: [
                        {
                            name: 'name',
                            in: 'path',
                            required: true,
                            description: 'Nombre del registro a leer',
                            schema: {
                                type: 'string',
                                enum: [
                                    'Temperature', 'Pressure', 'FlowRate', 'SystemStatus',
                                    'TemperatureSetpoint', 'PressureSetpoint', 'OperationMode',
                                    'PumpRunning', 'ValveOpen', 'AlarmAcknowledge',
                                    'EmergencyStop', 'DoorOpen'
                                ]
                            }
                        }
                    ],
                    responses: {
                        '200': {
                            description: 'Registro encontrado',
                            content: {
                                'application/json': {
                                    schema: { '$ref': '#/components/schemas/SingleRegisterResponse' }
                                }
                            }
                        },
                        '404': {
                            description: 'Registro no encontrado',
                            content: {
                                'application/json': {
                                    schema: { '$ref': '#/components/schemas/ErrorResponse' }
                                }
                            }
                        }
                    }
                },
                post: {
                    tags: ['Registros'],
                    summary: 'Escribir valor en un registro del SPX5',
                    description: `Escribe un valor en un registro **escribible** del SPX5 vía Modbus TCP.

**Registros escribibles:**
| Nombre | Tipo | Rango |
|--------|------|-------|
| TemperatureSetpoint | Double | 0 - 100 °C |
| PressureSetpoint | Double | 0 - 50 Bar |
| OperationMode | UInt16 | 0 (Manual), 1 (Auto), 2 (Remoto) |
| PumpRunning | Boolean | true / false |
| ValveOpen | Boolean | true / false |
| AlarmAcknowledge | Boolean | true / false |

> ⚠️ Si el SPX5 no está conectado, el valor se guarda solo en cache local.`,
                    parameters: [
                        {
                            name: 'name',
                            in: 'path',
                            required: true,
                            description: 'Nombre del registro a escribir',
                            schema: {
                                type: 'string',
                                enum: [
                                    'TemperatureSetpoint', 'PressureSetpoint', 'OperationMode',
                                    'PumpRunning', 'ValveOpen', 'AlarmAcknowledge'
                                ]
                            }
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { '$ref': '#/components/schemas/WriteRequest' },
                                examples: {
                                    temperatura: {
                                        summary: 'Establecer temperatura a 25.5°C',
                                        value: { value: 25.5 }
                                    },
                                    bomba: {
                                        summary: 'Encender bomba',
                                        value: { value: true }
                                    },
                                    modo: {
                                        summary: 'Cambiar a modo automático',
                                        value: { value: 1 }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '200': {
                            description: 'Valor escrito exitosamente',
                            content: {
                                'application/json': {
                                    schema: { '$ref': '#/components/schemas/WriteResponse' }
                                }
                            }
                        },
                        '400': {
                            description: 'Valor inválido o fuera de rango',
                            content: {
                                'application/json': {
                                    schema: { '$ref': '#/components/schemas/ErrorResponse' }
                                }
                            }
                        },
                        '403': {
                            description: 'Registro de solo lectura',
                            content: {
                                'application/json': {
                                    schema: { '$ref': '#/components/schemas/ErrorResponse' }
                                }
                            }
                        },
                        '404': {
                            description: 'Registro no encontrado',
                            content: {
                                'application/json': {
                                    schema: { '$ref': '#/components/schemas/ErrorResponse' }
                                }
                            }
                        }
                    }
                }
            },
            '/api/status': {
                get: {
                    tags: ['Sistema'],
                    summary: 'Estado general del sistema',
                    description: 'Retorna el estado actual de todos los componentes: conexión Modbus, servidor OPC UA y API REST.',
                    responses: {
                        '200': {
                            description: 'Estado del sistema',
                            content: {
                                'application/json': {
                                    schema: { '$ref': '#/components/schemas/StatusResponse' }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    apis: [] // No usamos anotaciones JSDoc, todo está definido arriba
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
