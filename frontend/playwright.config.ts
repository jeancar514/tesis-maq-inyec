import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración E2E — HMI máquina de inyección.
 *
 * Requisitos para correr:
 *   1. El bridge (backend + DB) debe estar corriendo en http://localhost:3000
 *      con DATA_SOURCE=db  (docker compose up + npm run dev en spx5-opcua-bridge).
 *   2. Playwright levanta el frontend (vite) automáticamente en :5173.
 *
 * Instalación (una vez):
 *   npm i -D @playwright/test
 *   npx playwright install
 *
 * Ejecutar:  npm run test:e2e
 */
export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    timeout: 30_000,
    expect: { timeout: 10_000 },
    reporter: 'list',
    use: {
        baseURL: 'http://localhost:5173',
        trace: 'on-first-retry',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ],
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: true,
        timeout: 60_000,
    },
});
