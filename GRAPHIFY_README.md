# 🚀 Graphify - Inicio Rápido

## Instalación (una sola vez)

```bash
# 1. Instalar graphify
uv tool install graphifyy

# 2. Actualizar PATH
uv tool update-shell

# 3. Abrir nueva terminal y verificar
graphify --version

# 4. Registrar con tu asistente
graphify install
```

## Uso diario

### Generar grafo

```bash
# Frontend
cd frontend
graphify extract . --code-only

# Backend
cd spx5-opcua-bridge
graphify extract . --code-only
```

### Consultar

```bash
# Pregunta general
graphify query "¿cómo se conecta el frontend con la base de datos?"

# Camino entre dos conceptos
graphify path "CarriageGeneralPage" "insertCarroLectura"

# Explicar un concepto
graphify explain "lecturaWatcher"
```

### Actualizar después de cambios

```bash
graphify extract . --update
```

### Ver el grafo

Abre en tu navegador: `graphify-out/graph.html`

---

## Archivos generados

```
graphify-out/
├── graph.html         # ✅ COMMITEAR - Visualización interactiva
├── graph.json         # ✅ COMMITEAR - Grafo completo
├── GRAPH_REPORT.md    # ✅ COMMITEAR - Resumen del proyecto
├── cost.json          # ❌ NO COMMITEAR - Costos de API
└── cache/             # ❌ NO COMMITEAR - Caché local
```

---

## Comandos útiles

```bash
# Auto-actualizar en commits
graphify hook install

# Exportar diagrama
graphify export callflow-html

# Generar wiki
graphify extract . --wiki

# SVG para LaTeX
graphify extract . --svg
```

---

Ver guía completa en: **[GRAPHIFY_GUIA.md](./GRAPHIFY_GUIA.md)**
