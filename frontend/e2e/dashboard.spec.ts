import { test, expect } from '@playwright/test';

/**
 * Módulo GENERAL (dashboard) y sus secciones internas.
 * Valida que cada sección cargue datos provenientes de la base de datos.
 */
test.describe('Dashboard / General', () => {
    test('Vista General — KPIs, modo y comando desde DB', async ({ page }) => {
        await page.goto('/dashboard');

        // KPIs
        await expect(page.getByText('Tiempo de Ciclo')).toBeVisible();
        await expect(page.getByText('Producción')).toBeVisible();
        await expect(page.getByText('Rendimiento de Calidad')).toBeVisible();

        // Modo de operación (los botones existen)
        await expect(page.getByRole('button', { name: /MANUAL/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Autom/i })).toBeVisible();

        // Comando de ciclo (indicador de estado)
        await expect(page.getByText(/Máquina (en Operación|Detenida)/)).toBeVisible();
    });

    test('Ciclo de Pasos — secuencia desde DB', async ({ page }) => {
        await page.goto('/dashboard/step-cycle');
        await expect(page.getByText('Secuencia de Proceso')).toBeVisible();
        // Debe listar pasos reales (p. ej. "Cierre de Molde", "Inyección")
        await expect(page.getByText(/Cierre de Molde/)).toBeVisible();
        await expect(page.getByText(/PASOS TOTALES/)).toBeVisible();
    });

    test('Monitor de Tiempo — Gantt por fase desde DB', async ({ page }) => {
        await page.goto('/dashboard/time-monitor');
        await expect(page.getByText(/COMPARATIVA POR FASE/)).toBeVisible();
        await expect(page.getByText('Programado')).toBeVisible();
        await expect(page.getByText('Real')).toBeVisible();
    });

    test('Direcciones Modbus — tres secciones del Sidebar', async ({ page }) => {
        await page.goto('/dashboard/modbus-config');
        await expect(page.getByText('Direcciones Modbus')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Vista General' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Ciclo de Pasos' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Monitor de Tiempo' })).toBeVisible();
    });
});
