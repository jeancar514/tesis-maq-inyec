-- ═══════════════════════════════════════════════════════════════════════════════
-- DATOS SEMILLA — MÁQUINA DE INYECCIÓN (SPX5)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Esquema = módulo del FooterNav; tabla = <cod3 sección Sidebar>_<nombre>.
-- Idempotente: ON CONFLICT DO NOTHING / DO UPDATE.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═════════════════════════════════════════════════════════════════════════════
-- MAESTROS DE VALORES (dashboard.cat_*) — deben cargarse ANTES que las tablas que los referencian
-- ═════════════════════════════════════════════════════════════════════════════

INSERT INTO dashboard.cat_modo_operacion (codigo, etiqueta, descripcion) VALUES
    (1, 'Manual',     'Operación manual de la máquina'),
    (2, 'Automático', 'Operación en ciclo automático')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO dashboard.cat_valor_modo (codigo, etiqueta) VALUES
    ('activo',   'Activo'),
    ('inactivo', 'Inactivo')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO dashboard.cat_comando_ciclo (codigo, etiqueta) VALUES
    ('start', 'Iniciar Ciclo'),
    ('stop',  'Detener Ciclo')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO dashboard.cat_activacion (codigo, etiqueta) VALUES
    (TRUE,  'Activa'),
    (FALSE, 'Inactiva')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO dashboard.cat_estado_fase (codigo, etiqueta, orden, color) VALUES
    ('completado', 'Completado', 1, 'green'),
    ('activo',     'Activo',     2, 'primary'),
    ('pendiente',  'Pendiente',  3, 'slate'),
    ('bloqueado',  'Bloqueado',  4, 'red')
ON CONFLICT (codigo) DO NOTHING;

-- ── dashboard · Vista General · modo de operación (fila única) ────────────────
INSERT INTO dashboard.vgn_modo_operacion (id, modo, valor) VALUES (1, 1, 'inactivo')
ON CONFLICT (id) DO NOTHING;

-- ── dashboard · Vista General · comando de ciclo (fila única) ─────────────────
INSERT INTO dashboard.vgn_comando_ciclo (id, comando, activa) VALUES (1, 'stop', FALSE)
ON CONFLICT (id) DO NOTHING;

-- ── dashboard · Ciclo de Pasos · 12 fases del ciclo de inyección ──────────────
INSERT INTO dashboard.cip_fase (orden, nombre, estado, duracion) VALUES
    (1,  'Cierre de Molde',       'completado', 1.20),
    (2,  'Protección de Molde',   'completado', 0.45),
    (3,  'Tonelaje',              'completado', 0.80),
    (4,  'Avance de Carro',       'completado', 1.10),
    (5,  'Inyección',             'activo',     0.00),
    (6,  'Transferencia V/P',     'pendiente',  0.00),
    (7,  'Sostenimiento',         'pendiente',  0.00),
    (8,  'Enfriamiento',          'pendiente',  0.00),
    (9,  'Retorno de Carro',      'bloqueado',  0.00),
    (10, 'Apertura',              'pendiente',  0.00),
    (11, 'Eyección',              'pendiente',  0.00),
    (12, 'Dosificación',          'pendiente',  0.00)
ON CONFLICT (orden) DO NOTHING;

-- ── dashboard · Monitor de Tiempo · tiempo programado vs real por fase ────────
INSERT INTO dashboard.mdt_fase_tiempo (orden, nombre, tiempo_programado, tiempo_real) VALUES
    (1, 'Cierre',         2.10, 2.05),
    (2, 'Inyección',      1.50, 1.55),
    (3, 'Anclaje',        1.00, 1.12),
    (4, 'Enfriamiento',   9.50, 9.40),
    (5, 'Apertura',       1.70, 1.70),
    (6, 'Eyección',       0.75, 0.70),
    (7, 'Plastificación', 1.85, 1.83)
ON CONFLICT (orden) DO NOTHING;

-- ── injection · Husillo · configuración inicial (fila única) ──────────────────
INSERT INTO injection.hus_husillo_config (id, control_encendido, velocidad_husillo, torque_husillo)
VALUES (1, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- ── clamp · Vista General · configuración inicial del molde (fila única) ──────
INSERT INTO clamp.vgn_molde_config (id, control_encendido, torque, cambio_posicion, posicion1, posicion2, velocidad_posicion)
VALUES (1, 0, 0, 0, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- ── injection · Carro de Inyección · configuración inicial (fila única) ───────
INSERT INTO injection.car_carro_config (id, control_encendido, torque, cambio_posicion, posicion1, posicion2, velocidad_posicion)
VALUES (1, 0, 0, 0, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- ── ejection · Eyector · configuración inicial (fila única) ───────────────────
INSERT INTO ejection.eyc_eyector_config (id, control_encendido, torque, cambio_posicion, posicion1, posicion2, velocidad_posicion)
VALUES (1, 0, 0, 0, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- ── heating · Zonas del Cilindro ──────────────────────────────────────────────
INSERT INTO heating.zon_zona_calefaccion (codigo, nombre, setpoint, tolerancia_sup, tolerancia_inf) VALUES
    ('zona_1', 'Zona 1 - Alim.',    210, 5, 5),
    ('zona_2', 'Zona 2 - Trans. 1', 225, 5, 5),
    ('zona_3', 'Zona 3 - Trans. 2', 240, 5, 5),
    ('zona_4', 'Zona 4 - Dosif.',   240, 5, 5),
    ('zona_5', 'Zona 5 - Salida',   235, 5, 5)
ON CONFLICT (codigo) DO NOTHING;

-- ── heating · ON-OFF · una lectura inicial por zona (PV / salida SSR) ─────────
INSERT INTO heating.zon_zona_lectura (zona_id, temperatura_pv, salida_ssr)
SELECT z.id, v.pv, v.ssr
FROM heating.zon_zona_calefaccion z
JOIN (VALUES
    ('zona_1', 208.5, 45.0),
    ('zona_2', 225.8, 30.0),
    ('zona_3', 239.2, 55.0),
    ('zona_4', 241.5, 20.0),
    ('zona_5', 234.0, 60.0)
) AS v(codigo, pv, ssr) ON v.codigo = z.codigo;

-- ── recipes · Gestión de Recetas · perfil por defecto + etapas ────────────────
INSERT INTO recipes.rec_perfil (nombre, descripcion, activo) VALUES
    ('Perfil por defecto', 'Receta base cargada desde el frontend', TRUE)
ON CONFLICT (nombre) DO NOTHING;

-- injection · Perfil de Inyección · etapas
INSERT INTO injection.iny_etapa_inyeccion (perfil_id, orden, punto_inicio, velocidad) VALUES
    ((SELECT id FROM recipes.rec_perfil WHERE nombre='Perfil por defecto'), 1, 180.00, 120.0),
    ((SELECT id FROM recipes.rec_perfil WHERE nombre='Perfil por defecto'), 2, 145.50, 95.0),
    ((SELECT id FROM recipes.rec_perfil WHERE nombre='Perfil por defecto'), 3, 90.25,  150.0),
    ((SELECT id FROM recipes.rec_perfil WHERE nombre='Perfil por defecto'), 4, 40.00,  65.0),
    ((SELECT id FROM recipes.rec_perfil WHERE nombre='Perfil por defecto'), 5, 15.00,  20.0)
ON CONFLICT (perfil_id, orden) DO UPDATE SET
    punto_inicio = EXCLUDED.punto_inicio,
    velocidad    = EXCLUDED.velocidad;

-- injection · Husillo · etapas de sostenimiento
INSERT INTO injection.hus_etapa_sostenimiento (perfil_id, orden, presion, tiempo, velocidad, posicion) VALUES
    ((SELECT id FROM recipes.rec_perfil WHERE nombre='Perfil por defecto'), 1, 750, 1.50, 15.0, 20.0),
    ((SELECT id FROM recipes.rec_perfil WHERE nombre='Perfil por defecto'), 2, 620, 2.00, 12.0, 18.0),
    ((SELECT id FROM recipes.rec_perfil WHERE nombre='Perfil por defecto'), 3, 500, 3.00, 8.0,  15.0),
    ((SELECT id FROM recipes.rec_perfil WHERE nombre='Perfil por defecto'), 4, 450, 1.50, 5.0,  10.0)
ON CONFLICT (perfil_id, orden) DO UPDATE SET
    presion   = EXCLUDED.presion,
    tiempo    = EXCLUDED.tiempo,
    velocidad = EXCLUDED.velocidad,
    posicion  = EXCLUDED.posicion;

-- clamp · Perfil de Cierre · etapas
INSERT INTO clamp.cie_etapa_cierre (perfil_id, orden, etiqueta, inicio, velocidad, torque_max) VALUES
    ((SELECT id FROM recipes.rec_perfil WHERE nombre='Perfil por defecto'), 1, 'Fase 1',                 1150.0, 350, 80),
    ((SELECT id FROM recipes.rec_perfil WHERE nombre='Perfil por defecto'), 2, 'Fase 2',                 450.0,  200, 70),
    ((SELECT id FROM recipes.rec_perfil WHERE nombre='Perfil por defecto'), 3, 'Inicio Protección Molde',120.5,  45,  15)
ON CONFLICT (perfil_id, orden) DO UPDATE SET
    etiqueta   = EXCLUDED.etiqueta,
    inicio     = EXCLUDED.inicio,
    velocidad  = EXCLUDED.velocidad,
    torque_max = EXCLUDED.torque_max;

-- clamp · Perfil de Apertura · etapas
INSERT INTO clamp.ape_etapa_apertura (perfil_id, orden, etiqueta, posicion, velocidad, aceleracion) VALUES
    ((SELECT id FROM recipes.rec_perfil WHERE nombre='Perfil por defecto'), 1, 'Fase 1',         450.0, 850.0, 1200),
    ((SELECT id FROM recipes.rec_perfil WHERE nombre='Perfil por defecto'), 2, 'Fase 2',         680.0, 100.0, 600),
    ((SELECT id FROM recipes.rec_perfil WHERE nombre='Perfil por defecto'), 3, 'Posición Final', 750.0, 20.0,  300)
ON CONFLICT (perfil_id, orden) DO UPDATE SET
    etiqueta    = EXCLUDED.etiqueta,
    posicion    = EXCLUDED.posicion,
    velocidad   = EXCLUDED.velocidad,
    aceleracion = EXCLUDED.aceleracion;

-- ejection · Perfil de Eyección · etapas
INSERT INTO ejection.pey_etapa_eyeccion (perfil_id, orden, etiqueta, posicion, velocidad) VALUES
    ((SELECT id FROM recipes.rec_perfil WHERE nombre='Perfil por defecto'), 1, 'Despegue',  25.0,  40.0),
    ((SELECT id FROM recipes.rec_perfil WHERE nombre='Perfil por defecto'), 2, 'Expulsión', 120.0, 180.0),
    ((SELECT id FROM recipes.rec_perfil WHERE nombre='Perfil por defecto'), 3, 'Final',     150.0, 20.0)
ON CONFLICT (perfil_id, orden) DO UPDATE SET
    etiqueta  = EXCLUDED.etiqueta,
    posicion  = EXCLUDED.posicion,
    velocidad = EXCLUDED.velocidad;
