/**
 * Script para limpar dados de teste do Firestore via API REST
 * Remove projetos criados pelos testes E2E
 *
 * Uso: node scripts/cleanup-test-data.js
 */

const BASE_URL = process.env.TEST_PROD
  ? 'https://alteracoes.biomo.com.br'
  : 'http://localhost:3000';

// Padrões de nomes de projetos de teste
const TEST_PATTERNS = [
  /^View\d+/,           // View123456, View123456B, View123456C
  /^Viewer \d+/,        // Viewer 1765361708862-3
  /^E2E \d+/,           // E2E 1234567890
  /^Busca \d+/,         // Busca 1234567890
  /^Cliente Teste/,     // Cliente Teste E2E
  /^Projeto Busca/,     // Projeto Busca Teste
  /^Projeto Viewer/,    // Projeto Viewer Teste
  /^Projeto Para Busca/,// Projeto Para Busca
  /^Projeto API Teste/, // Projeto API Teste
  /^Projeto Atualizado/,// Projeto Atualizado
  /^Projeto Feedback/,  // Projeto Feedback Teste
  /^Test\d+/,           // Test123456
  /^Teste API/,         // Teste API
];

async function cleanupTestProjects() {
  console.log(`🧹 Iniciando limpeza de dados de teste...`);
  console.log(`📍 URL: ${BASE_URL}\n`);

  // Buscar todos os projetos
  const response = await fetch(`${BASE_URL}/api/projects`);
  const data = await response.json();

  if (!data.success || !data.projects) {
    console.error('❌ Erro ao buscar projetos:', data);
    return;
  }

  const projects = data.projects;
  let deletedCount = 0;

  for (const project of projects) {
    const projectName = project.name || '';

    // Verifica se o nome do projeto corresponde a algum padrão de teste
    const isTestProject = TEST_PATTERNS.some(pattern => pattern.test(projectName));

    if (isTestProject) {
      console.log(`🗑️  Removendo projeto: "${projectName}" (${project.id})`);

      try {
        const deleteResponse = await fetch(`${BASE_URL}/api/projects/${project.id}`, {
          method: 'DELETE',
        });

        if (deleteResponse.ok) {
          deletedCount++;
        } else {
          console.error(`   ⚠️  Falha ao remover: ${deleteResponse.status}`);
        }
      } catch (error) {
        console.error(`   ⚠️  Erro:`, error.message);
      }
    }
  }

  console.log(`\n✅ Limpeza concluída!`);
  console.log(`   - Projetos removidos: ${deletedCount}`);
  console.log(`   - Total de projetos restantes: ${projects.length - deletedCount}`);
}

cleanupTestProjects()
  .then(() => {
    console.log('\n👋 Script finalizado.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
  });
