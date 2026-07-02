-- ═══════════════════════════════════════════════════════════════════════════════
-- DATOS SEMILLA — MÁQUINA DE INYECCIÓN (SPX5)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Idempotente: usa ON CONFLICT DO NOTHING.
-- Tablas sin esquemas, con prefijo de 3 letras por módulo.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── Fases del ciclo (secuencia de proceso) ───────────────────────────────────
INSERT INTO fase_ciclo (orden, codigo, nombre, modulo) VALUES
    (1,  'cierre_molde',       'Cierre de Molde',       'cierre'),
    (2,  'proteccion_molde',   'Protección de Molde',   'cierre'),
    (3,  'tonelaje',           'Tonelaje',              'cierre'),
    (4,  'avance_carro',       'Avance de Carro',       'inyeccion'),
    (5,  'inyeccion',          'Inyección',             'inyeccion'),
    (6,  'transferencia_vp',   'Transferencia V/P',     'inyeccion'),
    (7,  'sostenimiento',      'Sostenimiento',         'inyeccion'),
    (8,  'enfriamiento',       'Enfriamiento',          'calefaccion'),
    (9,  'retorno_carro',      'Retorno de Carro',      'inyeccion'),
    (10, 'apertura',           'Apertura',              'cierre'),
    (11, 'eyeccion',           'Eyección',              'eyeccion'),
    (12, 'dosificacion',       'Dosificación',          'inyeccion')
ON CONFLICT (orden) DO NOTHING;

-- ── Dispositivos ─────────────────────────────────────────────────────────────
INSERT INTO dispositivo (codigo, nombre, tipo, modulo, descripcion) VALUES
    ('maquina',      'Máquina de Inyección', 'maquina',          'dashboard',    'Estado global, KPIs y comando de ciclo'),
    ('servomotor_1', 'Servomotor 1',         'servomotor',       'inyeccion',    'Servomotor de inyección / husillo'),
    ('servomotor_2', 'Servomotor 2',         'servomotor',       'cierre',       'Servomotor de cierre / molde'),
    ('husillo',      'Husillo',              'husillo',          'inyeccion',    'Husillo de plastificación / inyección'),
    ('molde',        'Molde',                'molde',            'cierre',       'Unidad de cierre del molde'),
    ('expulsor',     'Expulsor',             'expulsor',         'eyeccion',     'Sistema de eyección de pieza'),
    ('zona_1',       'Zona 1 - Alim.',       'zona_calefaccion', 'calefaccion',  'Banda calefactora zona 1'),
    ('zona_2',       'Zona 2 - Trans. 1',    'zona_calefaccion', 'calefaccion',  'Banda calefactora zona 2'),
    ('zona_3',       'Zona 3 - Trans. 2',    'zona_calefaccion', 'calefaccion',  'Banda calefactora zona 3'),
    ('zona_4',       'Zona 4 - Dosif.',      'zona_calefaccion', 'calefaccion',  'Banda calefactora zona 4'),
    ('zona_5',       'Zona 5 - Salida',      'zona_calefaccion', 'calefaccion',  'Banda calefactora zona 5')
ON CONFLICT (codigo) DO NOTHING;

-- ── Servomotores ─────────────────────────────────────────────────────────────
INSERT INTO servomotor (dispositivo_id, eje, descripcion) VALUES
    ((SELECT id FROM dispositivo WHERE codigo='servomotor_1'), 'inyeccion', 'Servomotor 1 - eje de inyección'),
    ((SELECT id FROM dispositivo WHERE codigo='servomotor_2'), 'cierre',    'Servomotor 2 - eje de cierre')
ON CONFLICT (dispositivo_id) DO NOTHING;

-- ── Modo de operación (gen_) ─────────────────────────────────────────────────
INSERT INTO gen_modo_operacion (dispositivo_id, modo)
VALUES ((SELECT id FROM dispositivo WHERE codigo='maquina'), 1)
ON CONFLICT (dispositivo_id) DO NOTHING;

-- ── Comando de ciclo (gen_) ──────────────────────────────────────────────────
INSERT INTO gen_comando_ciclo (dispositivo_id, comando, activa)
VALUES ((SELECT id FROM dispositivo WHERE codigo='maquina'), 'stop', FALSE)
ON CONFLICT (dispositivo_id) DO NOTHING;

-- ── Configuración inicial husillo (inj_) ─────────────────────────────────────
INSERT INTO inj_husillo_config (dispositivo_id, control_encendido, velocidad_husillo, torque_husillo)
VALUES ((SELECT id FROM dispositivo WHERE codigo='husillo'), 0, 0, 0)
ON CONFLICT (dispositivo_id) DO NOTHING;

-- ── Configuración inicial molde (clp_) ───────────────────────────────────────
INSERT INTO clp_molde_config (dispositivo_id, control_encendido, torque, cambio_posicion, posicion1, posicion2, velocidad_posicion)
VALUES ((SELECT id FROM dispositivo WHERE codigo='molde'), 0, 0, 0, 0, 0, 0)
ON CONFLICT (dispositivo_id) DO NOTHING;

-- ── Zonas de calefacción (hea_) ──────────────────────────────────────────────
INSERT INTO hea_zona_calefaccion (dispositivo_id, nombre, setpoint, tolerancia_sup, tolerancia_inf) VALUES
    ((SELECT id FROM dispositivo WHERE codigo='zona_1'), 'Zona 1 - Alim.',    210, 5, 5),
    ((SELECT id FROM dispositivo WHERE codigo='zona_2'), 'Zona 2 - Trans. 1', 225, 5, 5),
    ((SELECT id FROM dispositivo WHERE codigo='zona_3'), 'Zona 3 - Trans. 2', 240, 5, 5),
    ((SELECT id FROM dispositivo WHERE codigo='zona_4'), 'Zona 4 - Dosif.',   240, 5, 5),
    ((SELECT id FROM dispositivo WHERE codigo='zona_5'), 'Zona 5 - Salida',   235, 5, 5)
ON CONFLICT (dispositivo_id) DO NOTHING;

-- ── Perfil por defecto + etapas ──────────────────────────────────────────────
INSERT INTO perfil (nombre, descripcion, activo) VALUES
    ('Perfil por defecto', 'Receta base cargada desde el frontend', TRUE)
ON CONFLICT (nombre) DO NOTHING;

-- Etapas de inyección (inj_)
INSERT INTO inj_etapa_inyeccion (perfil_id, orden, punto_inicio, velocidad) VALUES
    ((SELECT id FROM perfil WHERE nombre='Perfil por defecto'), 1, 180.00, 120.0),
    ((SELECT id FROM perfil WHERE nombre='Perfil por defecto'), 2, 145.50, 95.0),
    ((SELECT id FROM perfil WHERE nombre='Perfil por defecto'), 3, 90.25,  150.0),
    ((SELECT id FROM perfil WHERE nombre='Perfil por defecto'), 4, 40.00,  65.0),
    ((SELECT id FROM perfil WHERE nombre='Perfil por defecto'), 5, 15.00,  20.0)
ON CONFLICT (perfil_id, orden) DO UPDATE SET
    punto_inicio = EXCLUDED.punto_inicio,
    velocidad    = EXCLUDED.velocidad;

-- Etapas de sostenimiento (inj_)
INSERT INTO inj_etapa_sostenimiento (perfil_id, orden, presion, tiempo, velocidad, posicion) VALUES
    ((SELECT id FROM perfil WHERE nombre='Perfil por defecto'), 1, 750, 1.50, 15.0, 20.0),
    ((SELECT id FROM perfil WHERE nombre='Perfil por defecto'), 2, 620, 2.00, 12.0, 18.0),
    ((SELECT id FROM perfil WHERE nombre='Perfil por defecto'), 3, 500, 3.00, 8.0,  15.0),
    ((SELECT id FROM perfil WHERE nombre='Perfil por defecto'), 4, 450, 1.50, 5.0,  10.0)
ON CONFLICT (perfil_id, orden) DO UPDATE SET
    presion   = EXCLUDED.presion,
    tiempo    = EXCLUDED.tiempo,
    velocidad = EXCLUDED.velocidad,
    posicion  = EXCLUDED.posicion;

-- Etapas de cierre (clp_)
INSERT INTO clp_etapa_cierre (perfil_id, orden, etiqueta, inicio, velocidad, torque_max) VALUES
    ((SELECT id FROM perfil WHERE nombre='Perfil por defecto'), 1, 'Fase 1',                 1150.0, 350, 80),
    ((SELECT id FROM perfil WHERE nombre='Perfil por defecto'), 2, 'Fase 2',                 450.0,  200, 70),
    ((SELECT id FROM perfil WHERE nombre='Perfil por defecto'), 3, 'Inicio Protección Molde',120.5,  45,  15)
ON CONFLICT (perfil_id, orden) DO UPDATE SET
    etiqueta   = EXCLUDED.etiqueta,
    inicio     = EXCLUDED.inicio,
    velocidad  = EXCLUDED.velocidad,
    torque_max = EXCLUDED.torque_max;

-- Etapas de apertura (clp_)
INSERT INTO clp_etapa_apertura (perfil_id, orden, etiqueta, posicion, velocidad, aceleracion) VALUES
    ((SELECT id FROM perfil WHERE nombre='Perfil por defecto'), 1, 'Fase 1',         450.0, 850.0, 1200),
    ((SELECT id FROM perfil WHERE nombre='Perfil por defecto'), 2, 'Fase 2',         680.0, 100.0, 600),
    ((SELECT id FROM perfil WHERE nombre='Perfil por defecto'), 3, 'Posición Final', 750.0, 20.0,  300)
ON CONFLICT (perfil_id, orden) DO UPDATE SET
    etiqueta    = EXCLUDED.etiqueta,
    posicion    = EXCLUDED.posicion,
    velocidad   = EXCLUDED.velocidad,
    aceleracion = EXCLUDED.aceleracion;

-- Etapas de eyección (ejc_)
INSERT INTO ejc_etapa_eyeccion (perfil_id, orden, etiqueta, posicion, velocidad) VALUES
    ((SELECT id FROM perfil WHERE nombre='Perfil por defecto'), 1, 'Despegue',  25.0,  40.0),
    ((SELECT id FROM perfil WHERE nombre='Perfil por defecto'), 2, 'Expulsión', 120.0, 180.0),
    ((SELECT id FROM perfil WHERE nombre='Perfil por defecto'), 3, 'Final',     150.0, 20.0)
ON CONFLICT (perfil_id, orden) DO UPDATE SET
    etiqueta  = EXCLUDED.etiqueta,
    posicion  = EXCLUDED.posicion,
    velocidad = EXCLUDED.velocidad;

-- ── Señales I/O (mnt_) ──────────────────────────────────────────────────────
INSERT INTO mnt_senal_io (modulo, direccion, etiqueta, es_salida, grupo) VALUES
    ('mantenimiento', '%IX0.0', 'DI_01: Paro de Emergencia OK',      FALSE, 'SEGURIDAD'),
    ('mantenimiento', '%IX0.1', 'DI_02: Puerta Delantera Abierta',   FALSE, 'SEGURIDAD'),
    ('mantenimiento', '%IX0.2', 'DI_03: Presión de Aire Crítica',    FALSE, 'AUXILIARES'),
    ('mantenimiento', '%IX0.3', 'DI_04: Sensor de Molde Cerrado',    FALSE, 'CIERRE'),
    ('mantenimiento', '%IX0.4', 'DI_05: Fin de Carrera Retroceso',   FALSE, 'INYECCION'),
    ('mantenimiento', '%IX0.5', 'DI_06: Nivel Aceite Hidráulico',    FALSE, 'AUXILIARES'),
    ('mantenimiento', '%IX0.6', 'DI_07: Protección Térmica Motor',   FALSE, 'SEGURIDAD'),
    ('mantenimiento', '%QX0.0', 'DO_01: Contactor Principal',        TRUE,  'AUXILIARES'),
    ('mantenimiento', '%QX0.1', 'DO_02: Válvula Cierre Lento',       TRUE,  'CIERRE'),
    ('mantenimiento', '%QX0.2', 'DO_03: Válvula Inyección 1',        TRUE,  'INYECCION'),
    ('mantenimiento', '%QX0.3', 'DO_04: Bomba de Lubricación',       TRUE,  'AUXILIARES'),
    ('mantenimiento', '%QX0.4', 'DO_05: Soplado de Aire',            TRUE,  'EXPULSOR')
ON CONFLICT (direccion) DO NOTHING;

-- ── Alarmas (mnt_) ──────────────────────────────────────────────────────────
INSERT INTO mnt_alarma (codigo, severidad, titulo, descripcion, modulo) VALUES
    ('ALM_502', 'critical', 'Exceso de Torque en Eje',                'Límite AX_x_TQ excedido (threshold > 185%)', 'eyeccion'),
    ('ALM_104', 'warning',  'Falla Comunicación Sensor Redundante',   'Timeout en respuesta Profinet Nodo 04',      'mantenimiento'),
    ('ALM_882', 'critical', 'Paro de Emergencia Presionado',          'Interrupción de lazo de seguridad dual',     'mantenimiento'),
    ('INF_002', 'info',     'Cambio de Receta Finalizado',            'Receta cargada con éxito',                   'dashboard')
ON CONFLICT (codigo) DO NOTHING;
