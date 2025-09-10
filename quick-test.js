#!/usr/bin/env node

// Teste rápido e direto da aplicação
const http = require('http');

console.log('🔍 Testando Freelaw AI Studio...\n');

// Função para fazer requisição HTTP simples
function makeRequest(path, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout após ${timeout}ms`));
    }, timeout);

    const req = http.get(`http://localhost:3000${path}`, (res) => {
      clearTimeout(timer);
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data.length > 1000 ? data.substring(0, 1000) + '...' : data
        });
      });
    });

    req.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

// Lista de testes
const tests = [
  { name: 'Homepage', path: '/' },
  { name: 'Health API', path: '/api/health' },
  { name: 'Login Page', path: '/login' },
  { name: 'Provider Portal', path: '/portal-prestador' },
  { name: 'Chat Page', path: '/chat' }
];

async function runTests() {
  const results = [];
  
  for (const test of tests) {
    process.stdout.write(`⏱️  ${test.name.padEnd(15)} `);
    
    try {
      const start = Date.now();
      const result = await makeRequest(test.path, 10000);
      const duration = Date.now() - start;
      
      if (result.status === 200) {
        console.log(`✅ ${duration}ms`);
        results.push({ ...test, status: 'PASS', duration, httpStatus: result.status });
      } else {
        console.log(`⚠️  ${duration}ms (HTTP ${result.status})`);
        results.push({ ...test, status: 'WARN', duration, httpStatus: result.status });
      }
    } catch (error) {
      console.log(`❌ ${error.message}`);
      results.push({ ...test, status: 'FAIL', error: error.message });
    }
  }
  
  // Resumo
  console.log('\n📊 RESUMO:');
  console.log('====================');
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const warned = results.filter(r => r.status === 'WARN').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  
  console.log(`✅ Passou: ${passed}/${tests.length}`);
  console.log(`⚠️  Avisos: ${warned}/${tests.length}`);
  console.log(`❌ Falhou: ${failed}/${tests.length}`);
  
  if (failed > 0) {
    console.log('\n❌ FALHAS:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`   • ${r.name}: ${r.error}`);
    });
  }
  
  if (warned > 0) {
    console.log('\n⚠️  AVISOS:');
    results.filter(r => r.status === 'WARN').forEach(r => {
      console.log(`   • ${r.name}: HTTP ${r.httpStatus} em ${r.duration}ms`);
    });
  }
  
  // Análise de performance
  const avgTime = results
    .filter(r => r.duration)
    .reduce((sum, r) => sum + r.duration, 0) / results.filter(r => r.duration).length;
    
  console.log(`\n⚡ Tempo médio de resposta: ${Math.round(avgTime)}ms`);
  
  if (avgTime > 3000) {
    console.log('🐌 APLICAÇÃO MUITO LENTA! Investigate:');
    console.log('   • Database queries');
    console.log('   • External API calls'); 
    console.log('   • Large bundles');
  } else if (avgTime > 1000) {
    console.log('🙄 Aplicação um pouco lenta, mas aceitável');
  } else {
    console.log('🚀 Aplicação rápida!');
  }
  
  console.log('\n🎯 PRÓXIMOS PASSOS:');
  if (failed === 0 && warned === 0) {
    console.log('   ✅ Aplicação funcionando! Pode executar testes Playwright');
  } else {
    console.log('   🔧 Corrigir problemas antes de executar testes completos');
  }
}

// Verificar se servidor está rodando
console.log('🔍 Verificando se servidor está rodando...');
makeRequest('/', 2000)
  .then(() => {
    console.log('✅ Servidor detectado! Iniciando testes...\n');
    runTests();
  })
  .catch(() => {
    console.log('❌ Servidor não está rodando!');
    console.log('💡 Execute: npm run dev');
    process.exit(1);
  });