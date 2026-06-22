-- ═══════════════════════════════════════════════════════════════════════════════
-- DATOS SEMILLA — MÁQUINA DE INYECCIÓN (SPX5)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Carga catálogos, dispositivos y configuración inicial tomados del frontend y de
-- config/registers.json. Idempotente: usa ON CONFLICT DO NOTHING.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── Módulos ──────────────────────────────────────────────────────────────────
INSERT INTO modulo (codigo, nombre, descripcion) VALUES
    ('dashboard',   'Dashboard',            'Indicadores generales y control de ciclo'),
    ('inyeccion',   'Inyección',            'Husillo y servomotor de inyección'),
    ('cierre',      'Cierre / Molde',       'Servomotor y control del molde'),
    ('calefaccion', 'Calefacción',          'Zonas térmicas del cañón'),
    ('eyeccion',    'Eyección',             'Expulsor de pieza'),
    ('mantenimiento','Mantenimiento',       'Señales I/O y alarmas')
ON CONFLICT (codigo) DO NOTHING;

-- ── Tipos de dispositivo ─────────────────────────────────────────────────────
INSERT INTO tipo_dispositivo (codigo, nombre) VALUES
    ('servomotor',      'Servomotor'),
    ('husillo',         'Husillo'),
    ('molde',           'Molde'),
    ('zona_calefaccion','Zona de calefacción'),
    ('expulsor',        'Expulsor'),
    ('maquina',         'Máquina')
ON CONFLICT (codigo) DO NOTHING;

-- ── Unidades ─────────────────────────────────────────────────────────────────
INSERT INTO unidad (simbolo, nombre) VALUES
    ('RPM',     'Revoluciones por minuto'),
    ('Nm',      'Newton metro'),
    ('°',       'Grados'),
    ('A',       'Amperios'),
    ('V',       'Voltios'),
    ('mm',      'Milímetros'),
    ('mm/s',    'Milímetros por segundo'),
    ('mm/s2',   'Milímetros por segundo cuadrado'),
    ('%',       'Porcentaje'),
    ('bar',     'Bar'),
    ('s',       'Segundos'),
    ('°C',      'Grados Celsius'),
    ('u',       'Unidades'),
    ('-',       'Sin unidad')
ON CONFLICT (simbolo) DO NOTHING;

-- ── Tipos de dato ────────────────────────────────────────────────────────────
INSERT INTO tipo_dato (codigo) VALUES
    ('Boolean'), ('Int16'), ('UInt16'), ('Int32'), ('UInt32'),
    ('Float'), ('Double'), ('String')
ON CONFLICT (codigo) DO NOTHING;

-- ── Severidades de alarma ────────────────────────────────────────────────────
INSERT INTO severidad_alarma (codigo, nombre, nivel) VALUES
    ('critical', 'Crítica',     3),
    ('warning',  'Advertencia', 2),
    ('info',     'Información',  1)
ON CONFLICT (codigo) DO NOTHING;

-- ── Fases del ciclo (secuencia de proceso) ───────────────────────────────────
INSERT INTO fase_ciclo (orden, codigo, nombre, modulo_id) VALUES
    (1,  'cierre_molde',       'Cierre de Molde',       (SELECT id FROM modulo WHERE codigo='cierre')),
    (2,  'proteccion_molde',   'Protección de Molde',   (SELECT id FROM modulo WHERE codigo='cierre')),
    (3,  'tonelaje',           'Tonelaje',              (SELECT id FROM modulo WHERE codigo='cierre')),
    (4,  'avance_carro',       'Avance de Carro',       (SELECT id FROM modulo WHERE codigo='inyeccion')),
    (5,  'inyeccion',          'Inyección',             (SELECT id FROM modulo WHERE codigo='inyeccion')),
    (6,  'transferencia_vp',   'Transferencia V/P',     (SELECT id FROM modulo WHERE codigo='inyeccion')),
    (7,  'sostenimiento',      'Sostenimiento',         (SELECT id FROM modulo WHERE codigo='inyeccion')),
    (8,  'enfriamiento',       'Enfriamiento',          (SELECT id FROM modulo WHERE codigo='calefaccion')),
    (9,  'retorno_carro',      'Retorno de Carro',      (SELECT id FROM modulo WHERE codigo='inyeccion')),
    (10, 'apertura',           'Apertura',              (SELECT id FROM modulo WHERE codigo='cierre')),
    (11, 'eyeccion',           'Eyección',              (SELECT id FROM modulo WHERE codigo='eyeccion')),
    (12, 'dosificacion',       'Dosificación',          (SELECT id FROM modulo WHERE codigo='inyeccion'))
ON CONFLICT (orden) DO NOTHING;

-- ── Dispositivos ─────────────────────────────────────────────────────────────
INSERT INTO dispositivo (modulo_id, tipo_dispositivo_id, codigo, nombre, descripcion) VALUES
    ((SELECT id FROM modulo WHERE codigo='dashboard'),
     (SELECT id FROM tipo_dispositivo WHERE codigo='maquina'),
     'maquina', 'Máquina de Inyección', 'Estado global, KPIs y comando de ciclo'),

    ((SELECT id FROM modulo WHERE codigo='inyeccion'),
     (SELECT id FROM tipo_dispositivo WHERE codigo='servomotor'),
     'servomotor_1', 'Servomotor 1', 'Servomotor de inyección / husillo'),

    ((SELECT id FROM modulo WHERE codigo='cierre'),
     (SELECT id FROM tipo_dispositivo WHERE codigo='servomotor'),
     'servomotor_2', 'Servomotor 2', 'Servomotor de cierre / molde'),

    ((SELECT id FROM modulo WHERE codigo='inyeccion'),
     (SELECT id FROM tipo_dispositivo WHERE codigo='husillo'),
     'husillo', 'Husillo', 'Husillo de plastificación / inyección'),

    ((SELECT id FROM modulo WHERE codigo='cierre'),
     (SELECT id FROM tipo_dispositivo WHERE codigo='molde'),
     'molde', 'Molde', 'Unidad de cierre del molde'),

    ((SELECT id FROM modulo WHERE codigo='eyeccion'),
     (SELECT id FROM tipo_dispositivo WHERE codigo='expulsor'),
     'expulsor', 'Expulsor', 'Sistema de eyección de pieza'),

    ((SELECT id FROM modulo WHERE codigo='calefaccion'),
     (SELECT id FROM tipo_dispositivo WHERE codigo='zona_calefaccion'),
     'zona_1', 'Zona 1 - Alim.', 'Banda calefactora zona 1'),
    ((SELECT id FROM modulo WHERE codigo='calefaccion'),
     (SELECT id FROM tipo_dispositivo WHERE codigo='zona_calefaccion'),
     'zona_2', 'Zona 2 - Trans. 1', 'Banda calefactora zona 2'),
    ((SELECT id FROM modulo WHERE codigo='calefaccion'),
     (SELECT id FROM tipo_dispositivo WHERE codigo='zona_calefaccion'),
     'zona_3', 'Zona 3 - Trans. 2', 'Banda calefactora zona 3'),
    ((SELECT id FROM modulo WHERE codigo='calefaccion'),
     (SELECT id FROM tipo_dispositivo WHERE codigo='zona_calefaccion'),
     'zona_4', 'Zona 4 - Dosif.', 'Banda calefactora zona 4'),
    ((SELECT id FROM modulo WHERE codigo='calefaccion'),
     (SELECT id FROM tipo_dispositivo WHERE codigo='zona_calefaccion'),
     'zona_5', 'Zona 5 - Salida', 'Banda calefactora zona 5')
ON CONFLICT (codigo) DO NOTHING;

-- ── Servomotores (especialización 1 y 2) ─────────────────────────────────────
INSERT INTO servomotor (dispositivo_id, eje, descripcion) VALUES
    ((SELECT id FROM dispositivo WHERE codigo='servomotor_1'), 'inyeccion', 'Servomotor 1 - eje de inyección'),
    ((SELECT id FROM dispositivo WHERE codigo='servomotor_2'), 'cierre',    'Servomotor 2 - eje de cierre')
ON CONFLICT (dispositivo_id) DO NOTHING;

-- ── Variables / mapa Modbus (desde config/registers.json) ─────────────────────
-- KPIs y estado de la máquina
INSERT INTO variable (dispositivo_id, codigo, descripcion, unidad_id, tipo_dato_id, modbus_tipo, modbus_direccion, escribible, leible) VALUES
    ((SELECT id FROM dispositivo WHERE codigo='maquina'), 'cycleTime',     'Tiempo de Ciclo',         (SELECT id FROM unidad WHERE simbolo='s'), (SELECT id FROM tipo_dato WHERE codigo='Double'), 'inputRegister',   0,  FALSE, TRUE),
    ((SELECT id FROM dispositivo WHERE codigo='maquina'), 'productionCount','Producción',             (SELECT id FROM unidad WHERE simbolo='u'), (SELECT id FROM tipo_dato WHERE codigo='Double'), 'holdingRegister', 1,  FALSE, TRUE),
    ((SELECT id FROM dispositivo WHERE codigo='maquina'), 'qualityYield',  'Rendimiento de Calidad',  (SELECT id FROM unidad WHERE simbolo='%'), (SELECT id FROM tipo_dato WHERE codigo='Double'), 'holdingRegister', 2,  FALSE, TRUE),
    ((SELECT id FROM dispositivo WHERE codigo='maquina'), 'operationMode', 'Modo de operación',       (SELECT id FROM unidad WHERE simbolo='-'), (SELECT id FROM tipo_dato WHERE codigo='Int16'),  'holdingRegister', 10, TRUE,  TRUE),
    ((SELECT id FROM dispositivo WHERE codigo='maquina'), 'cycleCommand',  'Comando de ciclo',        (SELECT id FROM unidad WHERE simbolo='-'), (SELECT id FROM tipo_dato WHERE codigo='Boolean'),'coil',            11, TRUE,  TRUE)
ON CONFLICT (dispositivo_id, codigo) DO NOTHING;

-- Servomotor 1 (lecturas del servo)
INSERT INTO variable (dispositivo_id, codigo, descripcion, unidad_id, tipo_dato_id, modbus_tipo, modbus_direccion, escribible, leible) VALUES
    ((SELECT id FROM dispositivo WHERE codigo='servomotor_1'), 'speed',    'Lectura de Velocidad del Servo', (SELECT id FROM unidad WHERE simbolo='RPM'), (SELECT id FROM tipo_dato WHERE codigo='Double'), 'inputRegister', 18, FALSE, TRUE),
    ((SELECT id FROM dispositivo WHERE codigo='servomotor_1'), 'torque',   'Lectura de Torque del Servo',    (SELECT id FROM unidad WHERE simbolo='Nm'),  (SELECT id FROM tipo_dato WHERE codigo='Double'), 'inputRegister', 28, FALSE, TRUE),
    ((SELECT id FROM dispositivo WHERE codigo='servomotor_1'), 'position', 'Posición del Servo',             (SELECT id FROM unidad WHERE simbolo='°'),   (SELECT id FROM tipo_dato WHERE codigo='Double'), 'inputRegister', 38, FALSE, TRUE),
    ((SELECT id FROM dispositivo WHERE codigo='servomotor_1'), 'current',  'Corriente del Servo',            (SELECT id FROM unidad WHERE simbolo='A'),   (SELECT id FROM tipo_dato WHERE codigo='Double'), 'inputRegister', 48, FALSE, TRUE),
    ((SELECT id FROM dispositivo WHERE codigo='servomotor_1'), 'voltage',  'Voltaje del Servo',              (SELECT id FROM unidad WHERE simbolo='V'),   (SELECT id FROM tipo_dato WHERE codigo='Double'), 'inputRegister', 58, FALSE, TRUE)
ON CONFLICT (dispositivo_id, codigo) DO NOTHING;

-- Husillo (control)
INSERT INTO variable (dispositivo_id, codigo, descripcion, unidad_id, tipo_dato_id, modbus_tipo, modbus_direccion, escribible, leible, es_32bit, bit_posicion) VALUES
    ((SELECT id FROM dispositivo WHERE codigo='husillo'), 'controlEncendido',     'Control de encendido del husillo',          (SELECT id FROM unidad WHERE simbolo='-'),  (SELECT id FROM tipo_dato WHERE codigo='Int16'), 'holdingRegister', 10, TRUE, TRUE, FALSE, NULL),
    ((SELECT id FROM dispositivo WHERE codigo='husillo'), 'velocidadHusilloLow',  'Velocidad husillo (palabra baja)',          (SELECT id FROM unidad WHERE simbolo='-'),  (SELECT id FROM tipo_dato WHERE codigo='Int16'), 'holdingRegister', 20, TRUE, TRUE, TRUE,  'low'),
    ((SELECT id FROM dispositivo WHERE codigo='husillo'), 'velocidadHusilloHigh', 'Velocidad husillo (palabra alta)',          (SELECT id FROM unidad WHERE simbolo='-'),  (SELECT id FROM tipo_dato WHERE codigo='Int16'), 'holdingRegister', 21, TRUE, TRUE, TRUE,  'high'),
    ((SELECT id FROM dispositivo WHERE codigo='husillo'), 'torqueHusillo',        'Torque de operación del husillo',           (SELECT id FROM unidad WHERE simbolo='Nm'), (SELECT id FROM tipo_dato WHERE codigo='Int32'), 'holdingRegister', 30, TRUE, TRUE, FALSE, NULL)
ON CONFLICT (dispositivo_id, codigo) DO NOTHING;

-- Molde (control)
INSERT INTO variable (dispositivo_id, codigo, descripcion, unidad_id, tipo_dato_id, modbus_tipo, modbus_direccion, escribible, leible) VALUES
    ((SELECT id FROM dispositivo WHERE codigo='molde'), 'moldControlEncendido', 'Control de encendido del servo de molde', (SELECT id FROM unidad WHERE simbolo='-'),    (SELECT id FROM tipo_dato WHERE codigo='Int16'), 'holdingRegister', 40, TRUE, TRUE),
    ((SELECT id FROM dispositivo WHERE codigo='molde'), 'moldTorque',           'Torque máximo del servo de cierre',       (SELECT id FROM unidad WHERE simbolo='%'),    (SELECT id FROM tipo_dato WHERE codigo='Int16'), 'holdingRegister', 41, TRUE, TRUE),
    ((SELECT id FROM dispositivo WHERE codigo='molde'), 'moldCambioPosicion',   'Posición de cambio de velocidad',         (SELECT id FROM unidad WHERE simbolo='mm'),   (SELECT id FROM tipo_dato WHERE codigo='Int16'), 'holdingRegister', 42, TRUE, TRUE),
    ((SELECT id FROM dispositivo WHERE codigo='molde'), 'moldPosicion1',        'Posición 1 de referencia del molde',      (SELECT id FROM unidad WHERE simbolo='mm'),   (SELECT id FROM tipo_dato WHERE codigo='Int16'), 'holdingRegister', 43, TRUE, TRUE),
    ((SELECT id FROM dispositivo WHERE codigo='molde'), 'moldPosicion2',        'Posición 2 de referencia del molde',      (SELECT id FROM unidad WHERE simbolo='mm'),   (SELECT id FROM tipo_dato WHERE codigo='Int16'), 'holdingRegister', 44, TRUE, TRUE),
    ((SELECT id FROM dispositivo WHERE codigo='molde'), 'moldVelocidadPosicion','Velocidad del servo en posición',         (SELECT id FROM unidad WHERE simbolo='mm/s'), (SELECT id FROM tipo_dato WHERE codigo='Int16'), 'holdingRegister', 45, TRUE, TRUE)
ON CONFLICT (dispositivo_id, codigo) DO NOTHING;

-- ── Configuración inicial husillo y molde ─────────────────────────────────────
INSERT INTO husillo_config (dispositivo_id, control_encendido, velocidad_husillo, torque_husillo)
VALUES ((SELECT id FROM dispositivo WHERE codigo='husillo'), 0, 0, 0)
ON CONFLICT (dispositivo_id) DO NOTHING;

INSERT INTO molde_config (dispositivo_id, control_encendido, torque, cambio_posicion, posicion1, posicion2, velocidad_posicion)
VALUES ((SELECT id FROM dispositivo WHERE codigo='molde'), 0, 0, 0, 0, 0, 0)
ON CONFLICT (dispositivo_id) DO NOTHING;

-- ── Zonas de calefacción (valores del frontend) ───────────────────────────────
INSERT INTO zona_calefaccion (dispositivo_id, nombre, setpoint, tolerancia_sup, tolerancia_inf) VALUES
    ((SELECT id FROM dispositivo WHERE codigo='zona_1'), 'Zona 1 - Alim.',    210, 5, 5),
    ((SELECT id FROM dispositivo WHERE codigo='zona_2'), 'Zona 2 - Trans. 1', 225, 5, 5),
    ((SELECT id FROM dispositivo WHERE codigo='zona_3'), 'Zona 3 - Trans. 2', 240, 5, 5),
    ((SELECT id FROM dispositivo WHERE codigo='zona_4'), 'Zona 4 - Dosif.',   240, 5, 5),
    ((SELECT id FROM dispositivo WHERE codigo='zona_5'), 'Zona 5 - Salida',   235, 5, 5)
ON CONFLICT (dispositivo_id) DO NOTHING;

-- ── Estado de la máquina ──────────────────────────────────────────────────────
INSERT INTO estado_maquina (dispositivo_id, modo_operacion, comando_ciclo)
VALUES ((SELECT id FROM dispositivo WHERE codigo='maquina'), 1, 'stop')
ON CONFLICT (dispositivo_id) DO NOTHING;

-- ── Perfil por defecto + etapas (valores del frontend) ────────────────────────
INSERT INTO perfil (nombre, descripcion, activo) VALUES
    ('Perfil por defecto', 'Receta base cargada desde el frontend', TRUE)
ON CONFLICT (nombre) DO NOTHING;

-- Etapas de inyección (InjectionTable)
INSERT INTO etapa_inyeccion (perfil_id, orden, punto_inicio, velocidad) VALUES
    ((SELECT id FROM perfil WHERE nombre='Perfil por defecto'), 1, 180.00, 120.0),
    ((SELECT id FROM perfil WHERE nombre='Perfil por defecto'), 2, 145.50, 95.0),
    ((SELECT id FROM perfil WHERE nombre='Perfil por defecto'), 3, 90.25,  150.0),
    ((SELECT id FROM perfil WHERE nombre='Perfil por defecto'), 4, 40.00,  65.0),
    ((SELECT id FROM perfil WHERE nombre='Perfil por defecto'), 5, 15.00,  20.0)
ON CONFLICT (perfil_id, orden) DO NOTHING;

-- Etapas de sostenimiento (HoldingStages)
INSERT INTO etapa_sostenimiento (perfil_id, orden, presion, tiempo, velocidad, posicion) VALUES
    ((SELECT id FROM perfil WHERE nombre='Perfil por defecto'), 1, 750, 1.50, 15.0, 20.0),
    ((SELECT id FROM perfil WHERE nombre='Perfil por defecto'), 2, 620, 2.00, 12.0, 18.0),
    ((SELECT id FROM perfil WHERE nombre='Perfil por defecto'), 3, 500, 3.00, 8.0,  15.0),
    ((SELECT id FROM perfil WHERE nombre='Perfil por defecto'), 4, 450, 1.50, 5.0,  10.0)
ON CONFLICT (perfil_id, orden) DO NOTHING;

-- Etapas de cierre (ClampParameters)
INSERT INTO etapa_cierre (perfil_id, orden, etiqueta, inicio, velocidad, torque_max) VALUES
    ((SELECT id FROM perfil WHERE nombre='Perfil por defecto'), 1, 'Fase 1',                 1150.0, 350, 80),
    ((SELECT id FROM perfil WHERE nombre='Perfil por defecto'), 2, 'Fase 2',                 450.0,  200, 70),
    ((SELECT id FROM perfil WHERE nombre='Perfil por defecto'), 3, 'Inicio Protección Molde',120.5,  45,  15)
ON CONFLICT (perfil_id, orden) DO NOTHING;

-- Etapas de apertura (OpeningStages)
INSERT INTO etapa_apertura (perfil_id, orden, etiqueta, posicion, velocidad, aceleracion) VALUES
    ((SELECT id FROM perfil WHERE nombre='Perfil por defecto'), 1, 'Fase 1',        450.0, 850.0, 1200),
    ((SELECT id FROM perfil WHERE nombre='Perfil por defecto'), 2, 'Fase 2',        680.0, 100.0, 600),
    ((SELECT id FROM perfil WHERE nombre='Perfil por defecto'), 3, 'Posición Final',750.0, 20.0,  300)
ON CONFLICT (perfil_id, orden) DO NOTHING;

-- Etapas de eyección (EjectionStages)
INSERT INTO etapa_eyeccion (perfil_id, orden, etiqueta, posicion, velocidad) VALUES
    ((SELECT id FROM perfil WHERE nombre='Perfil por defecto'), 1, 'Despegue',  25.0,  40.0),
    ((SELECT id FROM perfil WHERE nombre='Perfil por defecto'), 2, 'Expulsión', 120.0, 180.0),
    ((SELECT id FROM perfil WHERE nombre='Perfil por defecto'), 3, 'Final',     150.0, 20.0)
ON CONFLICT (perfil_id, orden) DO NOTHING;

-- ── Señales I/O (IOMonitor) ────────────────────────────────────────────────────
INSERT INTO senal_io (modulo_id, direccion, etiqueta, es_salida, grupo) VALUES
    ((SELECT id FROM modulo WHERE codigo='mantenimiento'), '%IX0.0', 'DI_01: Paro de Emergencia OK',      FALSE, 'SEGURIDAD'),
    ((SELECT id FROM modulo WHERE codigo='mantenimiento'), '%IX0.1', 'DI_02: Puerta Delantera Abierta',   FALSE, 'SEGURIDAD'),
    ((SELECT id FROM modulo WHERE codigo='mantenimiento'), '%IX0.2', 'DI_03: Presión de Aire Crítica',    FALSE, 'AUXILIARES'),
    ((SELECT id FROM modulo WHERE codigo='mantenimiento'), '%IX0.3', 'DI_04: Sensor de Molde Cerrado',    FALSE, 'CIERRE'),
    ((SELECT id FROM modulo WHERE codigo='mantenimiento'), '%IX0.4', 'DI_05: Fin de Carrera Retroceso',   FALSE, 'INYECCION'),
    ((SELECT id FROM modulo WHERE codigo='mantenimiento'), '%IX0.5', 'DI_06: Nivel Aceite Hidráulico',    FALSE, 'AUXILIARES'),
    ((SELECT id FROM modulo WHERE codigo='mantenimiento'), '%IX0.6', 'DI_07: Protección Térmica Motor',   FALSE, 'SEGURIDAD'),
    ((SELECT id FROM modulo WHERE codigo='mantenimiento'), '%QX0.0', 'DO_01: Contactor Principal',        TRUE,  'AUXILIARES'),
    ((SELECT id FROM modulo WHERE codigo='mantenimiento'), '%QX0.1', 'DO_02: Válvula Cierre Lento',       TRUE,  'CIERRE'),
    ((SELECT id FROM modulo WHERE codigo='mantenimiento'), '%QX0.2', 'DO_03: Válvula Inyección 1',        TRUE,  'INYECCION'),
    ((SELECT id FROM modulo WHERE codigo='mantenimiento'), '%QX0.3', 'DO_04: Bomba de Lubricación',       TRUE,  'AUXILIARES'),
    ((SELECT id FROM modulo WHERE codigo='mantenimiento'), '%QX0.4', 'DO_05: Soplado de Aire',            TRUE,  'EXPULSOR')
ON CONFLICT (direccion) DO NOTHING;

-- ── Alarmas (AlarmHistory) ─────────────────────────────────────────────────────
INSERT INTO alarma (codigo, severidad_id, titulo, descripcion, modulo_id) VALUES
    ('ALM_502', (SELECT id FROM severidad_alarma WHERE codigo='critical'), 'Exceso de Torque en Eje',                'Límite AX_x_TQ excedido (threshold > 185%)', (SELECT id FROM modulo WHERE codigo='eyeccion')),
    ('ALM_104', (SELECT id FROM severidad_alarma WHERE codigo='warning'),  'Falla Comunicación Sensor Redundante',   'Timeout en respuesta Profinet Nodo 04',      (SELECT id FROM modulo WHERE codigo='mantenimiento')),
    ('ALM_882', (SELECT id FROM severidad_alarma WHERE codigo='critical'), 'Paro de Emergencia Presionado',          'Interrupción de lazo de seguridad dual',     (SELECT id FROM modulo WHERE codigo='mantenimiento')),
    ('INF_002', (SELECT id FROM severidad_alarma WHERE codigo='info'),     'Cambio de Receta Finalizado',            'Receta cargada con éxito',                   (SELECT id FROM modulo WHERE codigo='dashboard'))
ON CONFLICT (codigo) DO NOTHING;
