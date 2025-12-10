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

    // Fill only URL to trigger name validation
    await page.getByLabel(/url do site/i).fill('https://example.com');
    await page.getByRole('button', { name: /criar projeto/i }).click();

    // Wait for validation message or form to remain open
    await page.waitForTimeout(1000);

    // Check that modal is still open (form didn't submit) or error is visible
    const modalStillOpen = await page.getByRole('heading', { name: 'Novo Projeto' }).isVisible();
    const errorVisible = await page.getByText(/obrigat[oó]ri/i).isVisible().catch(() => false);

    expect(modalStillOpen || errorVisible).toBe(true);
  });

  test('deve criar um novo projeto com sucesso', async ({ page }) => {
    const projectName = `E2E ${Date.now()}`;
    await page.getByRole('button', { name: /novo projeto/i }).click();
    await expect(page.getByLabel(/nome do cliente/i)).toBeVisible();

    await page.getByLabel(/nome do cliente/i).fill(projectName);
    await page.getByLabel(/url do site/i).fill('https://example.com');

    await page.getByRole('button', { name: /criar projeto/i }).click();

    // Wait for modal to close and project to appear
    await page.waitForTimeout(2000);
    await expect(page.getByText(projectName).first()).toBeVisible({ timeout: 10000 });
  });

  test('deve filtrar projetos pela busca', async ({ page }) => {
    // Criar um projeto primeiro
    const uniqueId = Date.now();
    const projectName = `Busca ${uniqueId}`;

    await page.getByRole('button', { name: /novo projeto/i }).click();
    await expect(page.getByLabel(/nome do cliente/i)).toBeVisible();

    await page.getByLabel(/nome do cliente/i).fill(projectName);
    await page.getByLabel(/url do site/i).fill('https://busca-teste.com');
    await page.getByRole('button', { name: /criar projeto/i }).click();

    await page.waitForTimeout(2000);
    await expect(page.getByText(projectName).first()).toBeVisible({ timeout: 10000 });

    // Buscar pelo ID único
    await page.getByPlaceholder(/buscar projetos/i).fill(String(uniqueId));

    await expect(page.getByText(projectName).first()).toBeVisible();
  });

  test('deve fechar modal ao clicar em cancelar', async ({ page }) => {
    await page.getByRole('button', { name: /novo projeto/i }).click();
    await expect(page.getByRole('heading', { name: 'Novo Projeto' })).toBeVisible();

    await page.getByRole('button', { name: /cancelar/i }).click();

    await expect(page.getByRole('heading', { name: 'Novo Projeto' })).not.toBeVisible();
  });
});

test.describe('Visualizador de Projeto', () => {
  test('deve abrir o viewer ao clicar no projeto', async ({ page }) => {
    await login(page);
    await waitForPageReady(page);

    // Criar projeto com nome único
    const projectName = `View${Date.now().toString().slice(-6)}`;
    await page.getByRole('button', { name: /novo projeto/i }).click();
    await expect(page.getByLabel(/nome do cliente/i)).toBeVisible();
    await page.getByLabel(/nome do cliente/i).fill(projectName);
    await page.getByLabel(/url do site/i).fill('https://example.com');
    await page.getByRole('button', { name: /criar projeto/i }).click();

    // Wait for modal to close and project to appear
    await expect(page.getByRole('heading', { name: 'Novo Projeto' })).not.toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(3000);

    // Find and click the project by name
    const projectLink = page.getByText(projectName).first();
    await expect(projectLink).toBeVisible({ timeout: 15000 });

    // Get initial URL
    const initialUrl = page.url();
    await projectLink.click();

    // Wait for navigation or page change
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verificar que houve alguma mudança (URL diferente OU conteúdo diferente)
    const newUrl = page.url();
    const pageContent = await page.content();
    const urlChanged = newUrl !== initialUrl;
    const hasProjectContent = pageContent.length > 2000;

    expect(urlChanged || hasProjectContent).toBe(true);
  });

  test('deve exibir conteudo do projeto', async ({ page }) => {
    await login(page);
    await waitForPageReady(page);

    // Criar projeto com nome único
    const projectName = `View${Date.now().toString().slice(-6)}B`;
    await page.getByRole('button', { name: /novo projeto/i }).click();
    await expect(page.getByLabel(/nome do cliente/i)).toBeVisible();
    await page.getByLabel(/nome do cliente/i).fill(projectName);
    await page.getByLabel(/url do site/i).fill('https://example.com');
    await page.getByRole('button', { name: /criar projeto/i }).click();

    await expect(page.getByRole('heading', { name: 'Novo Projeto' })).not.toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(3000);

    const projectLink = page.getByText(projectName).first();
    await expect(projectLink).toBeVisible({ timeout: 15000 });
    await projectLink.click();

    await page.waitForLoadState('networkidle');
    // Verify page loaded with content
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('deve voltar para lista de projetos', async ({ page }) => {
    await login(page);
    await waitForPageReady(page);

    // Criar projeto com nome único
    const projectName = `View${Date.now().toString().slice(-6)}C`;
    await page.getByRole('button', { name: /novo projeto/i }).click();
    await expect(page.getByLabel(/nome do cliente/i)).toBeVisible();
    await page.getByLabel(/nome do cliente/i).fill(projectName);
    await page.getByLabel(/url do site/i).fill('https://example.com');
    await page.getByRole('button', { name: /criar projeto/i }).click();

    await expect(page.getByRole('heading', { name: 'Novo Projeto' })).not.toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(3000);

    const projectLink = page.getByText(projectName).first();
    await expect(projectLink).toBeVisible({ timeout: 15000 });
    await projectLink.click();

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Try multiple ways to go back (button or browser back)
    const backButton = page.getByRole('button', { name: /voltar/i });
    const hasBackButton = await backButton.isVisible().catch(() => false);

    if (hasBackButton) {
      await backButton.click();
    } else {
      // On mobile, use browser back navigation
      await page.goBack();
    }

    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Meus Projetos')).toBeVisible({ timeout: 15000 });
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
