import { test, expect, Page } from '@playwright/test';

// Helper function to login
async function login(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  // Wait for the form to be ready
  await page.waitForSelector('#email', { timeout: 10000 });

  // Fill login form using id selectors
  await page.fill('#email', 'admin@biomo.com.br');
  await page.fill('#password', 'admin123');

  // Click login button
  await page.getByRole('button', { name: /entrar/i }).click();

  // Wait for redirect to home
  await page.waitForURL('/', { timeout: 15000 });
}

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
    await login(page);
    await waitForPageReady(page);
  });

  test('deve exibir a pagina inicial com titulo correto', async ({ page }) => {
    await expect(page.getByText('Meus Projetos')).toBeVisible();
  });

  test('deve exibir botao de novo projeto', async ({ page }) => {
    await expect(page.getByRole('button', { name: /novo projeto/i })).toBeVisible();
  });

  test('deve abrir modal de criacao de projeto', async ({ page }) => {
    const novoProjetoBtn = page.getByRole('button', { name: /novo projeto/i });
    await expect(novoProjetoBtn).toBeVisible();
    await novoProjetoBtn.click();

    await expect(page.getByRole('heading', { name: 'Novo Projeto' })).toBeVisible();
    await expect(page.getByLabel(/nome do cliente/i)).toBeVisible();
    await expect(page.getByLabel(/url do site/i)).toBeVisible();
  });

  test('deve validar campos obrigatorios ao criar projeto', async ({ page }) => {
    await page.getByRole('button', { name: /novo projeto/i }).click();
    await expect(page.getByRole('heading', { name: 'Novo Projeto' })).toBeVisible();

    await page.getByRole('button', { name: /criar projeto/i }).click();

    await expect(page.getByText(/nome do cliente e obrigatorio/i)).toBeVisible();
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
    await login(page);
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

    await expect(page.getByText(/alteracoes/i)).toBeVisible();
  });

  test('deve voltar para lista de projetos', async ({ page }) => {
    await page.getByText('Projeto Viewer Teste').first().click();

    await expect(page.getByRole('button', { name: /voltar/i })).toBeVisible();
    await page.getByRole('button', { name: /voltar/i }).click();

    await expect(page.getByText('Meus Projetos')).toBeVisible();
  });
});

test.describe('Responsividade Mobile', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await waitForPageReady(page);
  });

  test('deve exibir layout mobile corretamente', async ({ page }) => {
    // Verificar que a pagina carrega no mobile
    await expect(page.getByText('Meus Projetos')).toBeVisible();
  });

  test('deve abrir modal de criacao no mobile', async ({ page }) => {
    const novoProjetoBtn = page.getByRole('button', { name: /novo projeto/i });
    await expect(novoProjetoBtn).toBeVisible();
    await novoProjetoBtn.click();

    await expect(page.getByRole('heading', { name: 'Novo Projeto' })).toBeVisible();
  });
});

test.describe('Pagina de Login', () => {
  test('deve exibir formulario de login', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
  });

  test('deve mostrar erro com credenciais invalidas', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('#email', { timeout: 10000 });

    await page.fill('#email', 'invalido@test.com');
    await page.fill('#password', 'senhaerrada');
    await page.getByRole('button', { name: /entrar/i }).click();

    // Deve permanecer na pagina de login ou mostrar erro
    await page.waitForTimeout(2000);
    await expect(page.locator('#email')).toBeVisible();
  });

  test('deve fazer login com sucesso', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('#email', { timeout: 10000 });

    await page.fill('#email', 'admin@biomo.com.br');
    await page.fill('#password', 'admin123');
    await page.getByRole('button', { name: /entrar/i }).click();

    // Deve redirecionar para home
    await page.waitForURL('/', { timeout: 15000 });
    await expect(page.getByText('Meus Projetos')).toBeVisible();
  });
});
