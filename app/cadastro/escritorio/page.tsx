'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Building, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface OfficeData {
  // Dados do escritório
  officeName: string;
  cnpj: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  
  // Dados do responsável
  responsibleName: string;
  responsibleEmail: string;
  responsiblePhone: string;
  responsibleOAB: string;
  responsibleOABState: string;
  
  // Dados do escritório
  foundationYear: number;
  lawyersCount: number;
  specialties: string[];
  averageCasesPerMonth: number;
  
  // Plano escolhido
  selectedPlan: 'starter' | 'professional' | 'enterprise';
}

const LEGAL_SPECIALTIES = [
  'Cível', 'Criminal', 'Trabalhista', 'Tributário', 'Empresarial', 
  'Família', 'Administrativo', 'Previdenciário', 'Consumidor', 'Imobiliário'
];

const STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

// Funções de máscara
const maskCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .substring(0, 18);
};

const maskCEP = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{5})(\d)/, '$1-$2')
    .substring(0, 9);
};

const maskPhone = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .substring(0, 15);
};

// Função para buscar CEP
const fetchAddressByCEP = async (cep: string) => {
  const cleanCEP = cep.replace(/\D/g, '');
  if (cleanCEP.length !== 8) return null;
  
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
    const data = await response.json();
    
    if (data.erro) return null;
    
    return {
      street: data.logradouro || '',
      city: data.localidade || '',
      state: data.uf || '',
      neighborhood: data.bairro || ''
    };
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    return null;
  }
};

export default function CadastroEscritorioPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<OfficeData>>({
    selectedPlan: 'professional',
    specialties: [],
    address: {},
  });
  const router = useRouter();

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // Aqui seria a chamada para criar o escritório
      console.log('Dados do escritório:', formData);
      
      // Simular criação
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Redirecionar para dashboard do escritório
      router.push('/dashboard');
      
    } catch (error) {
      console.error('Erro ao cadastrar escritório:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof OfficeData],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleCEPChange = async (cep: string) => {
    const maskedCEP = maskCEP(cep);
    updateFormData('address.zipCode', maskedCEP);
    
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length === 8) {
      setCepLoading(true);
      const addressData = await fetchAddressByCEP(cleanCEP);
      
      if (addressData) {
        updateFormData('address.street', addressData.street);
        updateFormData('address.city', addressData.city);
        updateFormData('address.state', addressData.state);
      }
      setCepLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-6 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Building className="h-8 w-8 text-blue-600 mr-2" />
            <h1 className="text-3xl font-bold text-gray-900">Cadastro do Escritório</h1>
          </div>
          <p className="text-gray-600">
            Passo {step} de 4 - Vamos configurar seu escritório na plataforma
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3, 4].map((num) => (
            <div key={num} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= num
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step > num ? <CheckCircle className="h-4 w-4" /> : num}
              </div>
              {num < 4 && (
                <div
                  className={`w-12 h-1 ${
                    step > num ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && 'Dados do Escritório'}
              {step === 2 && 'Dados do Responsável'}
              {step === 3 && 'Especialidades e Perfil'}
              {step === 4 && 'Plano e Finalização'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Informações básicas do seu escritório'}
              {step === 2 && 'Dados do sócio responsável pela conta'}
              {step === 3 && 'Áreas de atuação e volume de trabalho'}
              {step === 4 && 'Escolha do plano e confirmação'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1: Dados do Escritório */}
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="officeName">Nome do Escritório *</Label>
                  <Input
                    id="officeName"
                    value={formData.officeName || ''}
                    onChange={(e) => updateFormData('officeName', e.target.value)}
                    placeholder="Ex: Silva & Associados Advocacia"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj || ''}
                    onChange={(e) => updateFormData('cnpj', maskCNPJ(e.target.value))}
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="street">Endereço *</Label>
                    <Input
                      id="street"
                      value={formData.address?.street || ''}
                      onChange={(e) => updateFormData('address.street', e.target.value)}
                      placeholder="Rua, número, bairro"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade *</Label>
                    <Input
                      id="city"
                      value={formData.address?.city || ''}
                      onChange={(e) => updateFormData('address.city', e.target.value)}
                      placeholder="Cidade"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Estado *</Label>
                    <Select
                      value={formData.address?.state}
                      onValueChange={(value) => updateFormData('address.state', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATES.map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">CEP *</Label>
                    <div className="relative">
                      <Input
                        id="zipCode"
                        value={formData.address?.zipCode || ''}
                        onChange={(e) => handleCEPChange(e.target.value)}
                        placeholder="00000-000"
                        disabled={cepLoading}
                      />
                      {cepLoading && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Digite o CEP para preenchimento automático do endereço
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Dados do Responsável */}
            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="responsibleName">Nome do Responsável *</Label>
                  <Input
                    id="responsibleName"
                    value={formData.responsibleName || ''}
                    onChange={(e) => updateFormData('responsibleName', e.target.value)}
                    placeholder="Nome completo do sócio responsável"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsibleEmail">Email do Responsável *</Label>
                  <Input
                    id="responsibleEmail"
                    type="email"
                    value={formData.responsibleEmail || ''}
                    onChange={(e) => updateFormData('responsibleEmail', e.target.value)}
                    placeholder="email@escritorio.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsiblePhone">Telefone do Responsável *</Label>
                  <Input
                    id="responsiblePhone"
                    value={formData.responsiblePhone || ''}
                    onChange={(e) => updateFormData('responsiblePhone', maskPhone(e.target.value))}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="responsibleOAB">Número da OAB *</Label>
                    <Input
                      id="responsibleOAB"
                      value={formData.responsibleOAB || ''}
                      onChange={(e) => updateFormData('responsibleOAB', e.target.value)}
                      placeholder="123456"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado da OAB *</Label>
                    <Select
                      value={formData.responsibleOABState}
                      onValueChange={(value) => updateFormData('responsibleOABState', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATES.map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Especialidades */}
            {step === 3 && (
              <>
                <div className="space-y-2">
                  <Label>Especialidades do Escritório *</Label>
                  <div className="grid gap-2 md:grid-cols-2">
                    {LEGAL_SPECIALTIES.map(specialty => (
                      <div key={specialty} className="flex items-center space-x-2">
                        <Checkbox
                          id={specialty}
                          checked={formData.specialties?.includes(specialty)}
                          onCheckedChange={(checked) => {
                            const current = formData.specialties || [];
                            if (checked) {
                              updateFormData('specialties', [...current, specialty]);
                            } else {
                              updateFormData('specialties', current.filter(s => s !== specialty));
                            }
                          }}
                        />
                        <Label htmlFor={specialty} className="text-sm">
                          {specialty}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="foundationYear">Ano de Fundação</Label>
                    <Input
                      id="foundationYear"
                      type="number"
                      min="1950"
                      max={new Date().getFullYear()}
                      value={formData.foundationYear || ''}
                      onChange={(e) => updateFormData('foundationYear', parseInt(e.target.value))}
                      placeholder="2020"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lawyersCount">Número de Advogados</Label>
                    <Input
                      id="lawyersCount"
                      type="number"
                      min="1"
                      value={formData.lawyersCount || ''}
                      onChange={(e) => updateFormData('lawyersCount', parseInt(e.target.value))}
                      placeholder="5"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="averageCasesPerMonth">Casos por Mês (média)</Label>
                  <Select
                    value={formData.averageCasesPerMonth?.toString()}
                    onValueChange={(value) => updateFormData('averageCasesPerMonth', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o volume" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">1-10 casos</SelectItem>
                      <SelectItem value="25">11-25 casos</SelectItem>
                      <SelectItem value="50">26-50 casos</SelectItem>
                      <SelectItem value="100">51-100 casos</SelectItem>
                      <SelectItem value="200">100+ casos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Step 4: Planos */}
            {step === 4 && (
              <>
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Escolha seu plano:</h3>
                  
                  <div className="grid gap-4">
                    {/* Starter */}
                    <Card 
                      className={`cursor-pointer transition-all ${
                        formData.selectedPlan === 'starter' 
                          ? 'ring-2 ring-blue-500 bg-blue-50' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => updateFormData('selectedPlan', 'starter')}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">Starter</h4>
                            <p className="text-sm text-gray-600">Ideal para escritórios pequenos</p>
                            <p className="text-xs text-gray-500">20 serviços/mês</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">R$ 299</div>
                            <div className="text-sm text-gray-500">/mês</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Professional */}
                    <Card 
                      className={`cursor-pointer transition-all ${
                        formData.selectedPlan === 'professional' 
                          ? 'ring-2 ring-blue-500 bg-blue-50' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => updateFormData('selectedPlan', 'professional')}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">Professional</h4>
                            <p className="text-sm text-gray-600">Para escritórios em crescimento</p>
                            <p className="text-xs text-gray-500">50 serviços/mês + delegação</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">R$ 699</div>
                            <div className="text-sm text-gray-500">/mês</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Enterprise */}
                    <Card 
                      className={`cursor-pointer transition-all ${
                        formData.selectedPlan === 'enterprise' 
                          ? 'ring-2 ring-blue-500 bg-blue-50' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => updateFormData('selectedPlan', 'enterprise')}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">Enterprise</h4>
                            <p className="text-sm text-gray-600">Para grandes escritórios</p>
                            <p className="text-xs text-gray-500">Serviços ilimitados + API</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">R$ 1.499</div>
                            <div className="text-sm text-gray-500">/mês</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 mb-2">✨ Incluído em todos os planos:</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Chat jurídico com IA ilimitado</li>
                      <li>• Geração de petições com IA</li>
                      <li>• Análise de documentos</li>
                      <li>• Gestão de processos e prazos</li>
                      <li>• Monitoramento de publicações</li>
                      <li>• Suporte prioritário</li>
                    </ul>
                  </div>
                </div>
              </>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t">
              <div>
                {step > 1 && (
                  <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                )}
              </div>

              <div>
                {step < 4 ? (
                  <Button onClick={handleNext}>
                    Próximo
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <LoadingButton 
                    onClick={handleSubmit}
                    className="bg-blue-600 hover:bg-blue-700"
                    loadingText="Criando..."
                    loadingKey="office-registration-submit"
                  >
                    Finalizar Cadastro
                    <CheckCircle className="h-4 w-4 ml-2" />
                  </LoadingButton>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to home */}
        <div className="text-center mt-8">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Voltar à página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
