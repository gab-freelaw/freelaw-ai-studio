import { ServiceType, LegalArea } from '@/lib/types/petition.types'

// Frontend templates from petitions page
const FRONTEND_TEMPLATES = [
  { id: 'peticao-inicial', title: 'Petição Inicial', category: 'Cível' },
  { id: 'contestacao', title: 'Contestação', category: 'Cível' },
  { id: 'recurso-apelacao', title: 'Recurso de Apelação', category: 'Recursos' },
  { id: 'agravo-instrumento', title: 'Agravo de Instrumento', category: 'Recursos' },
  { id: 'mandado-seguranca', title: 'Mandado de Segurança', category: 'Constitucional' },
  { id: 'embargos-declaracao', title: 'Embargos de Declaração', category: 'Recursos' }
]

// Backend service types
const BACKEND_SERVICE_TYPES = Object.values(ServiceType)
const BACKEND_LEGAL_AREAS = Object.values(LegalArea)

// Default schemas from migration
const DEFAULT_SCHEMAS = [
  { service_type: 'peticao_inicial', legal_area: 'civel', name: 'Petição Inicial Cível' },
  { service_type: 'contestacao', legal_area: 'civel', name: 'Contestação Cível' },
  { service_type: 'agravo_instrumento', legal_area: 'civel', name: 'Agravo de Instrumento Cível' },
  { service_type: 'recurso_apelacao', legal_area: 'civel', name: 'Recurso de Apelação Cível' },
  { service_type: 'embargos_declaracao', legal_area: 'civel', name: 'Embargos de Declaração Cível' },
  { service_type: 'mandado_seguranca', legal_area: 'constitucional', name: 'Mandado de Segurança' }
]

console.log('🔍 PETITION SYSTEM ANALYSIS')
console.log('='.repeat(50))
console.log('')

console.log('📄 FRONTEND TEMPLATES:')
FRONTEND_TEMPLATES.forEach((template, idx) => {
  console.log(`  ${idx + 1}. ${template.title} (${template.id}) - ${template.category}`)
})

console.log('')
console.log('🔧 BACKEND SERVICE TYPES:')
BACKEND_SERVICE_TYPES.forEach((type, idx) => {
  console.log(`  ${idx + 1}. ${type}`)
})

console.log('')
console.log('🏛️  BACKEND LEGAL AREAS:')
BACKEND_LEGAL_AREAS.forEach((area, idx) => {
  console.log(`  ${idx + 1}. ${area}`)
})

console.log('')
console.log('🗂️  DEFAULT SCHEMAS (from migration):')
DEFAULT_SCHEMAS.forEach((schema, idx) => {
  console.log(`  ${idx + 1}. ${schema.name} (${schema.service_type}/${schema.legal_area})`)
})

console.log('')
console.log('🔄 MAPPING ANALYSIS:')
console.log('')

// Check mapping coverage
const mappingCheck = FRONTEND_TEMPLATES.map(template => {
  // Convert frontend ID to backend service type
  const backendMapping: Record<string, ServiceType> = {
    'peticao-inicial': ServiceType.PETICAO_INICIAL,
    'contestacao': ServiceType.CONTESTACAO,
    'recurso-apelacao': ServiceType.RECURSO_APELACAO,
    'agravo-instrumento': ServiceType.AGRAVO_INSTRUMENTO,
    'mandado-seguranca': ServiceType.MANDADO_SEGURANCA,
    'embargos-declaracao': ServiceType.EMBARGOS_DECLARACAO
  }
  
  const mappedServiceType = backendMapping[template.id]
  const hasBackendSupport = !!mappedServiceType
  
  // Map frontend category to legal area
  const legalAreaMapping: Record<string, string> = {
    'Cível': 'civel',
    'Recursos': 'civel', // Most appeal resources are in civil area
    'Constitucional': 'constitucional'
  }
  
  const expectedLegalArea = legalAreaMapping[template.category] || 'civel'
  const hasDefaultSchema = DEFAULT_SCHEMAS.some(s => 
    s.service_type === mappedServiceType && 
    s.legal_area === expectedLegalArea
  )
  
  return {
    frontend: template,
    mappedServiceType,
    hasBackendSupport,
    hasDefaultSchema
  }
})

mappingCheck.forEach(check => {
  const status = check.hasBackendSupport && check.hasDefaultSchema ? '✅' : '❌'
  const backendStatus = check.hasBackendSupport ? '✅' : '❌'
  const schemaStatus = check.hasDefaultSchema ? '✅' : '❌'
  
  console.log(`${status} ${check.frontend.title}`)
  console.log(`   Frontend ID: ${check.frontend.id}`)
  console.log(`   Backend Support: ${backendStatus} ${check.mappedServiceType || 'NO MAPPING'}`)
  console.log(`   Default Schema: ${schemaStatus}`)
  console.log('')
})

console.log('📊 SUMMARY:')
const fullSupport = mappingCheck.filter(c => c.hasBackendSupport && c.hasDefaultSchema).length
const total = mappingCheck.length

console.log(`✅ Fully Supported: ${fullSupport}/${total}`)
console.log(`❌ Missing Support: ${total - fullSupport}/${total}`)

if (fullSupport < total) {
  console.log('')
  console.log('🚨 MISSING SUPPORT:')
  mappingCheck.filter(c => !(c.hasBackendSupport && c.hasDefaultSchema)).forEach(missing => {
    console.log(`   - ${missing.frontend.title} (${missing.frontend.id})`)
    if (!missing.hasBackendSupport) console.log('     • Missing backend service type mapping')
    if (!missing.hasDefaultSchema) console.log('     • Missing default schema in database')
  })
}

console.log('')
console.log('🎯 RECOMMENDATIONS:')
if (fullSupport === total) {
  console.log('✅ All frontend petition types have full backend support!')
  console.log('✅ Migration includes all necessary default schemas!')
} else {
  console.log('1. Add missing service types to ServiceType enum')
  console.log('2. Add missing default schemas to migration')
  console.log('3. Update API route mapping function')
}

console.log('')
console.log('='.repeat(50))
console.log('Analysis complete!')