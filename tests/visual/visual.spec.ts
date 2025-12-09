import { test, expect } from '@playwright/test';

test.describe('Testes Visuais - Screenshot Comparison', () => {
  test('página inicial - estado vazio', async ({ page }) => {
    await page.goto('/');

    // Aguardar carregamento
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('home-empty.png', {
      maxDiffPixels: 100,
    });
  });

  test('página inicial - com projetos', async ({ page }) => {
    await page.goto('/');

    // Criar alguns projetos
    for (let i = 1; i <= 3; i++) {
      await page.getByRole('button', { name: /novo projeto/i }).click();
      await page.getByLabel(/nome do cliente/i).fill(`Cliente Visual ${i}`);
      await page.getByLabel(/url do site/i).fill(`https://visual${i}.com`);
      await page.getByRole('button', { name: /criar projeto/i }).click();
      await page.waitForTimeout(500);
    }

    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('home-with-projects.png', {
      maxDiffPixels: 100,
    });
  });

  test('modal de criação de projeto', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /novo projeto/i }).click();

    await expect(page.getByText('Novo Projeto')).toBeVisible();

    await expect(page).toHaveScreenshot('create-project-modal.png', {
      maxDiffPixels: 100,
    });
  });

  test('modal preenchido', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /novo projeto/i }).click();

    await page.getByLabel(/nome do cliente/i).fill('Cliente Screenshot');
    await page.getByLabel(/url do site/i).fill('https://screenshot.com');
    await page.getByLabel(/descrição/i).fill('Projeto para teste visual');
    await page.getByLabel(/email do cliente/i).fill('cliente@screenshot.com');

    await expect(page).toHaveScreenshot('create-project-modal-filled.png', {
      maxDiffPixels: 100,
    });
  });
});

test.describe('Testes Visuais - Responsividade', () => {
  test('página inicial - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('home-mobile.png', {
      maxDiffPixels: 100,
    });
  });

  test('página inicial - tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('home-tablet.png', {
      maxDiffPixels: 100,
    });
  });

  test('página inicial - desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('home-desktop.png', {
      maxDiffPixels: 100,
    });
  });
});
