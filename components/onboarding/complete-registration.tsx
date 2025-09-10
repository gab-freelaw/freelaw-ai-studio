'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Building, ArrowRight, ArrowLeft, CreditCard, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CompleteRegistrationData {
  // Dados do escritório
  cnpj: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  
  // Dados do responsável
  responsibleOAB: string;
  responsibleOABState: string;
  responsiblePhone: string;
  
  // Dados do escritório
  foundationYear: number;
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

interface CompleteRegistrationProps {
  onComplete: (data: CompleteRegistrationData) => void;
  onCancel?: () => void;
  selectedPlan?: 'starter' | 'professional' | 'enterprise';
}

export function CompleteRegistration({ onComplete, onCancel, selectedPlan = 'starter' }: CompleteRegistrationProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<CompleteRegistrationData>({
    cnpj: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
    responsibleOAB: '',
    responsibleOABState: '',
    responsiblePhone: '',
    foundationYear: new Date().getFullYear(),
    specialties: [],
    averageCasesPerMonth: 10,
    selectedPlan,
  });

  const updateFormData = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    try {
      await onComplete(formData);
    } catch (error) {
      console.error('Erro ao completar cadastro:', error);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.cnpj && formData.address.zipCode && formData.address.street;
      case 2:
        return formData.responsibleOAB && formData.responsibleOABState && formData.responsiblePhone;
      case 3:
        return formData.specialties.length > 0;
      default:
        return false;
    }
  };

  // Função para buscar endereço por CEP (similar à implementada anteriormente)
  const fetchAddressByCEP = async (cep: string) => {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, '')}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        updateFormData('address.street', data.logradouro);
        updateFormData('address.city', data.localidade);
        updateFormData('address.state', data.uf);
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    }
  };

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

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <CreditCard className="h-8 w-8 text-freelaw-purple" />
          <h1 className="text-3xl font-bold text-freelaw-blue">Complete seu Cadastro</h1>
        </div>
        <p className="text-gray-600">
          Para contratar serviços, precisamos de algumas informações adicionais
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                i <= step 
                  ? 'bg-freelaw-purple text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {i}
              </div>
              {i < 3 && (
                <div className={`w-12 h-1 mx-2 ${
                  i < step ? 'bg-freelaw-purple' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Building className="h-5 w-5 text-freelaw-purple" />
            {step === 1 && 'Dados do Escritório'}
            {step === 2 && 'Dados do Responsável'}
            {step === 3 && 'Especialidades e Perfil'}
          </CardTitle>
          <CardDescription>
            {step === 1 && 'Informações básicas do seu escritório'}
            {step === 2 && 'Dados do advogado responsável'}
            {step === 3 && 'Áreas de atuação e volume de trabalho'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Step 1: Dados do Escritório */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ do Escritório *</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => updateFormData('cnpj', maskCNPJ(e.target.value))}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="zipCode">CEP *</Label>
                <Input
                  id="zipCode"
                  value={formData.address.zipCode}
                  onChange={(e) => {
                    const maskedCEP = maskCEP(e.target.value);
                    updateFormData('address.zipCode', maskedCEP);
                    if (maskedCEP.replace(/\D/g, '').length === 8) {
                      fetchAddressByCEP(maskedCEP);
                    }
                  }}
                  placeholder="00000-000"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="street">Endereço *</Label>
                <Input
                  id="street"
                  value={formData.address.street}
                  onChange={(e) => updateFormData('address.street', e.target.value)}
                  placeholder="Rua, Avenida..."
                />
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    value={formData.address.city}
                    onChange={(e) => updateFormData('address.city', e.target.value)}
                    placeholder="São Paulo"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="state">Estado *</Label>
                  <Select
                    value={formData.address.state}
                    onValueChange={(value) => updateFormData('address.state', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Dados do Responsável */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="responsibleOAB">Número da OAB *</Label>
                  <Input
                    id="responsibleOAB"
                    value={formData.responsibleOAB}
                    onChange={(e) => updateFormData('responsibleOAB', e.target.value)}
                    placeholder="123456"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="responsibleOABState">Estado da OAB *</Label>
                  <Select
                    value={formData.responsibleOABState}
                    onValueChange={(value) => updateFormData('responsibleOABState', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="responsiblePhone">Telefone do Responsável *</Label>
                <Input
                  id="responsiblePhone"
                  value={formData.responsiblePhone}
                  onChange={(e) => updateFormData('responsiblePhone', maskPhone(e.target.value))}
                  placeholder="(11) 99999-9999"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="foundationYear">Ano de Fundação</Label>
                <Input
                  id="foundationYear"
                  type="number"
                  value={formData.foundationYear}
                  onChange={(e) => updateFormData('foundationYear', parseInt(e.target.value))}
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>
          )}

          {/* Step 3: Especialidades */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Especialidades do Escritório *</Label>
                <div className="grid gap-2 md:grid-cols-2">
                  {LEGAL_SPECIALTIES.map((specialty) => (
                    <div key={specialty} className="flex items-center space-x-2">
                      <Checkbox
                        id={specialty}
                        checked={formData.specialties.includes(specialty)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateFormData('specialties', [...formData.specialties, specialty]);
                          } else {
                            updateFormData('specialties', formData.specialties.filter(s => s !== specialty));
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
              
              <div className="space-y-2">
                <Label htmlFor="averageCasesPerMonth">Casos por mês (aproximadamente)</Label>
                <Select
                  value={formData.averageCasesPerMonth.toString()}
                  onValueChange={(value) => updateFormData('averageCasesPerMonth', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">1-10 casos</SelectItem>
                    <SelectItem value="20">11-30 casos</SelectItem>
                    <SelectItem value="50">31-70 casos</SelectItem>
                    <SelectItem value="100">Mais de 70 casos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-800 mb-1">Dados Seguros</h4>
                    <p className="text-sm text-green-700">
                      Todas as informações são criptografadas e usadas apenas para 
                      personalizar sua experiência e processar pagamentos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-between pt-6">
            <div>
              {step > 1 ? (
                <Button 
                  variant="outline" 
                  onClick={handleBack}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              ) : onCancel ? (
                <Button 
                  variant="outline" 
                  onClick={onCancel}
                  className="flex items-center gap-2"
                >
                  Cancelar
                </Button>
              ) : null}
            </div>
            
            {step < 3 ? (
              <Button 
                onClick={handleNext}
                disabled={!isStepValid()}
                className="flex items-center gap-2 bg-freelaw-purple hover:bg-freelaw-purple/90"
              >
                Continuar
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={!isStepValid()}
                className="flex items-center gap-2 bg-gradient-to-r from-freelaw-purple to-freelaw-pink hover:opacity-90"
              >
                <CreditCard className="h-4 w-4" />
                Finalizar e Contratar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
