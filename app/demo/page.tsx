'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/layouts/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { notification } from '@/lib/notifications'
import { 
  useDocuments, 
  useContacts, 
  useHealthStatus,
  apiMutate,
  prefetch 
} from '@/lib/hooks/use-api'
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info,
  Download,
  RefreshCw,
  Wifi,
  WifiOff,
  Zap,
  Database
} from 'lucide-react'

export default function DemoPage() {
  const [isOnline, setIsOnline] = useState(true)
  
  // SWR Hooks em ação
  const { data: documents, error: docsError, isLoading: docsLoading } = useDocuments(1, 5)
  const { data: contacts, error: contactsError, isLoading: contactsLoading } = useContacts()
  const { data: health, error: healthError, isLoading: healthLoading } = useHealthStatus()

  // Demonstração de notificações
  const demoNotifications = {
    success: () => {
      notification.success('Operação realizada com sucesso!', {
        description: 'Seus dados foram salvos corretamente.',
        action: {
          label: 'Ver detalhes',
          onClick: () => console.log('Action clicked')
        },
        duration: 5000
      })
    },
    
    error: () => {
      notification.error('Erro ao processar solicitação', {
        description: 'Verifique sua conexão e tente novamente.',
        action: {
          label: 'Tentar novamente',
          onClick: () => console.log('Retry clicked')
        },
        important: true
      })
    },
    
    warning: () => {
      notification.warning('Atenção: Prazo se aproximando', {
        description: 'Você tem 3 dias para enviar a contestação.',
        persist: true,
        action: {
          label: 'Ver prazo',
          onClick: () => window.location.href = '/deadlines'
        }
      })
    },
    
    info: () => {
      notification.info('Nova atualização disponível', {
        description: 'Clique para atualizar a aplicação.',
        action: {
          label: 'Atualizar',
          onClick: () => window.location.reload()
        }
      })
    },
    
    loading: () => {
      const id = notification.loading('Processando documento...', {
        description: 'Isso pode levar alguns segundos'
      })
      
      setTimeout(() => {
        notification.dismiss(id)
        notification.success('Documento processado!')
      }, 3000)
    },
    
    promise: () => {
      const promise = new Promise((resolve) => {
        setTimeout(() => resolve('Dados carregados!'), 2000)
      })
      
      notification.promise(promise, {
        loading: 'Carregando dados...',
        success: 'Dados carregados com sucesso!',
        error: 'Erro ao carregar dados'
      })
    },
    
    legal: {
      petition: () => notification.legal.petitionCreated('Contestação Trabalhista', '123'),
      document: () => notification.legal.documentUploaded('contrato_prestacao_servicos.pdf'),
      process: () => notification.legal.processUpdated('0001234-56.2024.8.26.0100'),
      deadline: () => notification.legal.deadlineApproaching('Entregar contestação', 2),
      ai: () => notification.legal.aiResponse('Analisando jurisprudência...'),
    },
    
    browser: async () => {
      await notification.browser('Nova mensagem no chat', {
        body: 'Você recebeu uma mensagem importante do Dr. João Silva',
        action: {
          label: 'Ver mensagem',
          onClick: () => window.location.href = '/chat'
        }
      })
    },
    
    queue: () => {
      notification.queue.add('success', 'Primeira notificação')
      notification.queue.add('info', 'Segunda notificação')
      notification.queue.add('warning', 'Terceira notificação')
      notification.queue.add('success', 'Quarta notificação')
    }
  }

  // Demonstração de cache e revalidação
  const cacheDemo = {
    refresh: () => {
      apiMutate.refresh.documents()
      apiMutate.refresh.contacts()
      notification.success('Cache atualizado!', {
        description: 'Dados foram revalidados'
      })
    },
    
    prefetch: async () => {
      await prefetch.documents()
      await prefetch.contacts()
      notification.success('Dados pré-carregados!', {
        description: 'Navegação será mais rápida'
      })
    },
    
    clearCache: () => {
      apiMutate.clearAll()
      notification.warning('Cache limpo!', {
        description: 'Todos os dados em cache foram removidos'
      })
    },
    
    optimisticUpdate: async () => {
      try {
        await apiMutate.createContact({
          name: 'Cliente Exemplo',
          email: 'cliente@exemplo.com',
          phone: '(11) 99999-9999',
          tipo: 'CLIENTE'
        })
      } catch (error) {
        console.error(error)
      }
    }
  }

  // PWA Demo
  const pwaDemo = {
    install: () => {
      notification.info('PWA está pronto!', {
        description: 'Você pode instalar o app no seu dispositivo',
        action: {
          label: 'Instalar',
          onClick: () => console.log('Install PWA')
        }
      })
    },
    
    offline: () => {
      setIsOnline(!isOnline)
      if (isOnline) {
        notification.warning('Modo offline ativado', {
          description: 'Você ainda pode acessar dados em cache'
        })
      } else {
        notification.success('Conexão restaurada', {
          description: 'Sincronizando dados...'
        })
      }
    }
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Demo - Quick Wins Implementados</h1>
          <p className="text-muted-foreground">
            Demonstração das melhorias: Cache com SWR, Notificações Avançadas e PWA
          </p>
        </div>

        {/* Status de Conexão */}
        <Card className={`border-2 ${isOnline ? 'border-green-500' : 'border-yellow-500'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <Wifi className="w-5 h-5 text-green-600" />
                  Online
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-yellow-600" />
                  Offline (Cache Ativo)
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={pwaDemo.offline} variant="outline">
              Simular {isOnline ? 'Offline' : 'Online'}
            </Button>
          </CardContent>
        </Card>

        {/* Sistema de Notificações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Sistema de Notificações Avançado
            </CardTitle>
            <CardDescription>
              Notificações ricas com ações, sons e persistência
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button onClick={demoNotifications.success} className="gap-2">
                <CheckCircle className="w-4 h-4" />
                Sucesso
              </Button>
              <Button onClick={demoNotifications.error} variant="destructive" className="gap-2">
                <XCircle className="w-4 h-4" />
                Erro
              </Button>
              <Button onClick={demoNotifications.warning} variant="outline" className="gap-2">
                <AlertTriangle className="w-4 h-4" />
                Aviso
              </Button>
              <Button onClick={demoNotifications.info} variant="secondary" className="gap-2">
                <Info className="w-4 h-4" />
                Info
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <Button onClick={demoNotifications.loading} variant="outline">
                Loading
              </Button>
              <Button onClick={demoNotifications.promise} variant="outline">
                Promise
              </Button>
              <Button onClick={demoNotifications.queue} variant="outline">
                Fila
              </Button>
              <Button onClick={demoNotifications.browser} variant="outline">
                Browser
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Notificações Jurídicas:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <Button onClick={demoNotifications.legal.petition} size="sm" variant="outline">
                  Petição Criada
                </Button>
                <Button onClick={demoNotifications.legal.document} size="sm" variant="outline">
                  Doc Upload
                </Button>
                <Button onClick={demoNotifications.legal.process} size="sm" variant="outline">
                  Processo
                </Button>
                <Button onClick={demoNotifications.legal.deadline} size="sm" variant="outline">
                  Prazo
                </Button>
                <Button onClick={demoNotifications.legal.ai} size="sm" variant="outline">
                  IA Response
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cache com SWR */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Cache com SWR
            </CardTitle>
            <CardDescription>
              Dados em cache com revalidação automática
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button onClick={cacheDemo.refresh} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              <Button onClick={cacheDemo.prefetch} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Prefetch
              </Button>
              <Button onClick={cacheDemo.clearCache} variant="destructive" className="gap-2">
                <XCircle className="w-4 h-4" />
                Limpar Cache
              </Button>
              <Button onClick={cacheDemo.optimisticUpdate} variant="secondary" className="gap-2">
                <Zap className="w-4 h-4" />
                Optimistic
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Documents Status */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Documentos</CardTitle>
                </CardHeader>
                <CardContent>
                  {docsLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
                  {docsError && <p className="text-sm text-red-600">Erro ao carregar</p>}
                  {documents && (
                    <p className="text-sm text-green-600">
                      {documents.data?.length || 0} documentos em cache
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Contacts Status */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Contatos</CardTitle>
                </CardHeader>
                <CardContent>
                  {contactsLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
                  {contactsError && <p className="text-sm text-red-600">Erro ao carregar</p>}
                  {contacts && (
                    <p className="text-sm text-green-600">
                      {Array.isArray(contacts) ? contacts.length : 0} contatos em cache
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Health Status */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Health API</CardTitle>
                </CardHeader>
                <CardContent>
                  {healthLoading && <p className="text-sm text-muted-foreground">Verificando...</p>}
                  {healthError && <p className="text-sm text-red-600">API offline</p>}
                  {health && (
                    <p className={`text-sm ${
                      health.status === 'healthy' ? 'text-green-600' : 
                      health.status === 'degraded' ? 'text-yellow-600' : 
                      'text-red-600'
                    }`}>
                      Status: {health.status}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* PWA Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Progressive Web App (PWA)
            </CardTitle>
            <CardDescription>
              App instalável com suporte offline
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Features Ativas:</h3>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Service Worker registrado
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Cache offline para assets
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Manifest.json configurado
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Instalável em dispositivos
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Cache Strategy:</h3>
                <ul className="space-y-1 text-sm">
                  <li>• Fonts: Cache First (365 dias)</li>
                  <li>• Images: Stale While Revalidate</li>
                  <li>• JS/CSS: Stale While Revalidate</li>
                  <li>• API: Network First</li>
                </ul>
              </div>
            </div>
            
            <Button onClick={pwaDemo.install} className="w-full">
              Simular Instalação PWA
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}