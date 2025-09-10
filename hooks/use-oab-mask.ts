'use client'

import { useState, useCallback } from 'react'

export function useOabMask(initialValue: string = '') {
  const [value, setValue] = useState(initialValue)

  const formatOab = useCallback((input: string): string => {
    // Remove tudo que não é número
    const numbers = input.replace(/\D/g, '')
    
    // Aplica a máscara XXX.XXX
    if (numbers.length <= 3) {
      return numbers
    } else if (numbers.length <= 6) {
      return `${numbers.slice(0, 3)}.${numbers.slice(3)}`
    } else {
      // Limita a 6 dígitos
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}`
    }
  }, [])

  const handleChange = useCallback((input: string) => {
    const formatted = formatOab(input)
    setValue(formatted)
    return formatted
  }, [formatOab])

  const getRawValue = useCallback(() => {
    return value.replace(/\D/g, '')
  }, [value])

  const isValid = useCallback(() => {
    const raw = getRawValue()
    return raw.length >= 3 && raw.length <= 6
  }, [getRawValue])

  return {
    value,
    setValue: handleChange,
    getRawValue,
    isValid,
    formatOab
  }
}
