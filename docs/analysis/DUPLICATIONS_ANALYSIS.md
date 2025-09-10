# 🔍 ANÁLISE DE DUPLICAÇÕES - FREELAW AI

**Data:** 09/01/2025  
**Status:** 🔄 EM ANÁLISE

---

## 🚨 DUPLICAÇÕES IDENTIFICADAS

### **1. PÁGINAS DE LOGIN**
- ❌ `/app/login/page.tsx` (Principal)
- ❌ `/app/portal-prestador/login/page.tsx` (Duplicada)
- **Ação:** Manter apenas `/login` e redirecionar conforme perfil

### **2. PÁGINAS DE CADASTRO**
- ❌ `/app/signup/page.tsx` (Genérica - não específica)
- ❌ `/app/cadastro/prestador/page.tsx` (Duplicada)
- ❌ `/app/providers/register/page.tsx` (Duplicada)
- ❌ `/app/portal-prestador/cadastro/page.tsx` (Principal)
- ❌ `/app/portal-prestador/aplicacao/page.tsx` (Similar)
- **Ação:** Manter apenas `/portal-prestador/cadastro` e `/cadastro/escritorio`

### **3. DASHBOARDS**
- ❌ `/app/(authenticated)/dashboard/page.tsx` (Genérico)
- ❌ `/app/portal-prestador/dashboard/page.tsx` (Prestador)
- ❌ `/app/(authenticated)/prestador/page.tsx` (Prestador duplicado)
- ❌ `/app/escritorio/dashboard/page.tsx` (Escritório)
- **Ação:** Separar claramente por contexto

### **4. PÁGINAS DE PERFIL/SELEÇÃO**
- ❌ `/app/(authenticated)/selecionar-perfil/page.tsx`
- ❌ `/app/(authenticated)/office/page.tsx`
- ❌ `/app/(authenticated)/sistema-completo/page.tsx`
- **Ação:** Unificar em uma única página de seleção

---

## 📋 PLANO DE REFATORAÇÃO

### **FASE 1: AUTENTICAÇÃO**
1. **Manter:** `/app/login/page.tsx` (única página de login)
2. **Remover:** `/app/portal-prestador/login/page.tsx`
3. **Remover:** `/app/signup/page.tsx` (genérica)
4. **Redirecionar:** Login → Seleção de perfil → Cadastro específico

### **FASE 2: CADASTROS**
1. **Manter:** `/app/cadastro/escritorio/page.tsx`
2. **Manter:** `/app/portal-prestador/cadastro/page.tsx` (renomear para `/cadastro/prestador`)
3. **Remover:** `/app/cadastro/prestador/page.tsx`
4. **Remover:** `/app/providers/register/page.tsx`
5. **Remover:** `/app/portal-prestador/aplicacao/page.tsx`

### **FASE 3: DASHBOARDS**
1. **Manter:** `/app/escritorio/dashboard/page.tsx`
2. **Manter:** `/app/portal-prestador/dashboard/page.tsx`
3. **Remover:** `/app/(authenticated)/dashboard/page.tsx`
4. **Remover:** `/app/(authenticated)/prestador/page.tsx`

### **FASE 4: NAVEGAÇÃO**
1. **Criar:** Página de seleção de perfil única
2. **Remover:** Páginas de seleção duplicadas
3. **Atualizar:** Middleware de redirecionamento
4. **Atualizar:** Links e navegação

---

## 🎯 ESTRUTURA FINAL PROPOSTA

```
/
├── login/                          # Login único
├── forgot-password/               # Recuperação de senha
├── cadastro/
│   ├── escritorio/               # Cadastro escritório
│   └── prestador/                # Cadastro prestador (movido)
├── escritorio/
│   ├── dashboard/                # Dashboard escritório
│   └── delegacoes/               # Funcionalidades específicas
├── prestador/
│   ├── dashboard/                # Dashboard prestador
│   ├── avaliacao/               # Avaliação
│   └── documentos/              # Documentos
└── (authenticated)/
    ├── selecionar-perfil/        # Seleção única
    ├── settings/                 # Configurações
    └── [outras funcionalidades compartilhadas]
```

---

## ⚠️ IMPACTOS A CONSIDERAR

### **Links e Redirecionamentos**
- Atualizar todos os links internos
- Configurar redirecionamentos 301 para URLs antigas
- Atualizar middleware de autenticação

### **Componentes Compartilhados**
- Verificar componentes que dependem das páginas removidas
- Consolidar lógica duplicada
- Manter consistência de UI/UX

### **Dados e Estado**
- Verificar se há dados específicos por página
- Consolidar estados de formulários
- Manter compatibilidade com APIs

---

## 🚀 BENEFÍCIOS ESPERADOS

- ✅ **Redução de código duplicado** em ~40%
- ✅ **Navegação mais clara** e intuitiva
- ✅ **Manutenção simplificada**
- ✅ **Performance melhorada** (menos bundles)
- ✅ **UX consistente** entre fluxos
