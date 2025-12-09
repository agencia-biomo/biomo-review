import { test, expect, Page } from '@playwright/test';

// Helper function to wait for page to be ready
async function waitForPageReady(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  // Wait for React hydration
  await page.waitForFunction(() => {
    return document.querySelector('button') !== null;
  }, { timeout: 15000 });
}

test.describe('Gerenciamento de Projetos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);
  });

  test('deve exibir a página inicial com título correto', async ({ page }) => {
    await expect(page.getByText('Biomo Review')).toBeVisible();
    await expect(page.getByText('Meus Projetos')).toBeVisible();
  });

  test('deve exibir botão de novo projeto', async ({ page }) => {
    await expect(page.getByRole('button', { name: /novo projeto/i })).toBeVisible();
  });

  test('deve abrir modal de criação de projeto', async ({ page }) => {
    const novoProjetoBtn = page.getByRole('button', { name: /novo projeto/i });
    await expect(novoProjetoBtn).toBeVisible();
    await novoProjetoBtn.click();

    await expect(page.getByRole('heading', { name: 'Novo Projeto' })).toBeVisible();
    await expect(page.getByLabel(/nome do cliente/i)).toBeVisible();
    await expect(page.getByLabel(/url do site/i)).toBeVisible();
  });

  test('deve validar campos obrigatórios ao criar projeto', async ({ page }) => {
    await page.getByRole('button', { name: /novo projeto/i }).click();
    await expect(page.getByRole('heading', { name: 'Novo Projeto' })).toBeVisible();

    await page.getByRole('button', { name: /criar projeto/i }).click();

    await expect(page.getByText(/nome do cliente é obrigatório/i)).toBeVisible();
  });

  test('deve criar um novo projeto com sucesso', async ({ page }) => {
    await page.getByRole('button', { name: /novo projeto/i }).click();
    await expect(page.getByLabel(/nome do cliente/i)).toBeVisible();

    await page.getByLabel(/nome do cliente/i).fill('Cliente Teste E2E');
    await page.getByLabel(/url do site/i).fill('https://example.com');

    await page.getByRole('button', { name: /criar projeto/i }).click();

    await expect(page.getByText('Cliente Teste E2E')).toBeVisible();
  });

  test('deve filtrar projetos pela busca', async ({ page }) => {
    // Criar um projeto primeiro
    await page.getByRole('button', { name: /novo projeto/i }).click();
    await expect(page.getByLabel(/nome do cliente/i)).toBeVisible();

    await page.getByLabel(/nome do cliente/i).fill('Projeto Busca Teste');
    await page.getByLabel(/url do site/i).fill('https://busca-teste.com');
    await page.getByRole('button', { name: /criar projeto/i }).click();

    await expect(page.getByText('Projeto Busca Teste')).toBeVisible();

    // Buscar
    await page.getByPlaceholder(/buscar projetos/i).fill('Busca Teste');

    await expect(page.getByText('Projeto Busca Teste')).toBeVisible();
  });

  test('deve fechar modal ao clicar em cancelar', async ({ page }) => {
    await page.getByRole('button', { name: /novo projeto/i }).click();
    await expect(page.getByRole('heading', { name: 'Novo Projeto' })).toBeVisible();

    await page.getByRole('button', { name: /cancelar/i }).click();

    await expect(page.getByRole('heading', { name: 'Novo Projeto' })).not.toBeVisible();
  });
});

test.describe('Visualizador de Projeto', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    // Criar um projeto primeiro
    await page.getByRole('button', { name: /novo projeto/i }).click();
    await expect(page.getByLabel(/nome do cliente/i)).toBeVisible();

    await page.getByLabel(/nome do cliente/i).fill('Projeto Viewer Teste');
    await page.getByLabel(/url do site/i).fill('https://example.com');
    await page.getByRole('button', { name: /criar projeto/i }).click();

    await expect(page.getByText('Projeto Viewer Teste')).toBeVisible();
  });

  test('deve abrir o viewer ao clicar no projeto', async ({ page }) => {
    // Clicar no nome do projeto no card
    await page.getByText('Projeto Viewer Teste').first().click();

    // Verificar elementos do viewer
    await expect(page.getByRole('button', { name: /voltar/i })).toBeVisible();
  });

  test('deve exibir timeline de feedbacks', async ({ page }) => {
    await page.getByText('Projeto Viewer Teste').first().click();

    await expect(page.getByText(/alterações/i)).toBeVisible();
  });

  test('deve voltar para lista de projetos', async ({ page }) => {
    await page.getByText('Projeto Viewer Teste').first().click();

    await expect(page.getByRole('button', { name: /voltar/i })).toBeVisible();
    await page.getByRole('button', { name: /voltar/i }).click();

    await expect(page.getByText('Meus Projetos')).toBeVisible();
  });
});
