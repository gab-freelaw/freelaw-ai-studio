'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLoading } from '@/contexts/loading-context'

interface LoadingButtonProps {
  href?: string
  onClick?: () => void | Promise<void>
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  loadingText?: string
  prefetch?: boolean
  loadingKey?: string
  disabled?: boolean
}

export function LoadingButton({ 
  href,
  onClick,
  children, 
  className, 
  variant = 'default',
  size = 'default',
  loadingText = 'Carregando...',
  prefetch = true,
  loadingKey,
  disabled = false
}: LoadingButtonProps) {
  const router = useRouter()
  const { setLoading, isLoading } = useLoading()
  
  // Generate a unique loading key if not provided
  const buttonLoadingKey = loadingKey || `button-${href || 'action'}-${Math.random()}`
  const isButtonLoading = isLoading(buttonLoadingKey)

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    
    if (isButtonLoading || disabled) return
    
    setLoading(buttonLoadingKey, true)
    
    try {
      if (onClick) {
        await onClick()
      } else if (href) {
        // Prefetch the route for faster navigation
        if (prefetch) {
          router.prefetch(href)
        }
        
        // Small delay to show loading state
        await new Promise(resolve => setTimeout(resolve, 150))
        
        // Navigate to the route
        router.push(href)
      }
    } catch (error) {
      console.error('Button action error:', error)
      setLoading(buttonLoadingKey, false)
    }
  }, [href, onClick, isButtonLoading, disabled, buttonLoadingKey, setLoading, router, prefetch])

  return (
    <Button
      onClick={handleClick}
      disabled={isButtonLoading || disabled}
      variant={variant}
      size={size}
      className={cn(
        'transition-all duration-200',
        isButtonLoading && 'cursor-wait',
        className
      )}
    >
      {isButtonLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
