import { test, expect } from '@playwright/test';

test.describe('API de Projetos', () => {
  test('GET /api/projects - deve retornar lista de projetos', async ({ request }) => {
    const response = await request.get('/api/projects');

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.projects)).toBe(true);
  });

  test('POST /api/projects - deve criar um novo projeto', async ({ request }) => {
    const response = await request.post('/api/projects', {
      data: {
        name: 'Projeto API Teste',
        siteUrl: 'https://api-teste.com',
        description: 'Criado via teste de API',
      },
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.projectId).toBeDefined();
    expect(data.publicAccessToken).toBeDefined();
  });

  test('POST /api/projects - deve validar campos obrigatórios', async ({ request }) => {
    const response = await request.post('/api/projects', {
      data: {
        description: 'Sem campos obrigatórios',
      },
    });

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data.error).toContain('Missing required fields');
  });

  test('GET /api/projects/[id] - deve retornar projeto específico', async ({ request }) => {
    // Primeiro criar um projeto
    const createResponse = await request.post('/api/projects', {
      data: {
        name: 'Projeto Para Busca',
        siteUrl: 'https://busca.com',
      },
    });

    const { projectId } = await createResponse.json();

    // Buscar o projeto
    const response = await request.get(`/api/projects/${projectId}`);

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.project.name).toBe('Projeto Para Busca');
  });

  test('PATCH /api/projects/[id] - deve atualizar projeto', async ({ request }) => {
    // Criar projeto
    const createResponse = await request.post('/api/projects', {
      data: {
        name: 'Projeto Original',
        siteUrl: 'https://original.com',
      },
    });

    const { projectId } = await createResponse.json();

    // Atualizar
    const updateResponse = await request.patch(`/api/projects/${projectId}`, {
      data: {
        name: 'Projeto Atualizado',
        status: 'completed',
      },
    });

    expect(updateResponse.ok()).toBeTruthy();

    const data = await updateResponse.json();
    expect(data.success).toBe(true);
  });

  test('DELETE /api/projects/[id] - deve remover projeto', async ({ request }) => {
    // Criar projeto
    const createResponse = await request.post('/api/projects', {
      data: {
        name: 'Projeto Para Deletar',
        siteUrl: 'https://deletar.com',
      },
    });

    const { projectId } = await createResponse.json();

    // Deletar
    const deleteResponse = await request.delete(`/api/projects/${projectId}`);

    expect(deleteResponse.ok()).toBeTruthy();

    const data = await deleteResponse.json();
    expect(data.success).toBe(true);

    // Verificar que não existe mais
    const getResponse = await request.get(`/api/projects/${projectId}`);
    expect(getResponse.status()).toBe(404);
  });
});

test.describe('API de Feedbacks', () => {
  let projectId: string;

  test.beforeEach(async ({ request }) => {
    // Criar um projeto para os testes de feedback
    const response = await request.post('/api/projects', {
      data: {
        name: 'Projeto Feedback Teste',
        siteUrl: 'https://feedback-teste.com',
      },
    });

    const data = await response.json();
    projectId = data.projectId;
  });

  test('GET /api/feedbacks - deve retornar feedbacks do projeto', async ({ request }) => {
    const response = await request.get(`/api/feedbacks?projectId=${projectId}`);

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.feedbacks)).toBe(true);
  });

  test('POST /api/feedbacks - deve criar um novo feedback', async ({ request }) => {
    const response = await request.post('/api/feedbacks', {
      data: {
        projectId,
        title: 'Feedback de Teste',
        description: 'Descrição do feedback de teste',
        priority: 'medium',
        clickPosition: { x: 100, y: 200, pageUrl: 'https://example.com' },
        createdBy: 'teste',
      },
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.feedbackId).toBeDefined();
  });

  test('POST /api/feedbacks - deve validar campos obrigatórios', async ({ request }) => {
    const response = await request.post('/api/feedbacks', {
      data: {
        title: 'Sem projeto ID',
      },
    });

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data.error).toContain('Missing required fields');
  });

  test('PATCH /api/feedbacks/[id] - deve atualizar status do feedback', async ({ request }) => {
    // Criar feedback
    const createResponse = await request.post('/api/feedbacks', {
      data: {
        projectId,
        title: 'Feedback Para Atualizar',
        description: 'Teste',
        priority: 'low',
        clickPosition: { x: 50, y: 50, pageUrl: 'https://example.com' },
        createdBy: 'teste',
      },
    });

    const { feedbackId } = await createResponse.json();

    // Atualizar
    const updateResponse = await request.patch(`/api/feedbacks/${feedbackId}`, {
      data: {
        status: 'in_progress',
        priority: 'high',
      },
    });

    expect(updateResponse.ok()).toBeTruthy();

    const data = await updateResponse.json();
    expect(data.success).toBe(true);
  });
});
