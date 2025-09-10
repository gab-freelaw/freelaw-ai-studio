import { useState, useCallback } from 'react'
import { z } from 'zod'

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
}

export interface FormValidationConfig {
  [key: string]: ValidationRule
}

export function useFormValidation<T extends Record<string, any>>(
  initialData: T,
  validationConfig: FormValidationConfig
) {
  const [data, setData] = useState<T>(initialData)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})

  const validateField = useCallback((field: keyof T, value: any): string | null => {
    const rules = validationConfig[field as string]
    if (!rules) return null

    // Required validation
    if (rules.required && (!value || value.toString().trim() === '')) {
      return 'Este campo é obrigatório'
    }

    // Skip other validations if field is empty and not required
    if (!value || value.toString().trim() === '') return null

    // MinLength validation
    if (rules.minLength && value.toString().length < rules.minLength) {
      return `Mínimo de ${rules.minLength} caracteres`
    }

    // MaxLength validation
    if (rules.maxLength && value.toString().length > rules.maxLength) {
      return `Máximo de ${rules.maxLength} caracteres`
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value.toString())) {
      return 'Formato inválido'
    }

    // Custom validation
    if (rules.custom) {
      return rules.custom(value)
    }

    return null
  }, [validationConfig])

  const validateAll = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {}
    let hasErrors = false

    Object.keys(validationConfig).forEach((field) => {
      const error = validateField(field as keyof T, data[field as keyof T])
      if (error) {
        newErrors[field as keyof T] = error
        hasErrors = true
      }
    })

    setErrors(newErrors)
    return !hasErrors
  }, [data, validateField, validationConfig])

  const setValue = useCallback((field: keyof T, value: any) => {
    setData(prev => ({ ...prev, [field]: value }))
    
    // Validate field immediately if it was touched
    if (touched[field]) {
      const error = validateField(field, value)
      setErrors(prev => ({ ...prev, [field]: error }))
    }
  }, [touched, validateField])

  const setFieldTouched = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    
    // Validate field when it becomes touched
    const error = validateField(field, data[field])
    setErrors(prev => ({ ...prev, [field]: error }))
  }, [data, validateField])

  const reset = useCallback(() => {
    setData(initialData)
    setErrors({})
    setTouched({})
  }, [initialData])

  const isValid = Object.values(errors).every(error => !error)
  const hasAnyTouched = Object.values(touched).some(Boolean)

  return {
    data,
    errors,
    touched,
    isValid,
    hasAnyTouched,
    setValue,
    setFieldTouched,
    validateAll,
    validateField,
    reset,
    setData,
    setErrors
  }
}

// Validações comuns
export const commonValidations = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (value && !value.includes('@')) return 'Email deve conter @'
      return null
    }
  },
  
  oab: {
    required: true,
    pattern: /^\d{4,6}$/,
    custom: (value: string) => {
      if (value && (value.length < 4 || value.length > 6)) {
        return 'OAB deve ter entre 4 e 6 dígitos'
      }
      return null
    }
  },
  
  cpfCnpj: {
    required: true,
    custom: (value: string) => {
      const cleaned = value.replace(/\D/g, '')
      if (cleaned.length === 11) {
        // Validação CPF básica
        if (/^(\d)\1{10}$/.test(cleaned)) return 'CPF inválido'
      } else if (cleaned.length === 14) {
        // Validação CNPJ básica
        if (/^(\d)\1{13}$/.test(cleaned)) return 'CNPJ inválido'
      } else {
        return 'CPF deve ter 11 dígitos ou CNPJ 14 dígitos'
      }
      return null
    }
  },
  
  phone: {
    required: true,
    pattern: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
    custom: (value: string) => {
      const cleaned = value.replace(/\D/g, '')
      if (cleaned.length < 10 || cleaned.length > 11) {
        return 'Telefone deve ter 10 ou 11 dígitos'
      }
      return null
    }
  },
  
  password: {
    required: true,
    minLength: 8,
    custom: (value: string) => {
      if (value && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
        return 'Senha deve ter ao menos: 1 minúscula, 1 maiúscula, 1 número'
      }
      return null
    }
  }
}




