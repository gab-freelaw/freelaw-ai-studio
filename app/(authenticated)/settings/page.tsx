'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layouts/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingButton } from '@/components/ui/loading-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Lock, 
  Bell, 
  Palette, 
  Globe, 
  Shield, 
  CreditCard,
  Building,
  Settings2,
  Save,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Moon,
  Sun,
  Monitor
} from 'lucide-react'
import { toast } from 'sonner'

interface UserSettings {
  profile: {
    name: string
    email: string
    phone: string
    oab: string
    uf: string
    avatar?: string
  }
  office: {
    name: string
    cnpj: string
    address: string
    city: string
    state: string
    zipCode: string
    phone: string
    email: string
  }
  preferences: {
    theme: 'light' | 'dark' | 'system'
    language: string
    notifications: {
      email: boolean
      push: boolean
      sms: boolean
      whatsapp: boolean
    }
    ai: {
      model: string
      temperature: number
      autoSave: boolean
      streamResponses: boolean
    }
  }
  security: {
    twoFactor: boolean
    sessionTimeout: number
    ipRestriction: boolean
    allowedIps: string[]
  }
  billing: {
    plan: 'free' | 'pro' | 'enterprise'
    status: 'active' | 'inactive' | 'suspended'
    nextBilling: string
    paymentMethod?: string
  }
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<UserSettings>({
    profile: {
      name: 'Dr. João Silva',
      email: 'joao.silva@exemplo.com',
      phone: '(11) 99999-9999',
      oab: '123456',
      uf: 'SP'
    },
    office: {
      name: 'Silva & Associados Advocacia',
      cnpj: '12.345.678/0001-90',
      address: 'Av. Paulista, 1000',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01311-100',
      phone: '(11) 3333-3333',
      email: 'contato@silvaadvocacia.com.br'
    },
    preferences: {
      theme: 'system',
      language: 'pt-BR',
      notifications: {
        email: true,
        push: true,
        sms: false,
        whatsapp: true
      },
      ai: {
        model: 'gpt-4',
        temperature: 0.7,
        autoSave: true,
        streamResponses: true
      }
    },
    security: {
      twoFactor: false,
      sessionTimeout: 30,
      ipRestriction: false,
      allowedIps: []
    },
    billing: {
      plan: 'pro',
      status: 'active',
      nextBilling: '2025-10-04',
      paymentMethod: '**** **** **** 1234'
    }
  })

  const handleSave = async (section?: string) => {
    setSaving(true)
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success(section ? `${section} atualizado com sucesso!` : 'Configurações salvas!')
    } catch (error) {
      toast.error('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setSettings(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        theme
      }
    }))
    
    // Aplicar tema imediatamente
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      // System preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.classList.toggle('dark', isDark)
    }
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-freelaw-white via-white to-freelaw-purple/5">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-freelaw-purple/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-purple rounded-2xl">
                  <Settings2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-tech-blue">Configurações</h1>
                  <p className="text-lg text-tech-blue-light mt-1">
                    Gerencie suas preferências e configurações do sistema
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => handleSave()}
                disabled={saving}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                Salvar Tudo
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="profile" className="gap-2">
                <User className="w-4 h-4" />
                Perfil
              </TabsTrigger>
              <TabsTrigger value="office" className="gap-2">
                <Building className="w-4 h-4" />
                Escritório
              </TabsTrigger>
              <TabsTrigger value="preferences" className="gap-2">
                <Settings2 className="w-4 h-4" />
                Preferências
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2">
                <Shield className="w-4 h-4" />
                Segurança
              </TabsTrigger>
              <TabsTrigger value="billing" className="gap-2">
                <CreditCard className="w-4 h-4" />
                Plano
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Pessoais</CardTitle>
                  <CardDescription>
                    Atualize suas informações pessoais e profissionais
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input 
                        id="name" 
                        value={settings.profile.name}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          profile: { ...prev.profile, name: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email"
                        value={settings.profile.email}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          profile: { ...prev.profile, email: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input 
                        id="phone" 
                        value={settings.profile.phone}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          profile: { ...prev.profile, phone: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="oab">OAB</Label>
                      <div className="flex gap-2">
                        <Input 
                          id="oab" 
                          value={settings.profile.oab}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            profile: { ...prev.profile, oab: e.target.value }
                          }))}
                          className="flex-1"
                        />
                        <Select 
                          value={settings.profile.uf}
                          onValueChange={(value) => setSettings(prev => ({
                            ...prev,
                            profile: { ...prev.profile, uf: value }
                          }))}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SP">SP</SelectItem>
                            <SelectItem value="RJ">RJ</SelectItem>
                            <SelectItem value="MG">MG</SelectItem>
                            <SelectItem value="RS">RS</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <LoadingButton 
                      onClick={() => handleSave('Perfil')}
                      loadingText="Salvando..."
                      loadingKey="save-profile"
                    >
                      Salvar Perfil
                    </LoadingButton>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Office Tab */}
            <TabsContent value="office" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dados do Escritório</CardTitle>
                  <CardDescription>
                    Configure as informações do seu escritório
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="office-name">Nome do Escritório</Label>
                      <Input 
                        id="office-name" 
                        value={settings.office.name}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          office: { ...prev.office, name: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ</Label>
                      <Input 
                        id="cnpj" 
                        value={settings.office.cnpj}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          office: { ...prev.office, cnpj: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="address">Endereço</Label>
                      <Input 
                        id="address" 
                        value={settings.office.address}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          office: { ...prev.office, address: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">Cidade</Label>
                      <Input 
                        id="city" 
                        value={settings.office.city}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          office: { ...prev.office, city: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">Estado</Label>
                      <Input 
                        id="state" 
                        value={settings.office.state}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          office: { ...prev.office, state: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <LoadingButton 
                      onClick={() => handleSave('Escritório')}
                      loadingText="Salvando..."
                      loadingKey="save-office"
                    >
                      Salvar Escritório
                    </LoadingButton>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Aparência</CardTitle>
                  <CardDescription>Personalize a interface do sistema</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Tema</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={settings.preferences.theme === 'light' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleThemeChange('light')}
                      >
                        <Sun className="w-4 h-4 mr-2" />
                        Claro
                      </Button>
                      <Button
                        variant={settings.preferences.theme === 'dark' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleThemeChange('dark')}
                      >
                        <Moon className="w-4 h-4 mr-2" />
                        Escuro
                      </Button>
                      <Button
                        variant={settings.preferences.theme === 'system' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleThemeChange('system')}
                      >
                        <Monitor className="w-4 h-4 mr-2" />
                        Sistema
                      </Button>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-medium">Notificações</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email-notif">Email</Label>
                        <Switch 
                          id="email-notif"
                          checked={settings.preferences.notifications.email}
                          onCheckedChange={(checked) => setSettings(prev => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              notifications: {
                                ...prev.preferences.notifications,
                                email: checked
                              }
                            }
                          }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="push-notif">Push</Label>
                        <Switch 
                          id="push-notif"
                          checked={settings.preferences.notifications.push}
                          onCheckedChange={(checked) => setSettings(prev => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              notifications: {
                                ...prev.preferences.notifications,
                                push: checked
                              }
                            }
                          }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="whatsapp-notif">WhatsApp</Label>
                        <Switch 
                          id="whatsapp-notif"
                          checked={settings.preferences.notifications.whatsapp}
                          onCheckedChange={(checked) => setSettings(prev => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              notifications: {
                                ...prev.preferences.notifications,
                                whatsapp: checked
                              }
                            }
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-medium">Inteligência Artificial</h4>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="ai-model">Modelo Preferido</Label>
                        <Select 
                          value={settings.preferences.ai.model}
                          onValueChange={(value) => setSettings(prev => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              ai: {
                                ...prev.preferences.ai,
                                model: value
                              }
                            }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gpt-4">GPT-4 (Mais preciso)</SelectItem>
                            <SelectItem value="gpt-3.5">GPT-3.5 (Mais rápido)</SelectItem>
                            <SelectItem value="claude">Claude (Equilibrado)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auto-save">Auto-save</Label>
                        <Switch 
                          id="auto-save"
                          checked={settings.preferences.ai.autoSave}
                          onCheckedChange={(checked) => setSettings(prev => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              ai: {
                                ...prev.preferences.ai,
                                autoSave: checked
                              }
                            }
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Segurança</CardTitle>
                  <CardDescription>
                    Proteja sua conta com recursos de segurança avançados
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="space-y-1">
                      <Label>Autenticação de Dois Fatores</Label>
                      <p className="text-sm text-muted-foreground">
                        Adicione uma camada extra de segurança
                      </p>
                    </div>
                    <Switch 
                      checked={settings.security.twoFactor}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        security: {
                          ...prev.security,
                          twoFactor: checked
                        }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="session-timeout">Tempo de Sessão (minutos)</Label>
                    <Input 
                      id="session-timeout" 
                      type="number"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        security: {
                          ...prev.security,
                          sessionTimeout: parseInt(e.target.value)
                        }
                      }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="space-y-1">
                      <Label>Restrição por IP</Label>
                      <p className="text-sm text-muted-foreground">
                        Permita acesso apenas de IPs específicos
                      </p>
                    </div>
                    <Switch 
                      checked={settings.security.ipRestriction}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        security: {
                          ...prev.security,
                          ipRestriction: checked
                        }
                      }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Plano Atual</CardTitle>
                  <CardDescription>
                    Gerencie sua assinatura e método de pagamento
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-6 bg-gradient-purple text-white rounded-xl">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-2xl font-bold">Plano Pro</h3>
                        <Badge className="bg-white/20 text-white">Ativo</Badge>
                      </div>
                      <p className="text-white/80">
                        Acesso completo a todas as funcionalidades
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold">R$ 199</p>
                      <p className="text-white/80">/mês</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Próxima cobrança</Label>
                      <p className="text-lg font-medium">{settings.billing.nextBilling}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Método de pagamento</Label>
                      <p className="text-lg font-medium">{settings.billing.paymentMethod}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium">Recursos Incluídos</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Petições ilimitadas</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">1000 consultas de IA/mês</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">10GB de armazenamento</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Suporte prioritário</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1">
                      Alterar Plano
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Atualizar Pagamento
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AppLayout>
  )
}