import { test, expect } from '@playwright/test';

/**
 * Resto de módulos del FooterNav y sus secciones internas.
 * Valida navegación + carga de datos (DB) y que la config Modbus quede
 * dividida por las secciones del Sidebar de cada módulo.
 */

test.describe('Molde (clamp)', () => {
    test('Vista General', async ({ page }) => {
        await page.goto('/clamp');
        await expect(page.locator('h1')).toBeVisible();
    });
    test('Perfil de Cierre', async ({ page }) => {
        await page.goto('/clamp/closing-profile');
        await expect(page.locator('h1')).toBeVisible();
    });
    test('Perfil de Apertura', async ({ page }) => {
        await page.goto('/clamp/opening-profile');
        await expect(page.locator('h1')).toBeVisible();
    });
    test('Direcciones Modbus divididas por sección', async ({ page }) => {
        await page.goto('/clamp/modbus-config');
        await expect(page.getByRole('heading', { name: 'Vista General' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Perfil de Cierre' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Perfil de Apertura' })).toBeVisible();
    });
});

test.describe('Inyección (injection)', () => {
    const rutas = ['/injection/general', '/injection/carriage', '/injection/injection-profile', '/injection/holding', '/injection/graphs'];
    for (const ruta of rutas) {
        test(`Carga ${ruta}`, async ({ page }) => {
            await page.goto(ruta);
            await expect(page.locator('h1')).toBeVisible();
        });
    }
    test('Direcciones Modbus divididas por sección', async ({ page }) => {
        await page.goto('/injection/modbus-config');
        await expect(page.getByRole('heading', { name: 'General' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Carro de Inyección' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Husillo' })).toBeVisible();
    });
});

test.describe('Eyección (ejection)', () => {
    test('Eyector', async ({ page }) => {
        await page.goto('/ejection/general');
        await expect(page.locator('h1')).toBeVisible();
    });
    test('Perfil de Eyección', async ({ page }) => {
        await page.goto('/ejection/ejection-profile');
        await expect(page.locator('h1')).toBeVisible();
    });
    test('Direcciones Modbus divididas por sección', async ({ page }) => {
        await page.goto('/ejection/modbus-config');
        await expect(page.getByRole('heading', { name: 'Eyector' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Perfil de Eyección' })).toBeVisible();
    });
});

test.describe('Temperatura (heating)', () => {
    test('Zonas del Cilindro', async ({ page }) => {
        await page.goto('/heating/cylinder-zones');
        await expect(page.locator('h1')).toBeVisible();
    });
    test('ON - OFF (diagnóstico) desde DB', async ({ page }) => {
        await page.goto('/heating/pid-diagnostic');
        await expect(page.getByText(/Diagnóstico de control de temperatura/)).toBeVisible();
        // Métricas de zona provenientes del backend
        await expect(page.getByText('Temperatura (PV)')).toBeVisible();
        await expect(page.getByText('Setpoint (SP)')).toBeVisible();
        await expect(page.getByText('Salida SSR')).toBeVisible();
    });
    test('Direcciones Modbus divididas por sección', async ({ page }) => {
        await page.goto('/heating/modbus-config');
        await expect(page.getByRole('heading', { name: 'Zonas del Cilindro' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'ON - OFF' })).toBeVisible();
    });
});
