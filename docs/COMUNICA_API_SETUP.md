# Configuração da Comunica API (PJE)

## Visão Geral

A Comunica API é a API oficial do Conselho Nacional de Justiça (CNJ) para consulta de comunicações processuais do Processo Judicial Eletrônico (PJE). Esta é uma fonte oficial e confiável para monitoramento de publicações judiciais.

## URLs dos Ambientes

- **Produção (Real)**: `https://comunicaapi.pje.jus.br/api/v1`
- **Homologação (Teste)**: `https://hcomunicaapi.cnj.jus.br/api/v1`

## Como Obter Credenciais

### 1. Solicitação de Acesso

Para obter acesso à Comunica API, é necessário:

1. **Administrador Regional do Tribunal** deve preencher o formulário de solicitação
2. Acessar o site oficial do CNJ: [https://www.cnj.jus.br/programas-e-acoes/processo-judicial-eletronico-pje/comunicacoes-processuais/orientacoes-aos-tribunais/](https://www.cnj.jus.br/programas-e-acoes/processo-judicial-eletronico-pje/comunicacoes-processuais/orientacoes-aos-tribunais/)
3. Seguir as orientações específicas para tribunais

### 2. Documentação Necessária

- Identificação da instituição jurídica
- Dados do responsável técnico
- Justificativa para uso da API
- Número OAB dos advogados que utilizarão o sistema

### 3. Processo de Aprovação

- O CNJ analisa a solicitação
- Credenciais são fornecidas após aprovação
- Acesso inicial pode ser liberado primeiro em homologação

## Configuração no Freelaw AI Studio

### Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env.local`:

```bash
# Comunica API (PJE Oficial)
COMUNICA_API_USERNAME="seu_usuario_aqui"
COMUNICA_API_PASSWORD="sua_senha_aqui"
```

### Parâmetros Suportados

A integração suporta os seguintes parâmetros de busca:

- **numeroOab**: Número da OAB (obrigatório)
- **siglaUfOab**: UF da OAB (obrigatório)
- **dataInicio**: Data inicial (formato: YYYY-MM-DD)
- **dataFim**: Data final (formato: YYYY-MM-DD)
- **tribunal**: Código do tribunal
- **numeroProcesso**: Número específico do processo
- **tipoMovimento**: Tipo de movimentação processual
- **tamanho**: Quantidade de resultados por página (padrão: 100)
- **pagina**: Página dos resultados (para paginação)

## Estrutura de Dados

### Resposta da API

```json
{
  "content": [
    {
      "id": "string",
      "numeroProcesso": "string",
      "tribunal": "string",
      "orgaoJudicial": "string",
      "dataPublicacao": "YYYY-MM-DD",
      "conteudo": "string",
      "texto": "string",
      "teor": "string",
      "tipoMovimento": "string",
      "destinatarios": ["string"],
      "partes": ["string"],
      "advogados": ["string"],
      "prazoDias": "number",
      "urgente": "boolean"
    }
  ],
  "totalElements": "number",
  "hasNext": "boolean"
}
```

### Mapeamento para Freelaw

O serviço mapeia automaticamente os campos da Comunica API para a estrutura interna:

- `numeroProcesso` → `numero_processo`
- `dataPublicacao` → `data_publicacao`
- `tipoMovimento` → `tipo_movimento`
- `advogados` → `advogados_mencionados`
- `prazoDias` → `prazo_dias`

## Funcionalidades Implementadas

### 1. Busca de Publicações
- Busca por OAB e filtros diversos
- Paginação automática
- Tratamento de erros robusto

### 2. Extração Inteligente
- **Processos**: Extrai dados dos processos automaticamente
- **Clientes**: Identifica e cria clientes baseado nas partes
- **Prazos**: Detecta prazos no conteúdo das publicações
- **Urgências**: Identifica publicações urgentes por palavras-chave

### 3. Processamento Automático
- Criação automática de processos no sistema
- Cadastro automático de clientes
- Atualização de movimentações existentes
- Sistema de status (nova/lida/processada)

## Benefícios da Integração

### 1. Dados Oficiais
- Fonte oficial do CNJ
- Dados sempre atualizados
- Cobertura nacional (todos os tribunais)

### 2. Automação Completa
- Monitoramento automático de publicações
- Extração automática de dados
- Criação automática de processos e clientes

### 3. Gestão de Prazos
- Identificação automática de prazos
- Sistema de alertas por urgência
- Dashboard de publicações urgentes

## Troubleshooting

### Erros Comuns

1. **Credenciais Inválidas**
   ```
   Erro: Comunica API error: 401 Unauthorized
   ```
   - Verificar username/password nas variáveis de ambiente
   - Confirmar se as credenciais são válidas para produção

2. **Permissões Insuficientes**
   ```
   Erro: Comunica API error: 403 Forbidden
   ```
   - Verificar se o usuário tem permissão para o tribunal específico
   - Entrar em contato com o CNJ para revisar permissões

3. **Rate Limiting**
   ```
   Erro: Comunica API error: 429 Too Many Requests
   ```
   - Implementar delay entre requisições
   - Reduzir frequência de consultas

### Logs e Monitoramento

O serviço registra automaticamente:
- Todas as requisições à API
- Erros de integração
- Estatísticas de uso
- Performance das consultas

### Contato para Suporte

- **CNJ - Suporte Técnico**: Através do portal oficial
- **Documentação**: [CNJ - Comunicações Processuais](https://www.cnj.jus.br/programas-e-acoes/processo-judicial-eletronico-pje/comunicacoes-processuais/)

## Próximos Passos

1. **Obter credenciais** através do processo oficial do CNJ
2. **Configurar variáveis** de ambiente
3. **Testar integração** com dados reais
4. **Configurar monitoramento** automático
5. **Treinar equipe** no uso da nova funcionalidade




