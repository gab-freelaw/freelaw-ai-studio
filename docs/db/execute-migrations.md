# 🚀 Guia de Execução das Migrations - Freelaw AI

## 📋 Migrations a Executar

### 1. Schema Base com RLS
**Arquivo:** `db/migrations/001_initial_schema_with_rls.sql`

Este arquivo cria:
- Tabelas de usuários, organizações, documentos
- Políticas de Row Level Security (RLS)
- Índices para performance
- Triggers para updated_at

### 2. Sistema de Petições
**Arquivo:** `complete-petition-migration.sql`

Este arquivo cria:
- Sistema completo de petições
- 8 tabelas específicas para petições
- Schemas para 6 tipos de petições
- Sistema de cache e templates

## 🔨 Como Executar

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse: https://supabase.com/dashboard/project/hyoiarffutenqtnotndd/sql/new

2. Execute primeiro o schema base:
   - Copie todo o conteúdo de `db/migrations/001_initial_schema_with_rls.sql`
   - Cole no SQL Editor
   - Clique em "Run"

3. Execute o sistema de petições:
   - Copie todo o conteúdo de `complete-petition-migration.sql`
   - Cole no SQL Editor
   - Clique em "Run"

### Opção 2: Via Terminal (se configurado)

```bash
# Se você tiver Supabase CLI configurado
supabase db push --db-url "postgres://postgres:2bICsPtmg4rCHKGN@db.hyoiarffutenqtnotndd.supabase.co:5432/postgres"
```

## ✅ Verificação

Execute no SQL Editor para verificar:

```sql
-- Listar todas as tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verificar políticas RLS
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verificar se os schemas de petição foram criados
SELECT COUNT(*) as total_schemas 
FROM petition_schemas;
```

## 🎯 Resultado Esperado

Após executar as migrations, você deve ter:
- ✅ 20+ tabelas criadas
- ✅ 12+ políticas RLS ativas
- ✅ 6 schemas de petição pré-configurados
- ✅ Sistema pronto para uso

## ⚠️ Troubleshooting

Se houver erros:
1. Verifique se já existem tabelas (erro "already exists" é OK)
2. Execute as migrations em partes menores
3. Verifique as credenciais do banco

