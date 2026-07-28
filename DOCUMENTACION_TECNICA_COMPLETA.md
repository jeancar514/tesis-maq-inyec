# 📘 Documentación Técnica Completa - Sistema HMI para Máquina de Inyección SPX5

**Proyecto de Tesis - Sistema de Monitoreo y Control Industrial**

**Autor**: Jean Carlos  
**Fecha**: Enero 2026  
**Versión**: 1.0.0

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura General del Sistema](#2-arquitectura-general-del-sistema)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Módulo Frontend (React + TypeScript)](#4-módulo-frontend-react--typescript)
5. [Módulo Backend (Node.js Bridge)](#5-módulo-backend-nodejs-bridge)
6. [Base de Datos (PostgreSQL)](#6-base-de-datos-postgresql)
7. [Protocolos Industriales](#7-protocolos-industriales)
8. [Funcionalidades por Módulo](#8-funcionalidades-por-módulo)
9. [Descripción Detallada de Pantallas](#9-descripción-detallada-de-pantallas)
10. [Flujos de Datos](#10-flujos-de-datos)
11. [Patrones de Diseño](#11-patrones-de-diseño)
12. [Configuración y Despliegue](#12-configuración-y-despliegue)
13. [Casos de Uso Principales](#13-casos-de-uso-principales)
14. [Mantenimiento y Extensibilidad](#14-mantenimiento-y-extensibilidad)

---

## 1. Resumen Ejecutivo

### 1.1 Visión General

El proyecto consiste en un **Sistema HMI (Human-Machine Interface) completo** para el monitoreo y control de una máquina de inyección de plástico modelo **SPX5**. El sistema actúa como intermediario entre el PLC de la máquina (comunicación Modbus TCP) y los operadores humanos (interfaz web moderna).

### 1.2 Objetivos Principales

- ✅ **Visualización en tiempo real** de variables del proceso de inyección
- ✅ **Control remoto** de parámetros de la máquina vía interfaz web
- ✅ **Persistencia de datos** en PostgreSQL para análisis histórico
- ✅ **Monitoreo de KPIs** (producción, calidad, tiempos de ciclo)
- ✅ **Gestión de perfiles** (recetas de producción)
- ✅ **Arquitectura desacoplada** con protocolos estándar industriales

### 1.3 Alcance Funcional

El sistema cubre **6 módulos principales**:

1. **Dashboard** - Vista general, KPIs, estado del ciclo
2. **Molde (Clamp)** - Control de cierre/apertura del molde
3. **Inyección** - Carro de inyección, husillo, perfiles
4. **Eyección** - Extracción de piezas
5. **Temperaturas** - Control de zonas de calentamiento
6. **Mantenimiento** - Monitor I/O, configuración Modbus


---

## 2. Arquitectura General del Sistema

### 2.1 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                      CAPA DE PRESENTACIÓN                       │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React 19 + TypeScript + Vite + TailwindCSS             │  │
│  │  - Componentes reutilizables                             │  │
│  │  - Arquitectura hexagonal (Domain/Infrastructure/UI)    │  │
│  │  - Routing con React Router DOM v6                       │  │
│  │  - Comunicación HTTP + WebSocket                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ▼                                  │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP REST API
                               │ WebSocket (WS)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CAPA DE BRIDGE/GATEWAY                      │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  SPX5 OPC UA Bridge (Node.js + Express)                  │  │
│  │  - API REST (port 3000)                                   │  │
│  │  - Servidor WebSocket para datos en tiempo real          │  │
│  │  - Servidor OPC UA (port 4840)                           │  │
│  │  - Cliente Modbus TCP                                     │  │
│  │  - Polling inteligente (1s intervals)                    │  │
│  │  - Caché en memoria + persistencia PostgreSQL            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ▼                                  │
└──────────────────────────────┬──────────────────────────────────┘
                               │ Modbus TCP
                               │ (PLC SPX5)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CAPA DE DISPOSITIVO                         │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PLC - Máquina de Inyección SPX5                         │  │
│  │  - Modbus TCP Server (192.168.1.100:502)                │  │
│  │  - ~200 registros (Holding/Input/Coils/Discrete)        │  │
│  │  - Control en tiempo real del proceso                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CAPA DE PERSISTENCIA                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PostgreSQL 16 (Docker)                                   │  │
│  │  - 7 schemas (dashboard, clamp, injection, ejection,     │  │
│  │    heating, recipes, maintenance)                         │  │
│  │  - 40+ tablas normalizadas                               │  │
│  │  - Históricos de lecturas                                 │  │
│  │  - Perfiles de producción                                 │  │
│  │  - Catálogos de referencia                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Flujo de Datos

#### 2.2.1 Lectura de Datos (Monitoreo)

```
PLC SPX5 → Modbus TCP → Bridge (Polling 1s) → Caché RAM → 
→ PostgreSQL (Persistencia) → API REST → Frontend (Visualización)
```

#### 2.2.2 Escritura de Datos (Control)

```
Frontend (UI) → API REST → Bridge → Validación → Modbus TCP → 
→ PLC SPX5 → Actualización física → Polling → Confirmación visual
```

#### 2.2.3 Datos en Tiempo Real (WebSocket)

```
Bridge (Detección cambio) → WebSocket Server → Frontend (Socket Client) → 
→ Actualización UI inmediata (sin polling)
```


---

## 3. Stack Tecnológico

### 3.1 Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **React** | 19.0.0 | Framework UI principal |
| **TypeScript** | 5.2.2 | Tipado estático, reducción de bugs |
| **Vite** | 5.2.0 | Build tool ultra-rápido (HMR) |
| **React Router DOM** | 6.22.3 | Navegación SPA |
| **TailwindCSS** | 3.4.3 | Utility-first CSS framework |
| **Lucide React** | 1.8.0 | Iconos modernos |
| **Playwright** | 1.48.0 | Testing E2E |

**Decisiones de diseño:**
- ✅ React 19 para aprovechar Server Components (preparado para futuro SSR)
- ✅ TypeScript para robustez en aplicación industrial (evitar errores en producción)
- ✅ Vite por velocidad de desarrollo (HMR <50ms)
- ✅ TailwindCSS para consistencia visual sin CSS custom
- ✅ Arquitectura hexagonal para facilitar testing y cambios de backend

### 3.2 Backend (Bridge)

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Node.js** | >=18.0.0 | Runtime JavaScript |
| **Express** | 5.2.1 | Framework API REST |
| **modbus-serial** | 8.0.23 | Cliente Modbus TCP/RTU |
| **node-opcua** | 2.163.1 | Servidor OPC UA |
| **ws** | 8.19.0 | WebSocket server |
| **pg** | 8.20.0 | Driver PostgreSQL |
| **winston** | 3.19.0 | Logging estructurado |
| **dotenv** | 17.3.1 | Gestión de variables de entorno |

**Decisiones de diseño:**
- ✅ Node.js por ecosistema rico en librerías industriales (OPC UA, Modbus)
- ✅ Express 5 para API moderna con async/await nativo
- ✅ modbus-serial con soporte TCP y manejo de reconexiones automáticas
- ✅ node-opcua para interoperabilidad con SCADA empresariales
- ✅ Winston para logs estructurados (JSON) en producción

### 3.3 Base de Datos

| Componente | Detalle |
|------------|---------|
| **Motor** | PostgreSQL 16 |
| **Despliegue** | Docker Compose |
| **Schemas** | 7 (separación lógica por módulo) |
| **Tablas** | 40+ (normalizadas 3NF) |
| **Índices** | 15+ (en columnas de timestamp para queries rápidas) |
| **Volumen** | Docker volume persistente |

**Decisiones de diseño:**
- ✅ PostgreSQL por robustez, JSONB support, y excelente rendimiento
- ✅ Docker para portabilidad (desarrollo === producción)
- ✅ Schemas separados para aislar dominios de negocio
- ✅ TimescaleDB no usado (yet) pero arquitectura preparada para time-series

### 3.4 Comunicación Industrial

| Protocolo | Rol | Puerto |
|-----------|-----|--------|
| **Modbus TCP** | Cliente → SPX5 PLC | 502 |
| **OPC UA** | Servidor ← SCADA/HMI | 4840 |
| **HTTP REST** | API ← Frontend | 3000 |
| **WebSocket** | Notificaciones tiempo real | 3000 |
| **MQTT** | (Opcional, preparado) | 1883 |


---

## 4. Módulo Frontend (React + TypeScript)

### 4.1 Estructura de Carpetas (Arquitectura Hexagonal)

```
frontend/src/
├── domain/                          # CAPA DE DOMINIO (Reglas de negocio)
│   ├── models/                      # Interfaces TypeScript (DTOs)
│   │   ├── kpi.model.ts             # KPIs de producción
│   │   ├── servo.model.ts           # Datos servomotor
│   │   ├── mold-control.model.ts    # Control molde
│   │   ├── carriage-control.model.ts # Control carro inyección
│   │   ├── ejector-control.model.ts  # Control eyector
│   │   ├── screw-control.model.ts    # Control husillo
│   │   └── ... (15 modelos total)
│   │
│   ├── gateway/                     # Interfaces de puertos (abstracciones)
│   │   ├── kpi.gateway.ts
│   │   ├── servo.gateway.ts
│   │   └── ... (8 gateways)
│   │
│   └── usecase/                     # Casos de uso de negocio
│       ├── get-kpis.usecase.ts
│       ├── send-cycle-command.usecase.ts
│       └── ... (12 use cases)
│
├── infrastructure/                  # CAPA DE INFRAESTRUCTURA (Adaptadores)
│   ├── repository/                  # Implementaciones de gateways
│   │   ├── kpi.repository.ts        # HTTP calls reales
│   │   ├── servo.repository.ts
│   │   └── ... (18 repositories)
│   │
│   └── helpers/                     # Utilidades técnicas
│       ├── http-service.ts          # Cliente HTTP centralizado
│       ├── websocket-service.ts     # Cliente WS base
│       ├── servo-websocket.service.ts
│       └── ... (7 servicios)
│
├── presentation/                    # CAPA DE PRESENTACIÓN (UI)
│   ├── features/                    # Módulos funcionales
│   │   ├── dashboard/               # Módulo Dashboard
│   │   │   ├── pages/
│   │   │   │   ├── DashboardPage.tsx
│   │   │   │   ├── StepCyclePage.tsx
│   │   │   │   └── TimeMonitorPage.tsx
│   │   │   └── components/
│   │   │       ├── KPICard.tsx
│   │   │       ├── MachineStatus.tsx
│   │   │       └── ... (10+ componentes)
│   │   │
│   │   ├── clamp/                   # Módulo Molde
│   │   │   ├── pages/
│   │   │   │   ├── MoldGeneralPage.tsx
│   │   │   │   ├── ClampPage.tsx (cierre)
│   │   │   │   └── OpeningProfilePage.tsx
│   │   │   └── components/
│   │   │       ├── MoldCanvas.tsx
│   │   │       ├── MoldControlPanel.tsx
│   │   │       └── ... (8 componentes)
│   │   │
│   │   ├── injection/               # Módulo Inyección
│   │   │   ├── pages/
│   │   │   │   ├── GeneralPage.tsx
│   │   │   │   ├── CarriageGeneralPage.tsx
│   │   │   │   ├── InjectionProfilePage.tsx
│   │   │   │   ├── HoldingPage.tsx
│   │   │   │   └── InjectionGraphsPage.tsx
│   │   │   └── components/
│   │   │       ├── CarriageCanvas.tsx
│   │   │       ├── CarriageControlPanel.tsx
│   │   │       └── ... (15+ componentes)
│   │   │
│   │   ├── ejection/                # Módulo Eyección
│   │   ├── heating/                 # Módulo Temperaturas
│   │   └── maintenance/             # Módulo Mantenimiento
│   │
│   └── shared/                      # Componentes compartidos
│       └── components/
│           ├── MainLayout.tsx       # Layout principal + sidebar
│           ├── FooterNav.tsx        # Navegación inferior
│           ├── Sidebar.tsx          # Menú lateral
│           ├── ServoVariableGrid.tsx # Grid variables servo
│           └── ... (12 componentes shared)
│
├── environments/                    # Configuración por entorno
│   └── environment.ts               # Variables de entorno
│
├── App.tsx                          # Router principal
├── main.tsx                         # Entry point
└── index.css                        # Estilos globales + Tailwind
```

### 4.2 Patrones Implementados

#### 4.2.1 Arquitectura Hexagonal (Ports & Adapters)

**Capas:**
1. **Domain** (núcleo): Modelos + interfaces (sin dependencias externas)
2. **Infrastructure**: Implementaciones concretas (HTTP, WebSocket, localStorage)
3. **Presentation**: Componentes React (dependen de domain, no de infrastructure directamente)

**Ventajas:**
- ✅ Testeable: Puedo mockear repositories sin tocar UI
- ✅ Flexible: Cambiar de HTTP a GraphQL solo requiere nueva implementación de repository
- ✅ Mantenible: Separación clara de responsabilidades


#### 4.2.2 Repository Pattern

**Ejemplo: `KpiRepository`**

```typescript
// domain/gateway/kpi.gateway.ts (Interfaz/Puerto)
export interface KpiGateway {
    getKpis(): Promise<KpiData>;
}

// infrastructure/repository/kpi.repository.ts (Adaptador HTTP)
export class KpiRepository implements KpiGateway {
    async getKpis(): Promise<KpiData> {
        return httpService.get<KpiData>(`${environment.apiUrl}/api/kpis`);
    }
}

// presentation/features/dashboard/pages/DashboardPage.tsx (Consumo)
const kpiRepo = new KpiRepository();
const [kpis, setKpis] = useState<KpiData | null>(null);

useEffect(() => {
    kpiRepo.getKpis().then(setKpis);
}, []);
```

**Ventajas:**
- Sin lógica HTTP en componentes React
- Testeable: puedo crear `MockKpiRepository` para tests
- Reutilizable: mismo repository para múltiples componentes

#### 4.2.3 Observer Pattern (WebSocket)

**Ejemplo: Datos de servomotor en tiempo real**

```typescript
// infrastructure/helpers/servo-websocket.service.ts
export class ServoWebSocketService {
    private ws: WebSocket | null = null;
    private listeners: ((data: ServoData) => void)[] = [];

    connect() {
        this.ws = new WebSocket('ws://localhost:3000/ws/servo');
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.listeners.forEach(cb => cb(data));
        };
    }

    subscribe(callback: (data: ServoData) => void) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }
}

// Componente React
useEffect(() => {
    const unsubscribe = servoWs.subscribe((data) => {
        setServoData(data);  // Actualización automática UI
    });
    return unsubscribe;
}, []);
```

### 4.3 Gestión de Estado

**Estrategia:** Estado local + Polling HTTP (no Redux/Zustand)

**Justificación:**
- ✅ Datos industriales son **flujos continuos**, no necesitan caché global compleja
- ✅ Cada pantalla es **independiente** (operadores ven una a la vez)
- ✅ Simplicidad: `useState` + `useEffect` es suficiente
- ✅ WebSocket para tiempo real, HTTP para históricos

**Patrón típico:**

```typescript
const [data, setData] = useState<T | null>(null);

useEffect(() => {
    const fetch = () => repo.get().then(setData);
    fetch();
    const id = setInterval(fetch, 1500); // Polling cada 1.5s
    return () => clearInterval(id);
}, []);
```

### 4.4 Componentes Clave

#### 4.4.1 MainLayout (Layout Maestro)

```typescript
<MainLayout>
  <Sidebar />           {/* Menú izquierdo */}
  <main>
    <Outlet />          {/* Contenido dinámico (páginas) */}
  </main>
  <FooterNav />         {/* Navegación inferior (módulos principales) */}
</MainLayout>
```

**Responsabilidades:**
- Layout responsive (sidebar colapsable en móvil)
- Navegación persistente
- Indicadores globales (conexión, modo operación)

#### 4.4.2 ServoVariableGrid (Reutilizable)

Grid 5×2 de variables del servomotor (velocidad, torque, posición, corriente, voltaje). Usado en:
- Dashboard → Vista general servo inyección
- Clamp → Vista general servo molde
- Injection → General page

**Props:**
- `servoGateway: ServoGateway` (inyección de dependencia)
- Polling interno 1.5s
- Actualización automática en tiempo real


---

## 5. Módulo Backend (Node.js Bridge)

### 5.1 Arquitectura del Bridge

```
spx5-opcua-bridge/src/
├── index.js                     # Entry point
├── bridge/
│   └── protocolBridge.js        # Orquestador principal
│
├── modbus/
│   └── modbusClient.js          # Cliente Modbus TCP
│
├── opcua/
│   └── opcuaServer.js           # Servidor OPC UA
│
├── api/
│   ├── apiServer.js             # Express server
│   ├── constant.js              # Constantes (rutas, tipos)
│   ├── realtimeBus.js           # Event emitter para WebSocket
│   ├── swagger.js               # Documentación OpenAPI
│   └── modules/
│       ├── _shared.js           # Helpers compartidos
│       ├── dashboard.routes.js  # Rutas /api/kpis, /api/operation-mode, etc.
│       ├── clamp.routes.js      # Rutas /api/mold-control, /api/clamp/*
│       ├── injection.routes.js  # Rutas /api/servo, /api/carriage-control, etc.
│       ├── ejection.routes.js   # Rutas /api/ejector-control, /api/ejection/*
│       ├── heating.routes.js    # Rutas /api/heating/*
│       └── config.routes.js     # Rutas /api/registers, /api/config/*
│
├── db/
│   ├── dbClient.js              # Cliente PostgreSQL + queries
│   └── lecturaWatcher.js        # Observador de cambios → persist a DB
│
├── mqtt/
│   └── mqttClient.js            # Cliente MQTT (opcional)
│
└── utils/
    ├── logger.js                # Winston logger
    └── registerManager.js       # Gestión de registros Modbus
```

### 5.2 Componentes Clave

#### 5.2.1 ProtocolBridge (Orquestador)

**Responsabilidades:**
1. Inicializar base de datos (ejecutar `01_schema.sql`, `02_seed.sql`)
2. Conectar cliente Modbus a SPX5 PLC
3. Iniciar servidor OPC UA (puerto 4840)
4. Iniciar servidor Express API (puerto 3000)
5. Configurar polling automático (1s) de registros Modbus
6. Manejar reconexiones automáticas
7. Graceful shutdown (SIGINT/SIGTERM)

**Flujo de inicialización:**

```javascript
async start() {
    // 1. DB primero (independiente de Modbus)
    await initSchema();
    startWatching(); // Activa lecturaWatcher

    // 2. Inicializar servidores
    await opcuaServer.initialize();
    
    // 3. Modbus (no crítico, puede fallar)
    try {
        await modbusClient.connect();
    } catch (err) {
        logger.warn(`Modbus no disponible: ${err.message}`);
    }

    // 4. Arrancar servidores
    await opcuaServer.start();
    await apiServer.start();

    // 5. Polling
    this._startPolling();
    
    // 6. Handlers
    this._setupEventHandlers();
}
```

**Ventajas del diseño:**
- ✅ DB siempre funciona (independiente de Modbus)
- ✅ API arranca aunque SPX5 esté offline
- ✅ Reconexión automática Modbus sin reiniciar bridge

#### 5.2.2 ModbusClient

**Funcionalidades:**
- Conexión TCP con retry automático (5 intentos, 3s intervalo)
- Lectura de 4 tipos de registros:
  - `holdingRegister` (R/W) - 16 bits
  - `inputRegister` (R) - 16 bits
  - `coil` (R/W) - booleano
  - `discreteInput` (R) - booleano
- Escritura con validación de rango
- Soporte 32-bit (combina 2 registros de 16-bit)
- Manejo de errores con logging detallado
- Event emitter: `connected`, `disconnected`, `error`, `maxRetriesReached`

**Ejemplo de configuración de registro (registerManager.js):**

```javascript
{
  name: 'carriageVelocidad',
  type: 'carriage_control',
  modbusType: 'inputRegister',
  modbusAddress: 158,
  opcuaDataType: 'Double',
  scaleFactor: 1,
  unit: 'mm/s',
  readable: true,
  writable: false,
  description: 'Velocidad del carro de inyección'
}
```


#### 5.2.3 API REST (Express)

**Estructura de rutas:**

```
/api
├── /kpis                          # GET - KPIs de producción
├── /operation-mode                # GET, POST - Modo operación (manual/auto)
├── /cycle-command                 # GET, POST - Comandos ciclo (start/stop)
├── /dashboard/step-cycle          # GET, POST - Fases del ciclo
├── /dashboard/phase-timing        # GET, POST - Tiempos por fase
│
├── /servo                         # GET - Datos servomotor inyección
├── /screw-control                 # GET, POST - Control husillo
├── /carriage-control              # GET, POST - Control carro inyección
│   └── /move                      # POST - Mover carro a posición
│   └── /lectura                   # GET - Última lectura tiempo real
├── /injection/injection-profile   # GET, POST - Perfil inyección (etapas)
├── /injection/holding-profile     # GET, POST - Perfil sostenimiento
│
├── /mold-control                  # GET, POST - Control molde
│   └── /move                      # POST - Mover molde a posición
│   └── /servo                     # GET - Servomotor molde
├── /clamp/closing-profile         # GET, POST - Perfil cierre molde
├── /clamp/opening-profile         # GET, POST - Perfil apertura molde
│
├── /ejector-control               # GET, POST - Control eyector
│   └── /move                      # POST - Mover eyector a posición
│   └── /lectura                   # GET - Última lectura tiempo real
├── /ejection/ejection-profile     # GET, POST - Perfil eyección
│
├── /heating/zones                 # GET, POST - Zonas de calentamiento
├── /heating/diagnostic            # GET - Diagnóstico PID
│
├── /registers                     # GET, POST, PATCH - Config Modbus
│   └── /:name                     # GET, PATCH - Registro individual
├── /config/data-source            # GET - Origen de datos (db/modbus)
└── /catalogos                     # GET - Catálogos maestros
```

**Patrón de respuesta estándar:**

```javascript
// GET exitoso
{
    carriageVelocidad: 85.2,
    carriagePosicion: 145.7,
    carriageTorqueSecundario: 42.5,
    _source: 'db'  // o 'modbus'
}

// POST exitoso
{
    carriageTorque: { success: true, value: 50 },
    carriageVelocidadPosicion: { success: true, value: 120 }
}

// Error
{
    error: 'Registro no encontrado',
    statusCode: 404
}
```

#### 5.2.4 Servidor OPC UA

**Namespace:** `ns=1` (custom namespace SPX5)

**Estructura de nodos:**

```
RootFolder/
└── Objects/
    └── SPX5/
        ├── Dashboard/
        │   ├── cycleTime          (Double, R)
        │   ├── productionCount    (Double, R)
        │   ├── operationMode      (Int32, R/W)
        │   └── cycleCommand       (Boolean, R/W)
        │
        ├── Servo/
        │   ├── speed              (Double, R)
        │   ├── torque             (Double, R)
        │   ├── position           (Double, R)
        │   ├── current            (Double, R)
        │   └── voltage            (Double, R)
        │
        ├── Carriage/
        │   ├── velocity           (Double, R)
        │   ├── position           (Double, R)
        │   ├── torqueSecondary    (Double, R)
        │   ├── controlOn          (Int32, R/W)
        │   └── torque             (Double, R/W)
        │
        ├── Mold/
        ├── Ejector/
        └── Heating/
```

**Sincronización bidireccional:**
- Modbus → OPC UA: Polling 1s actualiza nodos OPC UA
- OPC UA → Modbus: Escritura en nodo OPC UA dispara escritura Modbus
- Marcado especial: Nodos escritos desde OPC UA se marcan para evitar loops


#### 5.2.5 LecturaWatcher (Persistencia Inteligente)

**Propósito:** Guardar snapshots de datos en PostgreSQL sin sobrecargar la DB.

**Estrategia:**
- **Debounce de 300ms**: Agrupa cambios simultáneos del polling
- **Trigger automático**: Cuando `opcuaServer` detecta cambio en caché → `saveOnChange()`
- **Escritura batch**: Una transacción para todos los datos relacionados

**Flujo:**

```javascript
// Polling detecta cambio → actualiza caché OPC UA
opcuaServer.updateCachedValue('carriageVelocidad', 92.0, true);

// OPC UA dispara evento
emit('valueChanged', { name: 'carriageVelocidad', value: 92.0 });

// LecturaWatcher captura
opcuaServer.on('valueChanged', () => {
    lecturaWatcher.saveOnChange(); // Debounce 300ms
});

// Después de 300ms de silencio → guarda snapshot completo
async function saveSnapshot() {
    const v = snapshotValues(); // Lee toda la caché
    
    // Setpoints (tablas de config)
    await upsertCarroConfig({ ... });
    await upsertMoldeConfig({ ... });
    
    // Lecturas (tablas de histórico)
    await insertCarroLectura({ velocidad, posicion, torqueSecundario });
    await insertServoLectura({ velocidad, torque, posicion, corriente, voltaje });
    await insertKpiLectura({ tiempoCiclo, conteoProduccion, ... });
}
```

**Ventajas:**
- ✅ Reduce carga DB (1 escritura cada 300ms vs. 1000 escrituras/s)
- ✅ Consistencia: Snapshot atómico de todo el sistema
- ✅ Recuperación: Si bridge cae, última DB refleja estado coherente


---

## 6. Base de Datos (PostgreSQL)

### 6.1 Esquema Completo

```sql
-- 7 schemas lógicos (separación por módulo)
CREATE SCHEMA dashboard;
CREATE SCHEMA clamp;
CREATE SCHEMA injection;
CREATE SCHEMA ejection;
CREATE SCHEMA heating;
CREATE SCHEMA recipes;
```

### 6.2 Tablas Principales

#### 6.2.1 Dashboard (4 tablas)

| Tabla | Propósito | Filas típicas |
|-------|-----------|---------------|
| `vgn_modo_operacion` | Modo manual/auto (fila única id=1) | 1 |
| `vgn_comando_ciclo` | Start/stop (fila única id=1) | 1 |
| `vgn_kpi_lectura` | Histórico KPIs (tiempo ciclo, producción, etc.) | ∞ |
| `cip_fase` | 12 fases del ciclo con estado | 12 |
| `mdt_fase_tiempo` | Tiempos programado vs real por fase | 7 |

**Detalle `vgn_kpi_lectura`:**

```sql
CREATE TABLE dashboard.vgn_kpi_lectura (
    id                  BIGSERIAL PRIMARY KEY,
    tiempo_ciclo        DOUBLE PRECISION,     -- segundos
    conteo_produccion   DOUBLE PRECISION,     -- piezas
    objetivo_produccion DOUBLE PRECISION,     -- piezas
    rendimiento_calidad DOUBLE PRECISION,     -- %
    capturado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dashboard_vgn_kpi_fecha 
    ON dashboard.vgn_kpi_lectura(capturado_en DESC);
```

**Uso:** Frontend consulta últimos 100 registros para gráficas de tendencia.

#### 6.2.2 Clamp (4 tablas)

| Tabla | Propósito | Filas típicas |
|-------|-----------|---------------|
| `vgn_molde_config` | Setpoints molde (fila única id=1) | 1 |
| `vgn_servomotor_lectura` | Histórico servo molde | ∞ |
| `cie_etapa_cierre` | Etapas perfil cierre (por receta) | 3 |
| `ape_etapa_apertura` | Etapas perfil apertura (por receta) | 3 |

**Detalle `vgn_molde_config`:**

```sql
CREATE TABLE clamp.vgn_molde_config (
    id                  SMALLINT PRIMARY KEY DEFAULT 1,
    control_encendido   INTEGER NOT NULL DEFAULT 0,      -- Modbus 40
    torque              DOUBLE PRECISION NOT NULL DEFAULT 0, -- Modbus 41, %
    cambio_posicion     DOUBLE PRECISION NOT NULL DEFAULT 0, -- Modbus 42, mm
    posicion1           DOUBLE PRECISION NOT NULL DEFAULT 0, -- Modbus 43, mm
    posicion2           DOUBLE PRECISION NOT NULL DEFAULT 0, -- Modbus 44, mm
    velocidad_posicion  DOUBLE PRECISION NOT NULL DEFAULT 0, -- Modbus 45, mm/s
    actualizado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Patrón:** Tabla de **1 sola fila** (singleton) para config actual. Frontend hace UPSERT (INSERT ... ON CONFLICT UPDATE).

#### 6.2.3 Injection (6 tablas)

| Tabla | Propósito | Filas típicas |
|-------|-----------|---------------|
| `gen_servomotor_lectura` | Histórico servo inyección | ∞ |
| `hus_husillo_config` | Setpoints husillo (fila única) | 1 |
| `car_carro_config` | Setpoints carro inyección (fila única) | 1 |
| `car_carro_lectura` | **Histórico lecturas carro** (velocidad, posición, torque) | ∞ |
| `iny_etapa_inyeccion` | Etapas perfil inyección | 5 |
| `hus_etapa_sostenimiento` | Etapas perfil sostenimiento | 4 |

**Nueva tabla `car_carro_lectura`** (agregada recientemente):

```sql
CREATE TABLE injection.car_carro_lectura (
    id                  BIGSERIAL PRIMARY KEY,
    velocidad           DOUBLE PRECISION,   -- mm/s, Modbus 158
    posicion            DOUBLE PRECISION,   -- mm, Modbus 178
    torque_secundario   DOUBLE PRECISION,   -- %, Modbus 168
    capturado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_injection_car_lectura_fecha 
    ON injection.car_carro_lectura(capturado_en DESC);
```

**Propósito:** Separar **setpoints** (escritura) de **lecturas** (solo lectura). Frontend hace GET combinado:

```javascript
// Backend combina ambas tablas en modo 'db'
GET /api/carriage-control
→ {
    // Setpoints (car_carro_config)
    carriageControlEncendido: 0,
    carriageTorque: 50,
    carriagePosicion1: 0,
    carriagePosicion2: 100,
    
    // Lecturas en tiempo real (car_carro_lectura)
    carriageVelocidad: 85.2,
    carriagePosicion: 145.7,
    carriageTorqueSecundario: 42.5,
    
    _source: 'db'
}
```


#### 6.2.4 Ejection (3 tablas)

| Tabla | Propósito | Filas típicas |
|-------|-----------|---------------|
| `eyc_eyector_config` | Setpoints eyector (fila única) | 1 |
| `eyc_eyector_lectura` | **Histórico lecturas eyector** (velocidad, posición, torque) | ∞ |
| `pey_etapa_eyeccion` | Etapas perfil eyección | 3 |

**Similar a injection**, se agregó tabla de lecturas separada.

#### 6.2.5 Heating (2 tablas)

| Tabla | Propósito | Filas típicas |
|-------|-----------|---------------|
| `zon_zona_calefaccion` | 5 zonas (config SP, tolerancias) | 5 |
| `zon_zona_lectura` | Histórico PV + SSR por zona | ∞ |

**Detalle `zon_zona_calefaccion`:**

```sql
CREATE TABLE heating.zon_zona_calefaccion (
    id              SERIAL PRIMARY KEY,
    codigo          TEXT NOT NULL UNIQUE,  -- 'zona_1', 'zona_2', ...
    nombre          TEXT NOT NULL,         -- 'Zona 1 - Alim.', ...
    setpoint        DOUBLE PRECISION NOT NULL DEFAULT 0,  -- °C
    tolerancia_sup  DOUBLE PRECISION NOT NULL DEFAULT 0,  -- °C
    tolerancia_inf  DOUBLE PRECISION NOT NULL DEFAULT 0,  -- °C
    activa          BOOLEAN NOT NULL DEFAULT TRUE
);
```

**Lecturas con FK:**

```sql
CREATE TABLE heating.zon_zona_lectura (
    id              BIGSERIAL PRIMARY KEY,
    zona_id         INTEGER NOT NULL REFERENCES heating.zon_zona_calefaccion(id),
    temperatura_pv  DOUBLE PRECISION,  -- °C (Process Variable)
    salida_ssr      DOUBLE PRECISION,  -- % (SSR output)
    capturado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### 6.2.6 Recipes (1 tabla)

```sql
CREATE TABLE recipes.rec_perfil (
    id          SERIAL PRIMARY KEY,
    nombre      TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    activo      BOOLEAN NOT NULL DEFAULT FALSE,  -- Solo 1 activo a la vez
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Propósito:** Gestión de recetas (multi-perfil). Todas las tablas de etapas (cierre, apertura, inyección, sostenimiento, eyección) referencian `perfil_id`.

**Ejemplo:** Receta "Pieza A" tiene:
- 3 etapas de cierre
- 3 etapas de apertura
- 5 etapas de inyección
- 4 etapas de sostenimiento
- 3 etapas de eyección

Cambiar receta = UPDATE `rec_perfil SET activo = TRUE WHERE id = X`.

### 6.3 Catálogos Maestros

**Tablas de referencia** (datos fijos, pocas filas):

```sql
dashboard.cat_modo_operacion    -- 2 filas (1=Manual, 2=Automático)
dashboard.cat_valor_modo        -- 2 filas ('activo', 'inactivo')
dashboard.cat_comando_ciclo     -- 2 filas ('start', 'stop')
dashboard.cat_activacion        -- 2 filas (TRUE, FALSE)
dashboard.cat_estado_fase       -- 4 filas ('completado', 'activo', 'pendiente', 'bloqueado')
```

**Uso:** Foreign keys desde tablas operativas para validar valores.

### 6.4 Índices Estratégicos

```sql
-- Consultas de últimas lecturas (ORDER BY capturado_en DESC LIMIT 1)
CREATE INDEX idx_dashboard_vgn_kpi_fecha ON dashboard.vgn_kpi_lectura(capturado_en DESC);
CREATE INDEX idx_clamp_vgn_servo_fecha ON clamp.vgn_servomotor_lectura(capturado_en DESC);
CREATE INDEX idx_injection_gen_servo_fecha ON injection.gen_servomotor_lectura(capturado_en DESC);
CREATE INDEX idx_injection_car_lectura_fecha ON injection.car_carro_lectura(capturado_en DESC);
CREATE INDEX idx_ejection_eyc_lectura_fecha ON ejection.eyc_eyector_lectura(capturado_en DESC);

-- Consultas por zona
CREATE INDEX idx_heating_zon_lectura ON heating.zon_zona_lectura(zona_id, capturado_en DESC);
```

**Rendimiento:** Consulta `SELECT * FROM ... ORDER BY capturado_en DESC LIMIT 1` ejecuta en <1ms con índice.


---

## 7. Protocolos Industriales

### 7.1 Modbus TCP

**Configuración SPX5:**

```javascript
{
    host: '192.168.1.100',  // IP del PLC
    port: 502,              // Puerto estándar Modbus TCP
    unitId: 1,              // Slave ID
    timeout: 5000,          // 5s timeout por operación
    retryInterval: 3000,    // 3s entre reintentos
    maxRetries: 5           // Máx 5 intentos antes de abandonar
}
```

**Mapeo de registros (200+ registros):**

| Tipo | Rango Modbus | Acceso | Uso principal |
|------|--------------|--------|---------------|
| **Holding Registers** | 0-99 | R/W | Setpoints (torque, velocidad, posición) |
| **Input Registers** | 100-199 | R | Lecturas (PV, velocidad real, torque real) |
| **Coils** | 0-99 | R/W | Estados binarios (On/Off, habilitaciones) |
| **Discrete Inputs** | 0-99 | R | Sensores digitales (fin de carrera, alarmas) |

**Ejemplo de registro completo:**

```javascript
{
  name: 'carriageVelocidad',
  type: 'carriage_control',
  modbusType: 'inputRegister',
  modbusAddress: 158,
  opcuaDataType: 'Double',
  scaleFactor: 1,
  unit: 'mm/s',
  readable: true,
  writable: false,
  description: 'Velocidad actual del carro de inyección',
  is32Bit: false,
  bitPosition: null
}
```

**Escalado de valores:**

```javascript
// Modbus envía enteros de 16-bit (0-65535)
// Aplicamos scaleFactor para convertir a unidades reales

rawValue = 8520;        // Modbus raw
scaleFactor = 0.01;     // Config
realValue = 8520 * 0.01 = 85.2 mm/s;
```

**Registros 32-bit:**

```javascript
// Algunos valores (contadores, posiciones largas) necesitan 32 bits
// Se almacenan en 2 registros consecutivos (High/Low words)

// Registro: velocidadHusillo (32-bit)
velocidadHusilloHigh = readInputRegister(100);  // High word
velocidadHusilloLow  = readInputRegister(101);  // Low word

// Recomposición
fullValue = (velocidadHusilloHigh << 16) | velocidadHusilloLow;
```

**Ciclo de polling:**

```javascript
// Cada 1 segundo
async function _pollAllRegisters() {
    const registers = registerManager.getAll();
    
    for (const reg of registers) {
        if (!reg.readable) continue;
        
        try {
            // Lectura Modbus
            const value = await modbusClient.readByConfig(reg);
            
            // Actualizar caché OPC UA
            opcuaServer.updateCachedValue(reg.name, value, true);
            
        } catch (error) {
            logger.warn(`Error polling ${reg.name}: ${error.message}`);
        }
    }
}

setInterval(_pollAllRegisters, 1000);
```

### 7.2 OPC UA

**Características implementadas:**
- ✅ Servidor OPC UA v1.04
- ✅ SecurityMode: None (sin cifrado, red local confiable)
- ✅ SecurityPolicy: None
- ✅ Autenticación: Anonymous (sin usuario/contraseña)
- ✅ Puerto: 4840 (estándar OPC UA)
- ✅ Namespace custom: `ns=1;s=SPX5`

**Ventajas OPC UA:**
- Protocolo estándar industrial (interoperabilidad con SCADA)
- Auto-descubrimiento de nodos (clientes leen estructura automáticamente)
- Suscripciones push (vs polling)
- Tipado fuerte (Int32, Double, Boolean, String)

**Sincronización con Modbus:**

```javascript
// Modbus → OPC UA (lectura)
modbusClient.on('valueRead', (name, value) => {
    opcuaServer.updateCachedValue(name, value);
    opcuaServer.triggerMonitoredItem(name); // Notifica suscriptores OPC UA
});

// OPC UA → Modbus (escritura)
opcuaNode.on('write', async (dataValue) => {
    const newValue = dataValue.value.value;
    await modbusClient.writeByConfig(register, newValue);
    opcuaServer.markAsWritten(register.name); // Evitar loop
});
```

**Ejemplo de cliente OPC UA (Python):**

```python
from opcua import Client

client = Client("opc.tcp://localhost:4840")
client.connect()

# Leer velocidad del carro
node = client.get_node("ns=1;s=SPX5/Carriage/velocity")
velocity = node.get_value()
print(f"Velocidad carro: {velocity} mm/s")

# Escribir torque
torque_node = client.get_node("ns=1;s=SPX5/Carriage/torque")
torque_node.set_value(ua.DataValue(ua.Variant(50.0, ua.VariantType.Double)))

client.disconnect()
```


### 7.3 WebSocket (Tiempo Real)

**Arquitectura:**

```javascript
// Backend: realtimeBus.js (Event Emitter)
const EventEmitter = require('events');
const realtimeBus = new EventEmitter();

// Cuando cambia un valor en OPC UA → emite evento
opcuaServer.on('valueChanged', ({ name, value }) => {
    realtimeBus.emit('dataUpdate', { [name]: value });
});

// API Server crea WebSocket server
const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws) => {
    const handler = (data) => ws.send(JSON.stringify(data));
    realtimeBus.on('dataUpdate', handler);
    
    ws.on('close', () => {
        realtimeBus.off('dataUpdate', handler);
    });
});
```

**Frontend: Conexión WebSocket**

```typescript
// infrastructure/helpers/servo-websocket.service.ts
export class ServoWebSocketService {
    private ws: WebSocket | null = null;
    private listeners: Set<(data: ServoData) => void> = new Set();
    
    connect(url: string) {
        this.ws = new WebSocket(url);
        
        this.ws.onmessage = (event) => {
            const data: ServoData = JSON.parse(event.data);
            this.listeners.forEach(cb => cb(data));
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            setTimeout(() => this.connect(url), 3000); // Reconectar
        };
    }
    
    subscribe(callback: (data: ServoData) => void) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }
}
```

**Ventajas WebSocket vs HTTP Polling:**
- ✅ **Latencia**: <10ms vs 1500ms
- ✅ **Ancho de banda**: 95% menos tráfico (solo envía cambios)
- ✅ **Escalabilidad**: 1000+ clientes concurrentes
- ✅ **UX**: Datos "vivos" sin retraso perceptible

---

## 8. Funcionalidades por Módulo

### 8.1 Dashboard (Vista General)

**Ruta:** `/dashboard`

**Componentes principales:**
1. **KPI Cards** - 4 métricas clave
2. **Machine Status** - Estado ciclo + modo operación
3. **Servo Variable Grid** - 10 variables servomotor

**Funcionalidades:**

#### 8.1.1 KPIs en Tiempo Real

```typescript
interface KpiData {
    cycleTime: number;          // Tiempo de ciclo (segundos)
    productionCount: number;    // Piezas producidas
    productionTarget: number;   // Objetivo (meta)
    qualityYield: number;       // Rendimiento calidad (%)
}
```

**Visualización:**

```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ Tiempo de Ciclo │ Prod. Actual    │ Objetivo Prod.  │ Calidad         │
│ 23.5 s          │ 1,245 pzs       │ 5,000 pzs       │ 98.2 %          │
│ ▼ -2.3%         │ ▲ +15 pzs/hr    │ 24.9% completo  │ ▲ +0.5%         │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

**Actualización:** Polling HTTP cada 1.5s + WebSocket para cambios inmediatos.

**Colores dinámicos:**
- Verde: Dentro de rango normal
- Amarillo: Cerca de límite
- Rojo: Fuera de rango / alarma

#### 8.1.2 Machine Status

**Estados del ciclo:**

| Estado | Color | Significado |
|--------|-------|-------------|
| **IDLE** | Gris | Máquina detenida |
| **RUNNING** | Verde | Ciclo en ejecución |
| **PAUSED** | Amarillo | Ciclo pausado |
| **ALARM** | Rojo | Error/alarma activa |
| **MAINTENANCE** | Naranja | Modo mantenimiento |

**Modo de operación:**

```typescript
interface OperationMode {
    mode: 1 | 2;  // 1 = Manual, 2 = Automático
}
```

**Controles:**
- Toggle Manual/Automático (requiere confirmación)
- Botones Start/Stop ciclo
- Indicador de conexión PLC (verde/rojo)


#### 8.1.3 Servo Variable Grid

**Grid 5×2 de variables del servomotor de inyección:**

```
┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│ Velocidad    │ Torque       │ Posición     │ Corriente    │ Voltaje      │
│ 1,850 rpm    │ 75.2 %       │ 145.7 mm     │ 12.5 A       │ 380 V        │
│ speed        │ engineering  │ straighten   │ bolt         │ zap          │
└──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

**Componente reutilizable:**

```typescript
<ServoVariableGrid 
    servoGateway={new ServoRepository()} 
/>
```

**Indicadores:**
- Icono Lucide por variable (semántico)
- Color según rango: verde (OK), amarillo (warning), rojo (alarm)
- Animación sutil en cambios (fade-in)

### 8.2 Ciclo de Pasos (Step Cycle)

**Ruta:** `/dashboard/step-cycle`

**Propósito:** Visualizar las 12 fases del ciclo de inyección en tiempo real.

**Fases del ciclo:**

| # | Fase | Duración típica |
|---|------|-----------------|
| 1 | Cierre de Molde | 1.2s |
| 2 | Protección de Molde | 0.45s |
| 3 | Tonelaje | 0.8s |
| 4 | Avance de Carro | 1.1s |
| 5 | Inyección | 0.9s |
| 6 | Transferencia V/P | 0.1s |
| 7 | Sostenimiento | 3.5s |
| 8 | Enfriamiento | 9.0s |
| 9 | Retorno de Carro | 0.8s |
| 10 | Apertura | 1.7s |
| 11 | Eyección | 0.75s |
| 12 | Dosificación | 1.85s |

**Estados por fase:**

```typescript
type PhaseState = 'completado' | 'activo' | 'pendiente' | 'bloqueado';
```

**Visualización:**

```
1. [✓] Cierre de Molde       (1.20s) ━━━━━━━━━━ completado
2. [✓] Protección de Molde   (0.45s) ━━━━━━━━━━ completado
3. [✓] Tonelaje              (0.80s) ━━━━━━━━━━ completado
4. [✓] Avance de Carro       (1.10s) ━━━━━━━━━━ completado
5. [▶] Inyección             (0.00s) ━━━━━━━━━━ activo
6. [ ] Transferencia V/P     (0.00s) ━━━━━━━━━━ pendiente
7. [ ] Sostenimiento         (0.00s) ━━━━━━━━━━ pendiente
8. [ ] Enfriamiento          (0.00s) ━━━━━━━━━━ pendiente
9. [×] Retorno de Carro      (0.00s) ━━━━━━━━━━ bloqueado
...
```

**Características:**
- Progress bar animada en fase activa
- Color por estado (verde/azul/gris/rojo)
- Timer en tiempo real
- Auto-scroll a fase activa

### 8.3 Monitor de Tiempo (Time Monitor)

**Ruta:** `/dashboard/time-monitor`

**Propósito:** Comparar tiempo programado vs tiempo real por cada fase.

**Visualización:**

```
Fase             | Programado | Real   | Diferencia | Estado
─────────────────┼────────────┼────────┼────────────┼────────
Cierre           | 2.10s      | 2.05s  | -0.05s     | ✓ OK
Inyección        | 1.50s      | 1.55s  | +0.05s     | ⚠ Slow
Anclaje          | 1.00s      | 1.12s  | +0.12s     | ⚠ Slow
Enfriamiento     | 9.50s      | 9.40s  | -0.10s     | ✓ OK
Apertura         | 1.70s      | 1.70s  | 0.00s      | ✓ OK
Eyección         | 0.75s      | 0.70s  | -0.05s     | ✓ OK
Plastificación   | 1.85s      | 1.83s  | -0.02s     | ✓ OK
─────────────────┴────────────┴────────┴────────────┴────────
TOTAL            | 18.40s     | 18.35s | -0.05s     | ✓ OK
```

**Gráficas:**
- Bar chart comparativo (programado vs real)
- Trend line de últimos 10 ciclos
- Indicador de tendencia (↑ empeorando, ↓ mejorando, → estable)

**Alertas:**
- Diferencia >10%: Alerta amarilla
- Diferencia >20%: Alerta roja
- Notificación push (si WebSocket conectado)


---

## 9. Descripción Detallada de Pantallas

### 9.1 Módulo Molde (Clamp)

#### 9.1.1 Vista General del Molde

**Ruta:** `/clamp` (página principal del módulo)

**Layout:**

```
┌────────────────────────────────────────────────────────────────┐
│ GENERAL                                                        │
│ Vista general del molde y variables del servomotor en tiempo  │
│ real                                                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌────────────┬────────────┬────────────┬────────────┬─────┐  │
│  │ Velocidad  │ Torque     │ Posición   │ Corriente  │ ... │  │
│  │ 850 mm/s   │ 70.2 %     │ 450.0 mm   │ 15.2 A     │     │  │
│  └────────────┴────────────┴────────────┴────────────┴─────┘  │
│                                                                │
│  ┌─────────────────────────────────────────┬─────────────────┐│
│  │                                         │                 ││
│  │         [Canvas Animado]                │  Control Panel  ││
│  │                                         │                 ││
│  │   ╔═══════════════════════════╗         │  ┌───────────┐ ││
│  │   ║  MOLDE CERRADO           ║         │  │ Encender  │ ││
│  │   ║                           ║         │  │  Torque   │ ││
│  │   ║  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   ║         │  │ Posición  │ ││
│  │   ║  PIEZA                    ║         │  │ Velocidad │ ││
│  │   ║  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   ║         │  └───────────┘ ││
│  │   ║                           ║         │                 ││
│  │   ╚═══════════════════════════╝         │  ┌───────────┐ ││
│  │                                         │  │   Mover   │ ││
│  │   Posición: 450.0 mm                   │  │    a:     │ ││
│  │   Estado: CERRADO                       │  │  [____]   │ ││
│  │                                         │  │   [IR]    │ ││
│  │                                         │  └───────────┘ ││
│  └─────────────────────────────────────────┴─────────────────┘│
└────────────────────────────────────────────────────────────────┘
```

**Componentes:**

1. **Servo Variable Grid** (10 variables)
   - Velocidad, Torque, Posición, Corriente, Voltaje
   - Polling 1.5s + WebSocket

2. **Mold Canvas** (visualización 3D simplificada)
   ```typescript
   // Canvas HTML5 con animaciones
   - Estado: ABIERTO / CERRANDO / CERRADO / ABRIENDO
   - Color según estado (gris/amarillo/verde/azul)
   - Indicador de posición actual (barra)
   ```

3. **Control Panel** (lado derecho, scrollable)
   ```typescript
   interface MoldControlData {
       moldControlEncendido: number;      // 0 | 37 (On/Off)
       moldTorque: number;                // % (0-100)
       moldCambioPosicion: number;        // mm (trigger move)
       moldPosicion1: number;             // mm (start pos)
       moldPosicion2: number;             // mm (end pos)
       moldVelocidadPosicion: number;     // mm/s
   }
   ```

   **Controles:**
   - Switch ON/OFF (moldControlEncendido)
   - Slider Torque (0-100%)
   - Inputs Posición 1/2 (mm)
   - Input Velocidad (mm/s)
   - Botón "Mover a posición" (dispara moldCambioPosicion)

**Flujo de control:**

```
Usuario cambia torque → Input onChange → 
→ POST /api/mold-control { moldTorque: 75 } → 
→ Bridge escribe Modbus registro 41 → 
→ PLC aplica torque → 
→ Polling lee nuevo valor → 
→ Frontend actualiza UI
```

**Tiempo de respuesta:** 
- Local (sin PLC): <100ms
- Con PLC: 1-3s (depende de polling cycle)

#### 9.1.2 Perfil de Cierre

**Ruta:** `/clamp/closing-profile`

**Propósito:** Configurar el perfil de velocidad/torque en las 3 etapas de cierre del molde.

**Tabla de etapas:**

```
Etapa | Etiqueta                  | Inicio (mm) | Velocidad (mm/s) | Torque Max (%)
──────┼───────────────────────────┼─────────────┼──────────────────┼───────────────
  1   | Fase 1                    | 1150.0      | 350              | 80
  2   | Fase 2                    | 450.0       | 200              | 70
  3   | Inicio Protección Molde   | 120.5       | 45               | 15
```

**Componente de edición:**

```typescript
<StageTable
    stages={stages}
    columns={[
        { key: 'etiqueta', label: 'Etiqueta', editable: true },
        { key: 'inicio', label: 'Inicio (mm)', type: 'number' },
        { key: 'velocidad', label: 'Velocidad (mm/s)', type: 'number' },
        { key: 'torqueMax', label: 'Torque Máx (%)', type: 'number' }
    ]}
    onSave={handleSave}
/>
```

**Validaciones:**
- ✅ `inicio` descendente (1150 → 450 → 120)
- ✅ `velocidad` > 0 && < 1000
- ✅ `torqueMax` 0-100%
- ✅ No permitir etapas vacías

**Persistencia:**
- Backend: `POST /api/clamp/closing-profile { stages: [...] }`
- DB: Tabla `clamp.cie_etapa_cierre`
- Perfil activo vinculado a `recipes.rec_perfil`

**Gráfica de perfil:**
- Eje X: Posición (mm)
- Eje Y1: Velocidad (mm/s)
- Eje Y2: Torque (%)
- Líneas escalonadas entre etapas


#### 9.1.3 Perfil de Apertura

**Ruta:** `/clamp/opening-profile`

**Similar a perfil de cierre, con 3 etapas:**

```
Etapa | Etiqueta          | Posición (mm) | Velocidad (mm/s) | Aceleración (mm/s²)
──────┼───────────────────┼───────────────┼──────────────────┼────────────────────
  1   | Fase 1            | 450.0         | 850.0            | 1200
  2   | Fase 2            | 680.0         | 100.0            | 600
  3   | Posición Final    | 750.0         | 20.0             | 300
```

**Diferencia clave:** Incluye campo `aceleración` (rampa de velocidad).

**Gráfica:**
- Curva de velocidad (no escalonada, con aceleración)
- Preview de movimiento animado

### 9.2 Módulo Inyección (Injection)

#### 9.2.1 General (Servo + Husillo)

**Ruta:** `/injection/general`

**Layout:**

```
┌────────────────────────────────────────────────────────────────┐
│ GENERAL                                                        │
│ Servomotor de inyección y control del husillo                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  SERVO VARIABLES (10 variables en grid 5×2)                   │
│  ┌────────────┬────────────┬────────────┬────────────┬─────┐  │
│  │ ... igual que molde ...                                   │  │
│  └────────────┴────────────┴────────────┴────────────┴─────┘  │
│                                                                │
│  ┌─────────────────────────────────────────┬─────────────────┐│
│  │  CONTROL DEL HUSILLO                    │                 ││
│  │                                         │                 ││
│  │  ┌───────────────────────────────────┐  │                 ││
│  │  │ Encender:        [ON/OFF Switch] │  │                 ││
│  │  │ Velocidad:       [1500] RPM      │  │                 ││
│  │  │ Torque:          [75.0] %        │  │                 ││
│  │  │                                   │  │                 ││
│  │  │ [Aplicar Cambios]                │  │                 ││
│  │  └───────────────────────────────────┘  │                 ││
│  │                                         │                 ││
│  │  LECTURAS EN TIEMPO REAL                │                 ││
│  │  ┌───────────────────────────────────┐  │                 ││
│  │  │ Velocidad Actual:  1,485 RPM     │  │                 ││
│  │  │ Torque Actual:     73.2 %        │  │                 ││
│  │  │ Temperatura:       185 °C        │  │                 ││
│  │  └───────────────────────────────────┘  │                 ││
│  └─────────────────────────────────────────┴─────────────────┘│
└────────────────────────────────────────────────────────────────┘
```

**Control del husillo:**

```typescript
interface ScrewControlData {
    controlEncendido: number;      // 0 | 37
    velocidadHusillo: number;      // RPM (32-bit)
    torqueHusillo: number;         // %
}
```

**Particularidad: Valores 32-bit**

El husillo maneja velocidades altas (>65535 RPM), requiere 2 registros Modbus:

```javascript
// Escritura 32-bit
const intValue = Math.round(1500); // RPM
const highWord = (intValue >> 16) & 0xFFFF;
const lowWord = intValue & 0xFFFF;

await modbusClient.write(100, highWord); // velocidadHusilloHigh
await modbusClient.write(101, lowWord);  // velocidadHusilloLow
```

**Backend maneja automáticamente:**

```javascript
POST /api/screw-control
{
    "velocidadHusillo": 1500
}

// Backend divide en High/Low internamente
results.velocidadHusillo = { 
    success: true, 
    value: 1500, 
    highWord: 0, 
    lowWord: 1500 
}
```

#### 9.2.2 Carro de Inyección

**Ruta:** `/injection/carriage`

**Propósito:** Control del movimiento del carro que empuja el husillo hacia el molde.

**Layout:**

```
┌────────────────────────────────────────────────────────────────┐
│ CARRO DE INYECCIÓN                                            │
│ Avance y retroceso de la unidad de inyección y variables     │
│ en tiempo real                                                 │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  LECTURAS EN TIEMPO REAL (3 cards)                            │
│  ┌──────────────┬──────────────┬──────────────────────────┐   │
│  │ Velocidad    │ Posición     │ Torque Secundario       │   │
│  │ speed        │ straighten   │ rotate_right            │   │
│  │ 85.2 mm/s    │ 145.7 mm     │ 42.5 %                  │   │
│  └──────────────┴──────────────┴──────────────────────────┘   │
│                                                                │
│  ┌─────────────────────────────────────────┬─────────────────┐│
│  │                                         │                 ││
│  │      [Canvas Carro Animado]             │  Control Panel  ││
│  │                                         │                 ││
│  │   ═════════════════════════             │  ┌───────────┐ ││
│  │   ║                                     │  │ Encender  │ ││
│  │   ║  CARRO ══►                          │  │  Torque   │ ││
│  │   ║                                     │  │ Posición  │ ││
│  │   ═════════════════════════             │  │ Velocidad │ ││
│  │                                         │  └───────────┘ ││
│  │   Pos: 145.7 / 200.0 mm                │                 ││
│  │   Vel: 85.2 mm/s                        │  ┌───────────┐ ││
│  │                                         │  │   Mover   │ ││
│  │                                         │  │    a:     │ ││
│  │                                         │  │  [145]mm  │ ││
│  │                                         │  │   [IR]    │ ││
│  │                                         │  └───────────┘ ││
│  └─────────────────────────────────────────┴─────────────────┘│
└────────────────────────────────────────────────────────────────┘
```

**Modelo de datos:**

```typescript
interface CarriageControlData {
    // ── Setpoints (escribibles) ──
    carriageControlEncendido: number;      // 0 | 37
    carriageTorque: number;                // %
    carriageCambioPosicion: number;        // mm (trigger)
    carriagePosicion1: number;             // mm (start)
    carriagePosicion2: number;             // mm (end)
    carriageVelocidadPosicion: number;     // mm/s
    
    // ── Lecturas (solo lectura) ──
    carriageVelocidad: number;             // mm/s
    carriagePosicion: number;              // mm
    carriageTorqueSecundario: number;      // %
}
```

**Separación setpoints/lecturas en DB:**

```sql
-- Setpoints (tabla singleton)
injection.car_carro_config (id=1)

-- Lecturas históricas
injection.car_carro_lectura (timestamps)
```

**Endpoint combinado:**

```javascript
GET /api/carriage-control
→ {
    // Setpoints (car_carro_config)
    carriageControlEncendido: 0,
    carriageTorque: 50,
    carriagePosicion1: 0,
    carriagePosicion2: 200,
    carriageVelocidadPosicion: 120,
    
    // Lecturas (car_carro_lectura, última fila)
    carriageVelocidad: 85.2,
    carriagePosicion: 145.7,
    carriageTorqueSecundario: 42.5,
    
    _source: 'db'
}
```

**Feature "Mover a posición":**

```javascript
// Usuario ingresa 150mm → botón "IR"
POST /api/carriage-control/move
{
    "target": 150
}

// Backend:
// 1. Lee posición actual (Y) → 145.7mm
// 2. Escribe Pos1 = 145.7, Pos2 = 150
// 3. Dispara cambio de posición (carriageCambioPosicion = 1)
// 4. PLC mueve carro 145.7 → 150
// 5. Polling frontend muestra progreso en tiempo real
```


#### 9.2.3 Perfil de Inyección

**Ruta:** `/injection/injection-profile`

**Propósito:** Configurar 5 etapas del proceso de inyección del plástico fundido.

**Tabla de etapas:**

```
Etapa | Punto Inicio (mm) | Velocidad (mm/s)
──────┼───────────────────┼──────────────────
  1   | 180.00            | 120.0
  2   | 145.50            | 95.0
  3   | 90.25             | 150.0
  4   | 40.00             | 65.0
  5   | 15.00             | 20.0
```

**Interpretación:**
- Cada etapa define velocidad de inyección en un rango de posición
- Etapa 1: Desde 180mm hasta 145.5mm a 120 mm/s
- Etapa 2: Desde 145.5mm hasta 90.25mm a 95 mm/s
- ...y así sucesivamente

**Gráfica de perfil:**

```
Velocidad (mm/s)
  │
150 │               ┌──────┐
    │               │      │
120 │ ┌─────────┐   │      │
    │ │         │   │      │
 95 │ │         └───┘      │
    │ │                    │
 65 │ │                    └─────────┐
    │ │                              │
 20 │ │                              └─────────┐
  0 ├──┴──────────────────────────────────────┴─────► Posición (mm)
    0  15    40         90        145        180
```

**Funcionalidades:**
- Edición inline de valores
- Validación: puntos inicio descendentes
- Botón "Guardar" → `POST /api/injection/injection-profile`
- Preview gráfico actualizado en tiempo real
- Botón "Restaurar" → recupera última versión guardada

**Persistencia:**

```sql
-- Tabla
injection.iny_etapa_inyeccion (perfil_id, orden, punto_inicio, velocidad)

-- Foreign key
perfil_id → recipes.rec_perfil.id (receta activa)
```

#### 9.2.4 Perfil de Sostenimiento (Holding)

**Ruta:** `/injection/holding`

**Propósito:** Configurar 4 etapas de sostenimiento (presión después de inyección).

**Tabla de etapas:**

```
Etapa | Presión (bar) | Tiempo (s) | Velocidad (mm/s) | Posición (mm)
──────┼───────────────┼────────────┼──────────────────┼──────────────
  1   | 750           | 1.50       | 15.0             | 20.0
  2   | 620           | 2.00       | 12.0             | 18.0
  3   | 500           | 3.00       | 8.0              | 15.0
  4   | 450           | 1.50       | 5.0              | 10.0
```

**Interpretación:**
- Etapa 1: Aplicar 750 bar durante 1.5s a velocidad 15 mm/s en posición 20mm
- Presión decreciente (750 → 450) para evitar marcas en pieza
- Tiempos acumulativos (total 8s de sostenimiento)

**Validaciones:**
- Presión decreciente o igual
- Tiempo > 0
- Velocidad > 0

#### 9.2.5 Gráficas

**Ruta:** `/injection/graphs`

**Propósito:** Visualizaciones avanzadas del proceso de inyección.

**Gráficas disponibles:**

1. **Presión vs Tiempo**
   - Eje X: Tiempo (s)
   - Eje Y: Presión (bar)
   - Línea: Curva de inyección + sostenimiento

2. **Velocidad vs Posición**
   - Eje X: Posición husillo (mm)
   - Eje Y: Velocidad (mm/s)
   - Muestra perfil de inyección escalonado

3. **Torque vs Tiempo**
   - Eje X: Tiempo (s)
   - Eje Y: Torque (%)
   - Útil para detectar anomalías

4. **Histórico de Ciclo**
   - Últimos 50 ciclos
   - Comparación tiempo ciclo
   - Detección de tendencias

**Componente:**

```typescript
<LineChart
    data={cycleHistory}
    xAxis={{ key: 'timestamp', label: 'Tiempo' }}
    yAxis={{ key: 'cycleTime', label: 'Tiempo Ciclo (s)' }}
    showTrendLine
/>
```

**Actualización:**
- Polling cada 5s (gráficas no requieren tiempo real estricto)
- Botón "Refrescar" manual


### 9.3 Módulo Eyección (Ejection)

#### 9.3.1 General

**Ruta:** `/ejection/general`

**Propósito:** Control del eyector (mecanismo que expulsa la pieza del molde).

**Layout:** Similar a Carro de Inyección

```
┌────────────────────────────────────────────────────────────────┐
│ EYECTOR                                                        │
│ Expulsión de la pieza y variables del servomotor en tiempo    │
│ real                                                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  LECTURAS EN TIEMPO REAL (3 cards)                            │
│  ┌──────────────┬──────────────┬──────────────────────────┐   │
│  │ Velocidad    │ Posición     │ Torque Secundario       │   │
│  │ 43.5 mm/s    │ 29.0 mm      │ 35.8 %                  │   │
│  └──────────────┴──────────────┴──────────────────────────┘   │
│                                                                │
│  ┌─────────────────────────────────────────┬─────────────────┐│
│  │      [Canvas Eyector Animado]           │  Control Panel  ││
│  │                                         │                 ││
│  │   ╔═════════════════════════╗           │  ┌───────────┐ ││
│  │   ║  EYECTOR  ▼             ║           │  │ Encender  │ ││
│  │   ║     │                   ║           │  │  Torque   │ ││
│  │   ║     │  PIEZA            ║           │  │ Posición  │ ││
│  │   ║     ▼                   ║           │  │ Velocidad │ ││
│  │   ║                         ║           │  └───────────┘ ││
│  │   ╚═════════════════════════╝           │                 ││
│  │                                         │  ┌───────────┐ ││
│  │   Pos: 29.0 / 150.0 mm                 │  │   Mover   │ ││
│  │   Estado: EXTENDIDO                     │  │    a:     │ ││
│  │                                         │  │  [50]mm   │ ││
│  │                                         │  │   [IR]    │ ││
│  │                                         │  └───────────┘ ││
│  └─────────────────────────────────────────┴─────────────────┘│
└────────────────────────────────────────────────────────────────┘
```

**Modelo de datos:**

```typescript
interface EjectorControlData {
    // ── Setpoints (escribibles) ──
    ejectorControlEncendido: number;       // 0 | 37
    ejectorTorque: number;                 // %
    ejectorCambioPosicion: number;         // mm
    ejectorPosicion1: number;              // mm
    ejectorPosicion2: number;              // mm
    ejectorVelocidadPosicion: number;      // mm/s
    
    // ── Lecturas (solo lectura) ──
    ejectorVelocidad: number;              // mm/s
    ejectorPosicion: number;               // mm
    ejectorTorqueSecundario: number;       // %
}
```

**Tablas DB:**

```sql
-- Setpoints
ejection.eyc_eyector_config (id=1)

-- Lecturas históricas
ejection.eyc_eyector_lectura (id, velocidad, posicion, torque_secundario, capturado_en)
```

**Particularidad:** El eyector tiene un recorrido corto (típicamente 150mm) comparado con carro (200mm).

#### 9.3.2 Perfil de Eyección

**Ruta:** `/ejection/ejection-profile`

**Propósito:** Configurar 3 etapas de eyección.

**Tabla de etapas:**

```
Etapa | Etiqueta    | Posición (mm) | Velocidad (mm/s)
──────┼─────────────┼───────────────┼──────────────────
  1   | Despegue    | 25.0          | 40.0
  2   | Expulsión   | 120.0         | 180.0
  3   | Final       | 150.0         | 20.0
```

**Interpretación:**
- **Despegue**: Movimiento lento inicial para no dañar pieza
- **Expulsión**: Velocidad alta para sacar pieza completamente
- **Final**: Desaceleración para llegar a posición final suavemente

**Gráfica:**

```
Velocidad (mm/s)
  │
180 │         ┌─────────────┐
    │         │             │
 40 │ ┌───────┘             │
    │ │                     │
 20 │ │                     └─────────┐
  0 ├─┴───────────────────────────────┴──► Posición (mm)
    0    25              120           150
```

### 9.4 Módulo Temperaturas (Heating)

#### 9.4.1 Zonas del Cilindro

**Ruta:** `/heating/cylinder-zones`

**Propósito:** Monitoreo y control de 5 zonas de calentamiento del cilindro.

**Layout:**

```
┌────────────────────────────────────────────────────────────────┐
│ ZONAS DEL CILINDRO                                            │
│ Control de temperatura de las 5 zonas de calentamiento       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Zona | Nombre         | SP (°C) | PV (°C) | SSR (%) | Estado │
│  ─────┼────────────────┼─────────┼─────────┼─────────┼────────│
│   1   │ Zona 1 - Alim. │ 210     │ 208.5   │ 45.0    │ ✓ OK   │
│   2   │ Zona 2 - Tr. 1 │ 225     │ 225.8   │ 30.0    │ ✓ OK   │
│   3   │ Zona 3 - Tr. 2 │ 240     │ 239.2   │ 55.0    │ ✓ OK   │
│   4   │ Zona 4 - Dosif.│ 240     │ 241.5   │ 20.0    │ ⚠ High │
│   5   │ Zona 5 - Salida│ 235     │ 234.0   │ 60.0    │ ✓ OK   │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  GRÁFICA HISTÓRICA (últimos 60 minutos)                  │ │
│  │                                                           │ │
│  │  °C                                                       │ │
│  │  250 ┼─────────────────────────────────────────          │ │
│  │  240 ┼─────────────────────────────────────────  Zona 4  │ │
│  │  225 ┼─────────────────────────────────────────  Zona 2  │ │
│  │  210 ┼─────────────────────────────────────────  Zona 1  │ │
│  │    0 └───────────────────────────────────────────► Tiempo│ │
│  │      0min                                      60min      │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  EDITAR ZONA: Zona 1 - Alimentación                      │ │
│  │                                                           │ │
│  │  Setpoint:        [210] °C                               │ │
│  │  Tolerancia Sup:  [5] °C                                 │ │
│  │  Tolerancia Inf:  [5] °C                                 │ │
│  │  Activa:          [✓] Sí                                 │ │
│  │                                                           │ │
│  │  [Guardar Cambios]  [Cancelar]                           │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

**Modelo de datos:**

```typescript
interface HeatingZone {
    id: number;
    codigo: string;              // 'zona_1', 'zona_2', ...
    nombre: string;              // 'Zona 1 - Alim.', ...
    setpoint: number;            // °C (SP)
    toleranciaSup: number;       // °C
    toleranciaInf: number;       // °C
    activa: boolean;
    
    // Lecturas (última)
    temperaturaPv?: number;      // °C (Process Variable)
    salidaSsr?: number;          // % (SSR output)
}
```

**Estado de zona:**

```typescript
function getZoneState(pv: number, sp: number, tolSup: number, tolInf: number) {
    if (pv > sp + tolSup) return 'ALTO';        // Rojo
    if (pv < sp - tolInf) return 'BAJO';        // Azul
    if (Math.abs(pv - sp) < 2) return 'OK';     // Verde
    return 'WARNING';                            // Amarillo
}
```

**Persistencia:**

```sql
-- Config zonas (5 filas)
heating.zon_zona_calefaccion (id, codigo, nombre, setpoint, tolerancia_sup, tolerancia_inf, activa)

-- Histórico lecturas
heating.zon_zona_lectura (id, zona_id, temperatura_pv, salida_ssr, capturado_en)
```

**Funcionalidades:**
- Edición inline de setpoints
- Gráfica histórica multi-línea (Chart.js)
- Alarma visual si fuera de rango
- Botón "Desactivar zona" (emergencia)



#### 9.4.2 Diagnóstico PID (ON-OFF)

**Ruta:** `/heating/pid-diagnostic`

**Propósito:** Visualización detallada del control ON-OFF de temperatura por zona.

**Layout:**

```
┌────────────────────────────────────────────────────────────────┐
│ DIAGNÓSTICO DE CONTROL DE TEMPERATURA (ON - OFF)              │
│ Estado del lazo ON-OFF por zona: PV, setpoint y salida SSR    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌───────┬───────┬───────┬───────┬───────┐                    │
│  │Zona 1 │Zona 2 │Zona 3 │Zona 4 │Zona 5 │                    │
│  └───────┴───────┴───────┴───────┴───────┘                    │
│                                                                │
│  ┌──────────┬──────────┬──────────┬──────────┐               │
│  │ Temp. PV │ Setpoint │ SSR (%)  │ Error    │               │
│  │ 208.5°C  │ 210.0°C  │ 45%      │ -1.5°C   │               │
│  └──────────┴──────────┴──────────┴──────────┘               │
│                                                                │
│  ┌──────────────────────┐  ┌──────────────────────┐          │
│  │  SALIDA ACTIVA       │  │  BANDAS DE TOLERANCIA│          │
│  │                      │  │                      │          │
│  │  [TOGGLE_ON]         │  │  Superior: 215.0°C   │          │
│  │                      │  │  Setpoint: 210.0°C   │          │
│  │  Dentro tolerancia   │  │  Inferior: 205.0°C   │          │
│  └──────────────────────┘  └──────────────────────┘          │
└────────────────────────────────────────────────────────────────┘
```

**Modelo de datos:**

```typescript
interface ZonaDiagnostico {
    codigo: string;               // 'zona_1'
    nombre: string;               // 'Zona 1 - Alim.'
    setpoint: number;             // °C (SP)
    toleranciaSup: number;        // °C
    toleranciaInf: number;        // °C
    temperaturaPv: number | null; // °C (lectura)
    salidaSsr: number | null;     // % (0-100)
    estado: 'on' | 'off';         // Estado salida
    error: number | null;         // PV - SP
}
```

**Lógica de control ON-OFF:**

```typescript
// Control simplificado (no PID, solo ON/OFF)
if (temperaturaPv < setpoint - toleranciaInf) {
    estado = 'on';   // Activar calentamiento
    salidaSsr = 100; // Full power
} else if (temperaturaPv > setpoint + toleranciaSup) {
    estado = 'off';  // Desactivar
    salidaSsr = 0;
} else {
    // Mantener estado anterior (histéresis)
}
```

**Indicadores visuales:**
- ✅ Verde: Dentro de tolerancia
- ⚠️ Amarillo: Cerca del límite
- 🔴 Rojo: Fuera de tolerancia
- Toggle animado: ON (verde) / OFF (gris)

**Actualización:** Polling cada 2s


### 9.5 Módulo Mantenimiento (Maintenance)

#### 9.5.1 Monitor I/O

**Ruta:** `/maintenance/io-monitor`

**Propósito:** Visualización en tiempo real del estado de todas las señales digitales del PLC.

**Layout:**

```
┌────────────────────────────────────────────────────────────────┐
│ DIAGNÓSTICO DE SEÑALES PLC                              [●]    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  ENTRADAS DIGITALES (Discrete Inputs)              [32] │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │                                                          │ │
│  │  DI0: Sensor Molde Cerrado           [●] ACTIVO         │ │
│  │  DI1: Sensor Molde Abierto           [ ] INACTIVO       │ │
│  │  DI2: Fin Carrera Carro Delante      [●] ACTIVO         │ │
│  │  DI3: Fin Carrera Carro Atrás        [ ] INACTIVO       │ │
│  │  DI4: Sensor Pieza Eyectada          [ ] INACTIVO       │ │
│  │  DI5: Alarma Temperatura Alta        [ ] INACTIVO       │ │
│  │  ...                                                     │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  SALIDAS DIGITALES (Coils)                         [24] │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │                                                          │ │
│  │  DO0: Válvula Cierre Molde           [●] ACTIVO         │ │
│  │  DO1: Válvula Apertura Molde         [ ] INACTIVO       │ │
│  │  DO2: Motor Husillo ON               [●] ACTIVO         │ │
│  │  DO3: Bomba Hidráulica               [●] ACTIVO         │ │
│  │  DO4: Resistencia Zona 1             [●] ACTIVO         │ │
│  │  DO5: Resistencia Zona 2             [●] ACTIVO         │ │
│  │  ...                                                     │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  [EXPORTAR LOG]                                                │
└────────────────────────────────────────────────────────────────┘
```

**Características:**
- Vista en tiempo real (actualización cada 500ms)
- Indicador visual: ● ACTIVO (verde) / ○ INACTIVO (gris)
- Filtros: Mostrar solo activos, buscar por nombre
- Agrupación: Entradas/Salidas/Coils/Registros
- Exportar CSV para diagnóstico

**Modelo de datos:**

```typescript
interface IOSignal {
    address: number;        // Dirección Modbus
    type: 'DI' | 'DO' | 'AI' | 'AO';
    name: string;          // Nombre descriptivo
    state: boolean | number; // Estado actual
    description?: string;
}
```

**Fuente de datos:**
- Lee directamente de Modbus (registros discrete inputs + coils)
- No usa base de datos (diagnóstico en vivo)

#### 9.5.2 Historial de Alarmas

**Ruta:** `/maintenance/alarm-history`

**Propósito:** Registro cronológico de alarmas y eventos del sistema.

**Layout:**

```
┌────────────────────────────────────────────────────────────────┐
│ REGISTRO HISTÓRICO DE FALLAS                          history │
│ Consulta cronológica de alarmas y advertencias del sistema    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Filtros: [Todas] [Críticas] [Advertencias] [Info]            │
│  Rango:   [Últimas 24h ▼]    Buscar: [____________]           │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Fecha/Hora          │ Tipo      │ Código │ Descripción   │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │ 2026-01-25 14:32:15 │ 🔴 CRÍTICA│ E401   │ Temp. Zona 4  │ │
│  │                     │           │        │ fuera rango   │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │ 2026-01-25 14:28:03 │ ⚠️ WARNING│ W201   │ Presión baja  │ │
│  │                     │           │        │ hidráulica    │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │ 2026-01-25 14:15:42 │ ℹ️  INFO  │ I100   │ Ciclo         │ │
│  │                     │           │        │ completado OK │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │ 2026-01-25 13:58:20 │ 🔴 CRÍTICA│ E302   │ Molde no      │ │
│  │                     │           │        │ cerró correcta│ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  [◀ Anterior]  Página 1 de 8  [Siguiente ▶]                   │
│  [EXPORTAR PDF]  [LIMPIAR HISTÓRICO]                          │
└────────────────────────────────────────────────────────────────┘
```



**Modelo de datos:**

```typescript
interface AlarmRecord {
    id: number;
    timestamp: Date;
    type: 'CRITICAL' | 'WARNING' | 'INFO';
    code: string;           // Ej: 'E401', 'W201'
    description: string;
    module: string;         // 'clamp', 'injection', etc.
    acknowledged: boolean;  // Alarma reconocida por operador
}
```

**Tipos de alarmas:**
- 🔴 **CRÍTICA**: Detiene producción (temp. alta, presión baja)
- ⚠️ **WARNING**: Advertencia (fuera de tolerancia menor)
- ℹ️ **INFO**: Informativa (ciclo completado, cambio modo)

**Funcionalidades:**
- Filtros por tipo y rango temporal
- Búsqueda por código o descripción
- Paginación (20 registros por página)
- Exportar PDF/CSV para auditoría
- Botón "Reconocer" para alarmas críticas

**Persistencia:**
```sql
-- Tabla de histórico
maintenance.alarm_history (
    id, timestamp, type, code, 
    description, module, acknowledged
)
```

#### 9.5.3 Configuración Modbus

**Ruta:** `/maintenance/modbus-config`

**Propósito:** Edición dinámica de direcciones Modbus sin recompilar el bridge.

**Layout:**

```
┌────────────────────────────────────────────────────────────────┐
│ DIRECCIONES MODBUS                                      memory │
│ Configura dinámicamente la dirección Modbus de cada variable  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Módulo: [Dashboard] [Molde] [Inyección] [Eyección] [Temp.]   │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ VISTA GENERAL                                            │ │
│  │                                                          │ │
│  │ KPIs / Producción                                        │ │
│  │ ┌────────────────────────────────────────────────────┐  │ │
│  │ │Variable     │Tipo Modbus    │Dirección│Tipo Dato  │  │ │
│  │ ├────────────────────────────────────────────────────┤  │ │
│  │ │cycleTime    │inputRegister  │ [110]   │Double     │  │ │
│  │ │production   │inputRegister  │ [111]   │Double     │  │ │
│  │ │...                                                 │  │ │
│  │ └────────────────────────────────────────────────────┘  │ │
│  │                                                          │ │
│  │ Modo de Operación                                        │ │
│  │ ┌────────────────────────────────────────────────────┐  │ │
│  │ │operationMode│holdingRegister│ [30]    │Int32      │  │ │
│  │ └────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ⚠️  3 cambio(s) sin guardar              [Descartar] [Guardar]│
└────────────────────────────────────────────────────────────────┘
```

**Funcionalidades:**

1. **Edición inline de campos:**
   - `modbusType`: inputRegister, holdingRegister, coil, discreteInput
   - `modbusAddress`: 0-65535 (validación de rango)
   - `opcuaDataType`: Boolean, Int32, Double, String, etc.

2. **Agrupación por módulo:**
   - Tabs superiores: Dashboard, Molde, Inyección, etc.
   - Sections: Vista General, Perfil Cierre, etc.
   - Groups: KPIs, Control Molde, etc.

3. **Validación en tiempo real:**
   - Dirección única por tipo
   - Rango válido (0-65535)
   - Tipo de dato compatible

4. **Persistencia:**
   - Backend: `PATCH /api/registers/:name`
   - Actualiza archivo de configuración (no requiere reiniciar bridge)
   - Bridge recarga config automáticamente

**Modelo de datos:**

```typescript
interface RegisterConfig {
    name: string;           // Identificador único
    type: string;           // Grupo funcional
    modbusType: ModbusType;
    modbusAddress: number;
    opcuaDataType: string;
    scaleFactor: number;
    unit: string;
    readable: boolean;
    writable: boolean;
    description: string;
}

interface RegisterPatch {
    name: string;
    modbusType?: ModbusType;
    modbusAddress?: number;
    opcuaDataType?: string;
}
```

**Endpoint API:**

```javascript
// Obtener todos los registros
GET /api/registers
→ [ { name: 'cycleTime', ... }, { name: 'moldTorque', ... } ]

// Actualizar registro individual
PATCH /api/registers/cycleTime
{ modbusAddress: 115 }
→ { success: true, register: { ... } }

// Actualizar batch (múltiples)
POST /api/registers/batch
{ changes: [{ name: 'cycleTime', modbusAddress: 115 }, ...] }
→ { success: true, results: [...] }
```

**Casos de uso:**
- Cambio de PLC (nuevas direcciones Modbus)
- Optimización de mapeo de registros
- Depuración de comunicación
- Configuración por cliente (diferentes modelos de máquina)


---

## 10. Flujos de Datos

### 10.1 Flujo de Lectura (Polling)

**Secuencia completa:**

```
┌──────────┐
│   PLC    │  Modbus TCP (192.168.1.100:502)
│  SPX5    │
└────┬─────┘
     │
     │ 1. POLLING (cada 1s)
     │    Bridge lee ~200 registros
     │
     ▼
┌──────────────────────────────────────────┐
│  ModbusClient.readByConfig(register)     │
│  - inputRegister (110-199)               │
│  - holdingRegister (0-99)                │
│  - coil (0-99)                           │
│  - discreteInput (0-99)                  │
└────┬─────────────────────────────────────┘
     │
     │ 2. ACTUALIZACIÓN CACHÉ OPC UA
     │    opcuaServer.updateCachedValue()
     │
     ▼
┌──────────────────────────────────────────┐
│  OPC UA Server (puerto 4840)             │
│  - Actualiza nodos en memoria            │
│  - Notifica suscriptores OPC UA          │
│  - Emite evento 'valueChanged'           │
└────┬─────────────────────────────────────┘
     │
     │ 3. PERSISTENCIA (debounce 300ms)
     │    lecturaWatcher.saveOnChange()
     │
     ▼
┌──────────────────────────────────────────┐
│  PostgreSQL (puerto 5432)                │
│  - INSERT INTO car_carro_lectura         │
│  - INSERT INTO vgn_kpi_lectura           │
│  - UPSERT INTO molde_config (setpoints)  │
└────┬─────────────────────────────────────┘
     │
     │ 4. API REST (consulta frontend)
     │    GET /api/carriage-control
     │
     ▼
┌──────────────────────────────────────────┐
│  Express API (puerto 3000)               │
│  - Combina setpoints (config) + lecturas │
│  - Responde JSON                         │
└────┬─────────────────────────────────────┘
     │
     │ 5. HTTP Response
     │    { carriageVelocidad: 85.2, ... }
     │
     ▼
┌──────────────────────────────────────────┐
│  Frontend React                          │
│  - Polling cada 1.5s                     │
│  - Actualiza UI (useState)               │
└──────────────────────────────────────────┘
```

**Tiempos de respuesta:**
- Modbus read: 10-50ms
- Caché update: <1ms
- DB insert: 5-20ms
- API response: 10-30ms
- **Total E2E: 1-3s** (limitado por polling)



### 10.2 Flujo de Escritura (Control)

**Secuencia completa:**

```
┌──────────────────────────────────────────┐
│  Frontend React                          │
│  Usuario cambia torque: 50% → 75%        │
└────┬─────────────────────────────────────┘
     │
     │ 1. POST REQUEST
     │    POST /api/carriage-control
     │    { carriageTorque: 75 }
     │
     ▼
┌──────────────────────────────────────────┐
│  Express API (puerto 3000)               │
│  - Valida datos                          │
│  - Busca registro 'carriageTorque'       │
└────┬─────────────────────────────────────┘
     │
     │ 2. ESCRITURA MODBUS
     │    modbusClient.writeByConfig(reg, 75)
     │
     ▼
┌──────────────────────────────────────────┐
│  ModbusClient                            │
│  - Escribe holdingRegister[52] = 75      │
│  - Maneja reconexión si falla            │
└────┬─────────────────────────────────────┘
     │
     │ 3. COMUNICACIÓN MODBUS TCP
     │    Function Code 0x06 (Write Single)
     │
     ▼
┌──────────────────────────────────────────┐
│  PLC SPX5                                │
│  - Aplica torque 75% al carro            │
│  - Actualiza registro interno            │
└────┬─────────────────────────────────────┘
     │
     │ 4. CONFIRMACIÓN (próximo polling 1s)
     │    Bridge lee inputRegister[168]
     │
     ▼
┌──────────────────────────────────────────┐
│  Frontend (Actualización UI)             │
│  - Polling detecta nuevo valor           │
│  - Slider refleja cambio                 │
└──────────────────────────────────────────┘
```

**Tiempos de respuesta:**
- API request: 10-20ms
- Modbus write: 20-80ms
- PLC apply: <100ms
- Confirmación visual: 1-3s (polling)
- **Total E2E: 1-4s**

**Manejo de errores:**
- Timeout Modbus (5s) → Reintento automático
- PLC offline → Error HTTP 503
- Valor fuera de rango → Error HTTP 400


### 10.3 Flujo WebSocket (Tiempo Real)

**Secuencia para datos críticos (servo, alarmas):**

```
┌──────────┐
│   PLC    │
└────┬─────┘
     │ Polling 1s detecta cambio
     ▼
┌──────────────────────────────────────────┐
│  OPC UA Server                           │
│  updateCachedValue(name, value, trigger) │
└────┬─────────────────────────────────────┘
     │
     │ emit('valueChanged', { name, value })
     │
     ▼
┌──────────────────────────────────────────┐
│  realtimeBus (EventEmitter)              │
│  - Propaga evento a WebSocket server     │
└────┬─────────────────────────────────────┘
     │
     │ wss.clients.forEach(send)
     │
     ▼
┌──────────────────────────────────────────┐
│  WebSocket Clients (frontend)            │
│  - Recibe JSON inmediatamente            │
│  - Actualiza UI sin polling              │
└──────────────────────────────────────────┘
```

**Ventajas:**
- Latencia: <10ms (vs 1500ms polling)
- Ancho de banda: 95% menos tráfico
- UX: Datos "vivos" sin retraso perceptible

**Implementación frontend:**

```typescript
useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000/ws/servo');
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setServoData(data); // Actualización inmediata
    };
    
    return () => ws.close();
}, []);
```


### 10.4 Flujo de Persistencia (LecturaWatcher)

**Estrategia de debounce para reducir carga DB:**

```
Polling detecta 100 cambios/segundo
         ↓
┌──────────────────────────────────────────┐
│  opcuaServer.on('valueChanged')          │
│  - Cada cambio dispara evento            │
└────┬─────────────────────────────────────┘
     │
     │ DEBOUNCE 300ms
     │ (agrupa cambios simultáneos)
     │
     ▼
┌──────────────────────────────────────────┐
│  lecturaWatcher.saveOnChange()           │
│  - Ejecuta solo después de 300ms silencio│
└────┬─────────────────────────────────────┘
     │
     │ SNAPSHOT ATÓMICO
     │ (lee toda la caché en un momento)
     │
     ▼
┌──────────────────────────────────────────┐
│  PostgreSQL INSERT                       │
│  - car_carro_lectura                     │
│  - gen_servomotor_lectura                │
│  - vgn_kpi_lectura                       │
│  - eyc_eyector_lectura                   │
│  (1 transacción, todas las tablas)       │
└──────────────────────────────────────────┘
```

**Resultado:**
- Sin debounce: 1000 writes/s → DB saturado
- Con debounce: 3 writes/s → DB relajado
- Consistencia: Snapshot atómico de todo el sistema


---

## 11. Patrones de Diseño

### 11.1 Arquitectura Hexagonal (Ports & Adapters)

**Implementación frontend:**

```
┌─────────────────────────────────────────┐
│         PRESENTATION LAYER              │
│  (React Components - UI)                │
│                                         │
│  - CarriageGeneralPage.tsx              │
│  - MoldGeneralPage.tsx                  │
│  - Usa interfaces (gateways)            │
│  - No conoce HTTP/DB directamente       │
└────────────┬────────────────────────────┘
             │
             │ Depende de interfaces
             ▼
┌─────────────────────────────────────────┐
│         DOMAIN LAYER                    │
│  (Business Logic - Core)                │
│                                         │
│  Models:                                │
│  - carriage-control.model.ts            │
│  - mold-control.model.ts                │
│                                         │
│  Gateways (Interfaces/Ports):          │
│  - CarriageGateway                      │
│  - MoldGateway                          │
│                                         │
│  Use Cases:                             │
│  - GetCarriageDataUseCase               │
│  - SaveCarriageConfigUseCase            │
└────────────┬────────────────────────────┘
             │
             │ Implementado por
             ▼
┌─────────────────────────────────────────┐
│      INFRASTRUCTURE LAYER               │
│  (Adapters - Technical Details)        │
│                                         │
│  Repositories (HTTP):                   │
│  - CarriageRepository                   │
│    implements CarriageGateway           │
│    → httpService.get('/api/...')        │
│                                         │
│  Services:                              │
│  - HttpService (Axios wrapper)          │
│  - WebSocketService                     │
└─────────────────────────────────────────┘
```

**Ventajas:**
1. **Testeable**: Mock repositories sin tocar UI
2. **Flexible**: Cambiar HTTP → GraphQL solo en infrastructure
3. **Mantenible**: Cambios en API no afectan domain
4. **Reusable**: Mismo use case para web/mobile

**Ejemplo concreto:**

```typescript
// domain/gateway/carriage.gateway.ts (Puerto)
export interface CarriageGateway {
    getData(): Promise<CarriageControlData>;
    saveConfig(data: Partial<CarriageControlData>): Promise<void>;
}

// infrastructure/repository/carriage.repository.ts (Adaptador)
export class CarriageRepository implements CarriageGateway {
    async getData(): Promise<CarriageControlData> {
        return httpService.get('/api/carriage-control');
    }
    
    async saveConfig(data: Partial<CarriageControlData>): Promise<void> {
        await httpService.post('/api/carriage-control', data);
    }
}

// presentation/pages/CarriageGeneralPage.tsx (UI)
const repo: CarriageGateway = new CarriageRepository(); // Inyección

useEffect(() => {
    repo.getData().then(setData); // Usa interfaz, no implementación
}, []);
```



### 11.2 Repository Pattern

**Propósito:** Abstraer el acceso a datos (HTTP, DB, localStorage).

**Implementación:**

```typescript
// Interfaz genérica
interface Repository<T> {
    getAll(): Promise<T[]>;
    getById(id: number): Promise<T>;
    save(item: T): Promise<T>;
    delete(id: number): Promise<void>;
}

// Implementación HTTP
class HTTPRepository<T> implements Repository<T> {
    constructor(private baseUrl: string) {}
    
    async getAll(): Promise<T[]> {
        return httpService.get<T[]>(this.baseUrl);
    }
    
    async getById(id: number): Promise<T> {
        return httpService.get<T>(`${this.baseUrl}/${id}`);
    }
    
    async save(item: T): Promise<T> {
        return httpService.post<T>(this.baseUrl, item);
    }
    
    async delete(id: number): Promise<void> {
        await httpService.delete(`${this.baseUrl}/${id}`);
    }
}

// Uso
const kpiRepo = new HTTPRepository<KpiData>('/api/kpis');
const kpis = await kpiRepo.getAll();
```

**Ventajas:**
- Cambiar backend (REST → GraphQL) solo requiere nuevo repository
- Testear componentes con MockRepository
- Caché/offline mode con LocalStorageRepository


### 11.3 Observer Pattern (WebSocket)

**Propósito:** Notificaciones push para datos en tiempo real.

**Implementación:**

```typescript
// infrastructure/helpers/websocket-service.ts
export class WebSocketService<T> {
    private ws: WebSocket | null = null;
    private listeners: Set<(data: T) => void> = new Set();
    
    connect(url: string): void {
        this.ws = new WebSocket(url);
        
        this.ws.onmessage = (event) => {
            const data: T = JSON.parse(event.data);
            this.notifyListeners(data);
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.reconnect(url);
        };
    }
    
    subscribe(callback: (data: T) => void): () => void {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback); // Unsubscribe
    }
    
    private notifyListeners(data: T): void {
        this.listeners.forEach(cb => cb(data));
    }
    
    private reconnect(url: string): void {
        setTimeout(() => this.connect(url), 3000);
    }
}

// Uso en componente
const wsService = new WebSocketService<ServoData>();
wsService.connect('ws://localhost:3000/ws/servo');

useEffect(() => {
    const unsubscribe = wsService.subscribe((data) => {
        setServoData(data); // Auto-update UI
    });
    
    return unsubscribe; // Cleanup
}, []);
```

**Ventajas:**
- Múltiples componentes pueden suscribirse al mismo WebSocket
- Reconexión automática
- Limpieza automática (unsubscribe en cleanup)


### 11.4 Singleton Pattern (Config, Logger)

**Propósito:** Una sola instancia compartida globalmente.

**Implementación backend:**

```javascript
// utils/logger.js
const winston = require('winston');

let instance = null;

class Logger {
    constructor() {
        if (instance) return instance;
        
        this.logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: 'logs/app.log' })
            ]
        });
        
        instance = this;
    }
    
    info(message, meta) {
        this.logger.info(message, meta);
    }
    
    error(message, meta) {
        this.logger.error(message, meta);
    }
}

module.exports = new Logger(); // Exporta instancia única
```

**Uso:**

```javascript
const logger = require('./utils/logger');

logger.info('Modbus connected', { host: '192.168.1.100' });
logger.error('Failed to read register', { register: 'cycleTime' });
```


### 11.5 Strategy Pattern (Data Source)

**Propósito:** Intercambiar fuente de datos (Modbus vs DB) dinámicamente.

**Implementación backend:**

```javascript
// api/modules/_shared.js

// Estrategia: leer desde Modbus
class ModbusDataSource {
    async getData(registerNames) {
        const data = {};
        for (const name of registerNames) {
            const reg = registerManager.getByName(name);
            data[name] = await modbusClient.readByConfig(reg);
        }
        return data;
    }
}

// Estrategia: leer desde DB
class DatabaseDataSource {
    async getData(tableName) {
        const result = await dbClient.query(
            `SELECT * FROM ${tableName} ORDER BY actualizado_en DESC LIMIT 1`
        );
        return result.rows[0];
    }
}

// Selector de estrategia
function getDataSource(mode) {
    return mode === 'modbus' 
        ? new ModbusDataSource() 
        : new DatabaseDataSource();
}

// Uso en ruta
router.get('/api/carriage-control', async (req, res) => {
    const mode = config.dataSource; // 'modbus' | 'db'
    const dataSource = getDataSource(mode);
    
    let data;
    if (mode === 'modbus') {
        data = await dataSource.getData([
            'carriageVelocidad',
            'carriagePosicion',
            'carriageTorqueSecundario'
        ]);
    } else {
        data = await dataSource.getData('injection.car_carro_lectura');
    }
    
    res.json({ ...data, _source: mode });
});
```

**Ventaja:** Cambiar fuente de datos sin modificar lógica de rutas.


### 11.6 Factory Pattern (Registro Modbus)

**Propósito:** Crear objetos complejos con configuración centralizada.

**Implementación:**

```javascript
// utils/registerManager.js

class RegisterFactory {
    createRegister(config) {
        return {
            name: config.name,
            type: config.type || 'generic',
            modbusType: config.modbusType || 'inputRegister',
            modbusAddress: config.modbusAddress,
            opcuaDataType: config.opcuaDataType || 'Double',
            scaleFactor: config.scaleFactor || 1,
            unit: config.unit || '',
            readable: config.readable !== false,
            writable: config.writable || false,
            description: config.description || '',
            is32Bit: config.is32Bit || false,
            bitPosition: config.bitPosition || null
        };
    }
    
    createBatch(configs) {
        return configs.map(c => this.createRegister(c));
    }
}

const factory = new RegisterFactory();

const registers = factory.createBatch([
    {
        name: 'carriageVelocidad',
        modbusAddress: 158,
        type: 'carriage_control',
        unit: 'mm/s',
        description: 'Velocidad del carro'
    },
    {
        name: 'carriageTorque',
        modbusAddress: 52,
        modbusType: 'holdingRegister',
        writable: true,
        unit: '%',
        description: 'Torque del carro'
    }
]);
```


### 11.7 Decorator Pattern (HTTP Interceptor)

**Propósito:** Agregar funcionalidad (logging, auth) sin modificar código original.

**Implementación frontend:**

```typescript
// infrastructure/helpers/http-service.ts

class HttpService {
    private baseURL = 'http://localhost:3000';
    
    async get<T>(url: string): Promise<T> {
        return this.request<T>('GET', url);
    }
    
    async post<T>(url: string, data: any): Promise<T> {
        return this.request<T>('POST', url, data);
    }
    
    private async request<T>(
        method: string, 
        url: string, 
        data?: any
    ): Promise<T> {
        const startTime = Date.now();
        
        try {
            // Pre-request (logging)
            console.log(`[HTTP] ${method} ${url}`, data);
            
            const response = await fetch(`${this.baseURL}${url}`, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${token}` // Futuro
                },
                body: data ? JSON.stringify(data) : undefined
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            
            // Post-request (logging, métricas)
            const duration = Date.now() - startTime;
            console.log(`[HTTP] ${method} ${url} - ${duration}ms`);
            
            return result;
            
        } catch (error) {
            // Error handling (logging, retry)
            console.error(`[HTTP] ${method} ${url} - ERROR`, error);
            throw error;
        }
    }
}

export const httpService = new HttpService();
```

**Ventajas:**
- Logging centralizado
- Retry automático (agregar lógica en catch)
- Autenticación global (headers)
- Métricas de rendimiento



---

## 12. Configuración y Despliegue

### 12.1 Variables de Entorno

#### 12.1.1 Frontend (.env)

```bash
# frontend/.env

# API del bridge
VITE_API_URL=http://localhost:3000

# WebSocket URL
VITE_WS_URL=ws://localhost:3000

# Modo de desarrollo
VITE_DEV_MODE=true

# Polling intervals (ms)
VITE_POLLING_INTERVAL=1500
VITE_WS_RECONNECT_INTERVAL=3000
```

**Uso en código:**

```typescript
// frontend/src/environments/environment.ts
export const environment = {
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:3000',
    devMode: import.meta.env.VITE_DEV_MODE === 'true',
    pollingInterval: Number(import.meta.env.VITE_POLLING_INTERVAL) || 1500
};
```

#### 12.1.2 Backend (.env)

```bash
# spx5-opcua-bridge/.env

# Servidor
PORT=3000
NODE_ENV=production

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=spx5_db
DB_USER=spx5_user
DB_PASSWORD=spx5_pass

# Modbus PLC
MODBUS_HOST=192.168.1.100
MODBUS_PORT=502
MODBUS_UNIT_ID=1
MODBUS_TIMEOUT=5000
MODBUS_RETRY_INTERVAL=3000
MODBUS_MAX_RETRIES=5

# OPC UA
OPCUA_PORT=4840
OPCUA_ENDPOINT=opc.tcp://0.0.0.0:4840

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Data Source (modbus | db)
DATA_SOURCE=db

# Polling
POLLING_INTERVAL=1000

# LecturaWatcher
LECTURA_DEBOUNCE=300
```

**Carga en código:**

```javascript
// spx5-opcua-bridge/config/config.js
require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'spx5_db',
        user: process.env.DB_USER || 'spx5_user',
        password: process.env.DB_PASSWORD
    },
    
    modbus: {
        host: process.env.MODBUS_HOST || '192.168.1.100',
        port: parseInt(process.env.MODBUS_PORT) || 502,
        unitId: parseInt(process.env.MODBUS_UNIT_ID) || 1,
        timeout: parseInt(process.env.MODBUS_TIMEOUT) || 5000,
        retryInterval: parseInt(process.env.MODBUS_RETRY_INTERVAL) || 3000,
        maxRetries: parseInt(process.env.MODBUS_MAX_RETRIES) || 5
    },
    
    opcua: {
        port: parseInt(process.env.OPCUA_PORT) || 4840,
        endpoint: process.env.OPCUA_ENDPOINT || 'opc.tcp://0.0.0.0:4840'
    },
    
    dataSource: process.env.DATA_SOURCE || 'db',
    pollingInterval: parseInt(process.env.POLLING_INTERVAL) || 1000,
    lecturaDebounce: parseInt(process.env.LECTURA_DEBOUNCE) || 300
};
```


### 12.2 Docker Compose

**Archivo completo:**

```yaml
# docker-compose.yml

version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:16
    container_name: spx5_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: spx5_db
      POSTGRES_USER: spx5_user
      POSTGRES_PASSWORD: spx5_pass
      POSTGRES_INITDB_ARGS: "-E UTF8"
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./spx5-opcua-bridge/db:/docker-entrypoint-initdb.d
    networks:
      - spx5_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U spx5_user -d spx5_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Bridge (Node.js)
  bridge:
    build:
      context: ./spx5-opcua-bridge
      dockerfile: Dockerfile
    container_name: spx5_bridge
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: spx5_db
      DB_USER: spx5_user
      DB_PASSWORD: spx5_pass
      MODBUS_HOST: ${MODBUS_HOST:-192.168.1.100}
      PORT: 3000
      OPCUA_PORT: 4840
      NODE_ENV: production
    ports:
      - "3000:3000"   # API REST
      - "4840:4840"   # OPC UA
    volumes:
      - ./spx5-opcua-bridge/logs:/app/logs
    networks:
      - spx5_network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/kpis"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend (React + Nginx)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: http://localhost:3000
        VITE_WS_URL: ws://localhost:3000
    container_name: spx5_frontend
    restart: unless-stopped
    depends_on:
      - bridge
    ports:
      - "5173:80"
    networks:
      - spx5_network

volumes:
  postgres_data:
    driver: local

networks:
  spx5_network:
    driver: bridge
```


### 12.3 Dockerfiles

#### 12.3.1 Backend Dockerfile

```dockerfile
# spx5-opcua-bridge/Dockerfile

FROM node:18-alpine

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Crear directorio de logs
RUN mkdir -p logs

# Exponer puertos
EXPOSE 3000 4840

# Usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Comando de inicio
CMD ["node", "src/index.js"]
```

#### 12.3.2 Frontend Dockerfile

```dockerfile
# frontend/Dockerfile

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build arguments
ARG VITE_API_URL
ARG VITE_WS_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

RUN npm run build

# Stage 2: Production
FROM nginx:1.25-alpine

# Copiar build
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Nginx config:**

```nginx
# frontend/nginx.conf

server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (opcional)
    location /api {
        proxy_pass http://bridge:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket proxy
    location /ws {
        proxy_pass http://bridge:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```


### 12.4 Comandos de Despliegue

#### 12.4.1 Desarrollo Local

```bash
# 1. Iniciar PostgreSQL
docker-compose up postgres -d

# 2. Iniciar Bridge
cd spx5-opcua-bridge
npm install
npm run dev

# 3. Iniciar Frontend (otra terminal)
cd frontend
npm install
npm run dev
```

#### 12.4.2 Producción (Docker)

```bash
# Build y start todos los servicios
docker-compose up -d --build

# Ver logs
docker-compose logs -f

# Ver logs específicos
docker-compose logs -f bridge
docker-compose logs -f postgres

# Restart servicios
docker-compose restart bridge

# Stop todos
docker-compose down

# Stop y eliminar volúmenes (⚠️ pierde datos)
docker-compose down -v
```

#### 12.4.3 Actualización de Código

```bash
# Pull cambios
git pull origin main

# Rebuild solo bridge
docker-compose up -d --build bridge

# Rebuild solo frontend
docker-compose up -d --build frontend

# Restart todos
docker-compose restart
```


### 12.5 Inicialización de Base de Datos

**Automática con Docker:**

```bash
# Los archivos en spx5-opcua-bridge/db/ se ejecutan automáticamente
# al crear el contenedor de PostgreSQL por primera vez:

spx5-opcua-bridge/db/
├── 01_schema.sql    # Crea schemas, tablas, índices
└── 02_seed.sql      # Inserta datos iniciales
```

**Manual (si no usa Docker):**

```bash
# Crear DB
createdb -U postgres spx5_db

# Ejecutar scripts
psql -U postgres -d spx5_db -f spx5-opcua-bridge/db/01_schema.sql
psql -U postgres -d spx5_db -f spx5-opcua-bridge/db/02_seed.sql

# Verificar
psql -U postgres -d spx5_db -c "\dt dashboard.*"
psql -U postgres -d spx5_db -c "SELECT COUNT(*) FROM clamp.cie_etapa_cierre"
```



### 12.6 Monitoreo y Logs

#### 12.6.1 Estructura de Logs

```
spx5-opcua-bridge/logs/
├── app.log              # Log general (info, error)
├── modbus.log           # Log específico Modbus
├── opcua.log            # Log específico OPC UA
└── api.log              # Log de requests HTTP
```

#### 12.6.2 Configuración Winston

```javascript
// spx5-opcua-bridge/src/utils/logger.js

const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        // Console (desarrollo)
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ level, message, timestamp, ...meta }) => {
                    return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
                })
            )
        }),
        
        // Archivo general
        new winston.transports.File({
            filename: path.join('logs', 'app.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 5
        }),
        
        // Solo errores
        new winston.transports.File({
            filename: path.join('logs', 'error.log'),
            level: 'error',
            maxsize: 10485760,
            maxFiles: 5
        })
    ]
});

module.exports = logger;
```

#### 12.6.3 Ejemplo de Logs

```json
// logs/app.log

{"level":"info","message":"Bridge started","timestamp":"2026-01-25 10:15:30","port":3000}
{"level":"info","message":"PostgreSQL connected","timestamp":"2026-01-25 10:15:31","host":"localhost","database":"spx5_db"}
{"level":"info","message":"Modbus connected","timestamp":"2026-01-25 10:15:32","host":"192.168.1.100","port":502}
{"level":"info","message":"OPC UA server started","timestamp":"2026-01-25 10:15:33","endpoint":"opc.tcp://0.0.0.0:4840"}
{"level":"info","message":"Polling started","timestamp":"2026-01-25 10:15:34","interval":1000}

{"level":"error","message":"Modbus read error","timestamp":"2026-01-25 10:20:15","register":"cycleTime","error":"Timeout"}
{"level":"warn","message":"Database slow query","timestamp":"2026-01-25 10:25:45","query":"SELECT * FROM dashboard.vgn_kpi_lectura","duration":"250ms"}
```

#### 12.6.4 Healthchecks

```javascript
// spx5-opcua-bridge/src/api/apiServer.js

// Endpoint de salud
app.get('/health', (req, res) => {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
            database: dbClient.isConnected(),
            modbus: modbusClient.isConnected(),
            opcua: opcuaServer.isRunning()
        }
    };
    
    const status = Object.values(health.services).every(v => v) ? 200 : 503;
    res.status(status).json(health);
});

// Métricas (opcional - Prometheus)
app.get('/metrics', (req, res) => {
    res.type('text/plain').send(`
# HELP spx5_modbus_reads_total Total Modbus reads
# TYPE spx5_modbus_reads_total counter
spx5_modbus_reads_total ${modbusClient.getTotalReads()}

# HELP spx5_modbus_errors_total Total Modbus errors
# TYPE spx5_modbus_errors_total counter
spx5_modbus_errors_total ${modbusClient.getTotalErrors()}

# HELP spx5_api_requests_total Total API requests
# TYPE spx5_api_requests_total counter
spx5_api_requests_total ${apiServer.getTotalRequests()}
    `.trim());
});
```


---

## 13. Casos de Uso Principales

### 13.1 Cambiar Modo de Operación (Manual → Automático)

**Actores:** Operador, Sistema HMI, PLC

**Flujo:**

```
┌──────────┐                ┌──────────┐              ┌──────────┐
│ Operador │                │   HMI    │              │   PLC    │
└────┬─────┘                └────┬─────┘              └────┬─────┘
     │                           │                         │
     │ 1. Click toggle           │                         │
     │   Manual → Automático     │                         │
     ├──────────────────────────>│                         │
     │                           │                         │
     │                           │ 2. POST /api/operation-mode
     │                           │    { mode: 2 }          │
     │                           ├────────────────────────>│
     │                           │                         │
     │                           │                    3. Escribe
     │                           │                    HoldingReg[30]=2
     │                           │                         │
     │                           │ 4. Response             │
     │                           │<────────────────────────┤
     │                           │ { success: true }       │
     │                           │                         │
     │ 5. Confirmación visual    │                         │
     │   "Modo Automático"       │                    6. PLC ejecuta
     │<──────────────────────────┤                    ciclo auto
     │                           │                         │
     │                           │ 7. Polling (1s)         │
     │                           │ GET /api/operation-mode │
     │                           ├────────────────────────>│
     │                           │                         │
     │                           │ 8. Lectura actual       │
     │                           │<────────────────────────┤
     │                           │ { mode: 2 }             │
     │                           │                         │
     │ 9. UI actualizada         │                         │
     │<──────────────────────────┤                         │
```

**Precondiciones:**
- PLC conectado (Modbus online)
- Usuario con permisos de operación
- Máquina en estado seguro (sin alarmas críticas)

**Postcondiciones:**
- Modo cambiado en PLC
- UI refleja nuevo modo
- Histórico registrado en logs


### 13.2 Configurar Perfil de Inyección

**Actores:** Técnico, Sistema HMI, Base de Datos

**Flujo:**

```
┌──────────┐                ┌──────────┐              ┌──────────┐
│ Técnico  │                │   HMI    │              │    DB    │
└────┬─────┘                └────┬─────┘              └────┬─────┘
     │                           │                         │
     │ 1. Accede a pantalla      │                         │
     │   /injection/injection-   │                         │
     │   profile                 │                         │
     ├──────────────────────────>│                         │
     │                           │                         │
     │                           │ 2. GET /api/injection/  │
     │                           │    injection-profile    │
     │                           ├────────────────────────>│
     │                           │                         │
     │                           │ 3. Retorna 5 etapas     │
     │                           │<────────────────────────┤
     │                           │                         │
     │ 4. Visualiza tabla        │                         │
     │<──────────────────────────┤                         │
     │   Etapa 1: 180mm, 120mm/s │                         │
     │   Etapa 2: 145mm, 95mm/s  │                         │
     │   ...                     │                         │
     │                           │                         │
     │ 5. Edita Etapa 1          │                         │
     │    velocidad: 120→150mm/s │                         │
     ├──────────────────────────>│                         │
     │                           │                         │
     │ 6. Click "Guardar"        │                         │
     ├──────────────────────────>│                         │
     │                           │                         │
     │                           │ 7. POST /api/injection/ │
     │                           │    injection-profile    │
     │                           │    { stages: [...] }    │
     │                           ├────────────────────────>│
     │                           │                         │
     │                           │ 8. UPDATE iny_etapa_    │
     │                           │    inyeccion WHERE      │
     │                           │    orden=1              │
     │                           │                         │
     │                           │ 9. Confirmación         │
     │                           │<────────────────────────┤
     │                           │                         │
     │ 10. Notificación          │                         │
     │     "Perfil guardado"     │                         │
     │<──────────────────────────┤                         │
     │                           │                         │
     │ 11. Gráfica actualizada   │                         │
     │<──────────────────────────┤                         │
```

**Validaciones:**
- Puntos inicio descendentes (180→145→90→...)
- Velocidad > 0 y < 1000 mm/s
- Al menos 1 etapa configurada
- Usuario con rol "técnico" o superior

**Persistencia:**
- DB: `injection.iny_etapa_inyeccion`
- Vínculo con receta activa (`perfil_id`)


### 13.3 Monitoreo en Tiempo Real (WebSocket)

**Actores:** Operador, Sistema HMI, Bridge, PLC

**Flujo:**

```
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│ Operador │      │   HMI    │      │  Bridge  │      │   PLC    │
└────┬─────┘      └────┬─────┘      └────┬─────┘      └────┬─────┘
     │                 │                 │                 │
     │ 1. Abre página  │                 │                 │
     │   /dashboard    │                 │                 │
     ├────────────────>│                 │                 │
     │                 │                 │                 │
     │                 │ 2. WebSocket    │                 │
     │                 │    connect      │                 │
     │                 │    ws://...     │                 │
     │                 ├────────────────>│                 │
     │                 │                 │                 │
     │                 │ 3. Connection   │                 │
     │                 │    established  │                 │
     │                 │<────────────────┤                 │
     │                 │                 │                 │
     │                 │                 │ 4. Polling (1s) │
     │                 │                 │    Modbus read  │
     │                 │                 ├────────────────>│
     │                 │                 │                 │
     │                 │                 │ 5. Datos        │
     │                 │                 │<────────────────┤
     │                 │                 │                 │
     │                 │                 │ 6. Detecta      │
     │                 │                 │    cambio en    │
     │                 │                 │    velocidad    │
     │                 │                 │                 │
     │                 │ 7. WS message   │                 │
     │                 │    { velocity:  │                 │
     │                 │      95.2 }     │                 │
     │                 │<────────────────┤                 │
     │                 │                 │                 │
     │ 8. UI update    │                 │                 │
     │    sin delay    │                 │                 │
     │<────────────────┤                 │                 │
     │                 │                 │                 │
     │ (usuario ve     │                 │                 │
     │  cambio en      │                 │                 │
     │  <10ms)         │                 │                 │
```

**Ventajas:**
- Latencia ultrabaja (<10ms vs 1500ms polling)
- 95% menos tráfico de red
- Experiencia "tiempo real" para operador


### 13.4 Recuperación de Fallos (Reconexión Modbus)

**Actores:** Sistema HMI, Bridge, PLC

**Flujo:**

```
┌──────────┐                ┌──────────┐              ┌──────────┐
│   HMI    │                │  Bridge  │              │   PLC    │
└────┬─────┘                └────┬─────┘              └────┬─────┘
     │                           │                         │
     │                           │ 1. Polling normal       │
     │                           ├────────────────────────>│
     │                           │                         │
     │                           │ 2. Response OK          │
     │                           │<────────────────────────┤
     │                           │                         │
     │                           │ 3. Polling...           │
     │                           ├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─X (timeout)
     │                           │                         X
     │                           │ 4. Error detectado      │
     │                           │    emit('disconnected') │
     │                           │                         │
     │                           │ 5. Intentar reconexión  │
     │                           │    (retry #1 de 5)      │
     │                           ├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ X (falla)
     │                           │                         │
     │                           │ 6. Espera 3s...         │
     │                           │                         │
     │                           │ 7. Retry #2             │
     │                           ├────────────────────────>│
     │                           │                         │
     │                           │ 8. Connection restored  │
     │                           │<────────────────────────┤
     │                           │                         │
     │                           │ 9. emit('connected')    │
     │                           │                         │
     │ 10. Notificación          │                         │
     │     "Conexión restaurada" │                         │
     │<──────────────────────────┤                         │
     │                           │                         │
     │                           │ 11. Resume polling      │
     │                           ├────────────────────────>│
```

**Estrategia de reconexión:**
- Máximo 5 intentos
- Intervalo 3s entre intentos
- Exponential backoff (opcional)
- Log de cada intento
- Si falla después de 5: Notificar operador + modo "offline"

