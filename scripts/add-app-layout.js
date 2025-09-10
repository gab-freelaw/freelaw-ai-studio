const fs = require('fs');
const path = require('path');

// Páginas que precisam do AppLayout
const pagesToUpdate = [
  'deadlines',
  'knowledge',
  'contacts',
  'agenda',
  'processes',
  'publications'
];

function addAppLayoutToPage(pageName) {
  const filePath = path.join(__dirname, '..', 'app', pageName, 'page.tsx');
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Arquivo não encontrado: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Verifica se já tem AppLayout
  if (content.includes('AppLayout')) {
    console.log(`✅ ${pageName} já tem AppLayout`);
    return;
  }
  
  // Adiciona import do AppLayout
  if (!content.includes("import { AppLayout }")) {
    content = content.replace(
      "'use client'",
      `'use client'

import { AppLayout } from '@/components/layouts/app-layout'`
    );
  }
  
  // Encontra a função principal e renomeia para Content
  const functionPattern = /export default function \w+Page\(\) {/;
  content = content.replace(functionPattern, (match) => {
    const pageFunctionName = match.match(/function (\w+Page)/)[1];
    const contentFunctionName = pageFunctionName.replace('Page', 'Content');
    return `function ${contentFunctionName}() {`;
  });
  
  // Adiciona o wrapper no final
  const lastReturn = content.lastIndexOf('  )\n}');
  if (lastReturn !== -1) {
    const pageFunctionName = pageName.charAt(0).toUpperCase() + pageName.slice(1) + 'Page';
    content = content.slice(0, lastReturn + 4) + `

export default function ${pageFunctionName}() {
  return (
    <AppLayout>
      <${pageFunctionName.replace('Page', 'Content')} />
    </AppLayout>
  )
}`;
  }
  
  // Salva o arquivo atualizado
  fs.writeFileSync(filePath, content);
  console.log(`✅ ${pageName} atualizado com AppLayout`);
}

// Atualiza todas as páginas
console.log('🔄 Adicionando AppLayout às páginas...\n');
pagesToUpdate.forEach(addAppLayoutToPage);
console.log('\n✨ Concluído!');