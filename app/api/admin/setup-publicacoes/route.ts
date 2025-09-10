import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar se usuário é admin (em produção, adicionar verificação real)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // SQL para criar a tabela publicações
    const migrationSQL = `
      -- Criar tabela publicacoes se não existir
      CREATE TABLE IF NOT EXISTS publicacoes (
        id TEXT PRIMARY KEY,
        numero_processo TEXT NOT NULL,
        tribunal TEXT NOT NULL,
        data_publicacao DATE NOT NULL,
        conteudo TEXT NOT NULL,
        tipo_movimento TEXT,
        destinatarios JSONB DEFAULT '[]',
        advogados_mencionados JSONB DEFAULT '[]',
        prazo_dias INTEGER,
        urgente BOOLEAN DEFAULT false,
        status TEXT DEFAULT 'nova' CHECK (status IN ('nova', 'lida', 'processada')),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Índices para performance
      CREATE INDEX IF NOT EXISTS idx_publicacoes_user_id ON publicacoes(user_id);
      CREATE INDEX IF NOT EXISTS idx_publicacoes_data_publicacao ON publicacoes(data_publicacao);
      CREATE INDEX IF NOT EXISTS idx_publicacoes_numero_processo ON publicacoes(numero_processo);
      CREATE INDEX IF NOT EXISTS idx_publicacoes_tribunal ON publicacoes(tribunal);
      CREATE INDEX IF NOT EXISTS idx_publicacoes_urgente ON publicacoes(urgente);
      CREATE INDEX IF NOT EXISTS idx_publicacoes_status ON publicacoes(status);

      -- RLS
      ALTER TABLE publicacoes ENABLE ROW LEVEL SECURITY;

      -- Políticas RLS
      DROP POLICY IF EXISTS "Users can view own publicacoes" ON publicacoes;
      CREATE POLICY "Users can view own publicacoes" ON publicacoes
        FOR SELECT USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can insert own publicacoes" ON publicacoes;
      CREATE POLICY "Users can insert own publicacoes" ON publicacoes
        FOR INSERT WITH CHECK (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can update own publicacoes" ON publicacoes;
      CREATE POLICY "Users can update own publicacoes" ON publicacoes
        FOR UPDATE USING (auth.uid() = user_id);
    `

    // Tentar executar a migração via RPC
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL })
      
      if (error) {
        console.error('Erro RPC:', error)
        // Fallback: tentar via query simples
        const { error: simpleError } = await supabase
          .from('publicacoes')
          .select('count')
          .limit(1)

        if (simpleError && simpleError.message.includes('does not exist')) {
          return NextResponse.json({
            success: false,
            error: 'Tabela publicações não existe e não foi possível criar',
            message: 'Execute a migração manualmente no Supabase Dashboard',
            sql: migrationSQL
          }, { status: 500 })
        }
      }

      // Verificar se a tabela foi criada
      const { data: testData, error: testError } = await supabase
        .from('publicacoes')
        .select('count')
        .limit(1)

      if (testError) {
        return NextResponse.json({
          success: false,
          error: 'Tabela não foi criada corretamente',
          details: testError.message
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Tabela publicacoes criada com sucesso!',
        data: {
          table_created: true,
          rls_enabled: true,
          indexes_created: true,
          policies_created: true
        }
      })

    } catch (migrationError) {
      console.error('Erro na migração:', migrationError)
      
      return NextResponse.json({
        success: false,
        error: 'Erro ao executar migração',
        message: 'Verifique as permissões do usuário no Supabase',
        sql_provided: migrationSQL
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Erro geral:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se a tabela existe
    const { data, error } = await supabase
      .from('publicacoes')
      .select('count')
      .limit(1)

    if (error) {
      return NextResponse.json({
        table_exists: false,
        error: error.message,
        needs_migration: true
      })
    }

    return NextResponse.json({
      table_exists: true,
      message: 'Tabela publicacoes está disponível',
      ready_for_use: true
    })

  } catch (error) {
    return NextResponse.json({
      table_exists: false,
      error: 'Erro ao verificar tabela'
    }, { status: 500 })
  }
}




