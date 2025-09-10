'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, ChevronDown, GraduationCap, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  searchUniversities, 
  isUniversityRecommended, 
  formatUniversityFullName,
  type OABUniversity 
} from '@/lib/data/oab-recommended-universities'

interface UniversityAutocompleteProps {
  value: string
  onChange: (value: string, isRecommended: boolean) => void
  placeholder?: string
  label?: string
  required?: boolean
  className?: string
}

export function UniversityAutocomplete({
  value,
  onChange,
  placeholder = "Digite o nome da sua universidade...",
  label = "Universidade de Formação",
  required = false,
  className
}: UniversityAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState(value)
  const [suggestions, setSuggestions] = useState<OABUniversity[]>([])
  const [selectedUniversity, setSelectedUniversity] = useState<OABUniversity | null>(null)
  const [isRecommended, setIsRecommended] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Verificar se a universidade atual é recomendada
  useEffect(() => {
    if (value) {
      const recommended = isUniversityRecommended(value)
      setIsRecommended(recommended)
      setSearchQuery(value)
    }
  }, [value])

  // Buscar sugestões quando o usuário digita
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const results = searchUniversities(searchQuery)
      setSuggestions(results)
      setIsOpen(results.length > 0)
    } else {
      setSuggestions([])
      setIsOpen(false)
    }
  }, [searchQuery])

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchQuery(newValue)
    setSelectedUniversity(null)
    
    // Verificar se é uma universidade recomendada
    const recommended = isUniversityRecommended(newValue)
    setIsRecommended(recommended)
    onChange(newValue, recommended)
  }

  const handleSelectUniversity = (university: OABUniversity) => {
    const fullName = formatUniversityFullName(university)
    setSearchQuery(fullName)
    setSelectedUniversity(university)
    setIsRecommended(true)
    setIsOpen(false)
    onChange(fullName, true)
    inputRef.current?.blur()
  }

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setIsOpen(true)
    }
  }

  const getStatusColor = () => {
    if (!searchQuery) return 'border-gray-300'
    return isRecommended ? 'border-green-500' : 'border-orange-500'
  }

  const getStatusIcon = () => {
    if (!searchQuery) return null
    return isRecommended ? (
      <Check className="w-4 h-4 text-green-600" />
    ) : (
      <AlertTriangle className="w-4 h-4 text-orange-600" />
    )
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="space-y-2">
        <Label htmlFor="university" className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4" />
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
        
        <div className="relative">
          <Input
            ref={inputRef}
            id="university"
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            className={cn(
              "pr-10 transition-colors",
              getStatusColor()
            )}
            autoComplete="off"
          />
          
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {getStatusIcon()}
            <ChevronDown className={cn(
              "w-4 h-4 text-gray-400 transition-transform",
              isOpen && "rotate-180"
            )} />
          </div>
        </div>

        {/* Status da universidade */}
        {searchQuery && (
          <div className="flex items-center gap-2 text-sm">
            {isRecommended ? (
              <>
                <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                  <Check className="w-3 h-3 mr-1" />
                  Recomendada pela OAB
                </Badge>
                <span className="text-green-600">✓ Universidade qualificada</span>
              </>
            ) : (
              <>
                <Badge variant="outline" className="bg-orange-50 text-orange-800 border-orange-300">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Não recomendada
                </Badge>
                <span className="text-orange-600">⚠ Universidade não está na lista da OAB</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Dropdown de sugestões */}
      {isOpen && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto shadow-lg border">
          <div className="p-2">
            {suggestions.map((university) => (
              <div
                key={university.id}
                onClick={() => handleSelectUniversity(university)}
                className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer rounded-md transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium text-sm">{university.name}</div>
                  <div className="text-xs text-gray-500">
                    {university.city}/{university.uf} • {university.category}
                  </div>
                </div>
                <Badge variant="default" className="bg-green-100 text-green-800 border-green-300 text-xs">
                  <Check className="w-3 h-3 mr-1" />
                  OAB
                </Badge>
              </div>
            ))}
          </div>
          
          {/* Opção para "Outra universidade" */}
          <div className="border-t p-2">
            <div
              onClick={() => {
                setIsOpen(false)
                inputRef.current?.focus()
              }}
              className="flex items-center p-3 hover:bg-gray-50 cursor-pointer rounded-md transition-colors text-gray-600"
            >
              <GraduationCap className="w-4 h-4 mr-3" />
              <div>
                <div className="font-medium text-sm">Outra universidade</div>
                <div className="text-xs text-gray-500">
                  Digite o nome da sua universidade
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Informação educativa */}
      {!searchQuery && (
        <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2">
            <GraduationCap className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Sobre as universidades recomendadas</p>
              <p className="text-xs">
                Priorizamos prestadores formados em universidades com o <strong>Selo de Qualidade OAB</strong>, 
                que demonstram excelência no ensino jurídico através dos resultados do Exame de Ordem e ENADE.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
