/**
 * Enhanced Notification System
 * Provides rich notifications with actions, persistence, and sound
 */

import { toast as sonnerToast } from 'sonner'

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'loading' | 'promise'

export interface NotificationOptions {
  title?: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  cancel?: {
    label: string
    onClick?: () => void
  }
  icon?: React.ReactNode
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  important?: boolean
  dismissible?: boolean
  className?: string
  style?: React.CSSProperties
  sound?: boolean
  persist?: boolean
}

// Sound effects
const sounds = {
  success: '/sounds/success.mp3',
  error: '/sounds/error.mp3',
  warning: '/sounds/warning.mp3',
  info: '/sounds/info.mp3',
}

// Play notification sound
function playSound(type: NotificationType) {
  if (typeof window === 'undefined') return
  
  try {
    const audioFile = sounds[type as keyof typeof sounds]
    if (audioFile) {
      const audio = new Audio(audioFile)
      audio.volume = 0.3
      audio.play().catch(() => {})
    }
  } catch (error) {
    console.error('Failed to play notification sound:', error)
  }
}

// Icon component creators (functions instead of JSX directly)
const getIcon = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return undefined // Will use default sonner icon
    case 'error':
      return undefined // Will use default sonner icon
    case 'warning':
      return undefined // Will use default sonner icon
    case 'info':
      return undefined // Will use default sonner icon
    case 'loading':
      return undefined // Will use default sonner icon
    default:
      return undefined
  }
}

// Enhanced toast notification system
export const notification = {
  success(message: string, options?: NotificationOptions) {
    if (options?.sound !== false) playSound('success')
    
    return sonnerToast.success(message, {
      duration: options?.persist ? Infinity : (options?.duration || 4000),
      description: options?.description,
      action: options?.action,
      cancel: options?.cancel as any,
      icon: options?.icon || getIcon('success'),
      position: options?.position,
      // important: options?.important, // Não suportado pelo toast
      dismissible: options?.dismissible !== false,
      className: options?.className || 'bg-green-50 border-green-200',
      style: options?.style,
    })
  },

  error(message: string, options?: NotificationOptions) {
    if (options?.sound !== false) playSound('error')
    
    return sonnerToast.error(message, {
      duration: options?.persist ? Infinity : (options?.duration || 6000),
      description: options?.description,
      action: options?.action,
      cancel: options?.cancel as any,
      icon: options?.icon || getIcon('error'),
      position: options?.position,
      // important: options?.important !== false, // Não suportado pelo toast
      dismissible: options?.dismissible !== false,
      className: options?.className || 'bg-red-50 border-red-200',
      style: options?.style,
    })
  },

  warning(message: string, options?: NotificationOptions) {
    if (options?.sound !== false) playSound('warning')
    
    return sonnerToast.warning(message, {
      duration: options?.persist ? Infinity : (options?.duration || 5000),
      description: options?.description,
      action: options?.action,
      cancel: options?.cancel as any,
      icon: options?.icon || getIcon('warning'),
      position: options?.position,
      // important: options?.important, // Não suportado pelo toast
      dismissible: options?.dismissible !== false,
      className: options?.className || 'bg-yellow-50 border-yellow-200',
      style: options?.style,
    })
  },

  info(message: string, options?: NotificationOptions) {
    if (options?.sound !== false) playSound('info')
    
    return sonnerToast.info(message, {
      duration: options?.persist ? Infinity : (options?.duration || 4000),
      description: options?.description,
      action: options?.action,
      cancel: options?.cancel as any,
      icon: options?.icon || getIcon('info'),
      position: options?.position,
      // important: options?.important, // Não suportado pelo toast
      dismissible: options?.dismissible !== false,
      className: options?.className || 'bg-blue-50 border-blue-200',
      style: options?.style,
    })
  },

  loading(message: string, options?: NotificationOptions) {
    return sonnerToast.loading(message, {
      duration: options?.duration || Infinity,
      description: options?.description,
      icon: options?.icon || getIcon('loading'),
      position: options?.position,
      // important: options?.important, // Não suportado pelo toast
      dismissible: false,
      className: options?.className,
      style: options?.style,
    })
  },

  promise<T>(
    promise: Promise<T>,
    options: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
      description?: string
      position?: NotificationOptions['position']
      sound?: boolean
    }
  ) {
    return sonnerToast.promise(promise, {
      loading: options.loading,
      success: (data) => {
        if (options.sound !== false) playSound('success')
        return typeof options.success === 'function' ? options.success(data) : options.success
      },
      error: (error) => {
        if (options.sound !== false) playSound('error')
        return typeof options.error === 'function' ? options.error(error) : options.error
      },
      position: options.position,
    })
  },

  dismiss(toastId?: string | number) {
    sonnerToast.dismiss(toastId)
  },

  // Custom notification for legal actions
  legal: {
    petitionCreated(title: string, id?: string) {
      return notification.success('Petição criada com sucesso!', {
        description: title,
        action: id ? {
          label: 'Ver petição',
          onClick: () => window.location.href = `/petitions/${id}`
        } : undefined,
        duration: 5000,
      })
    },

    documentUploaded(fileName: string) {
      return notification.success('Documento enviado!', {
        description: fileName,
        icon: undefined,
      })
    },

    processUpdated(processNumber: string) {
      return notification.info('Processo atualizado', {
        description: `Processo ${processNumber} foi atualizado com sucesso`,
        duration: 4000,
      })
    },

    deadlineApproaching(title: string, daysLeft: number) {
      const urgency = daysLeft <= 1 ? 'error' : daysLeft <= 3 ? 'warning' : 'info'
      const message = daysLeft === 0 ? 'Prazo vence hoje!' :
                     daysLeft === 1 ? 'Prazo vence amanhã!' :
                     `Prazo em ${daysLeft} dias`

      return notification[urgency](message, {
        description: title,
        important: daysLeft <= 3,
        persist: daysLeft <= 1,
        action: {
          label: 'Ver detalhes',
          onClick: () => window.location.href = '/deadlines'
        }
      })
    },

    aiResponse(action: string) {
      return notification.info('IA processando...', {
        description: action,
        icon: undefined,
        duration: 3000,
      })
    },
  },

  // Notification queue management
  queue: {
    items: [] as Array<{ type: NotificationType; message: string; options?: NotificationOptions }>,
    
    add(type: NotificationType, message: string, options?: NotificationOptions) {
      this.items.push({ type, message, options })
      this.process()
    },

    async process() {
      if (this.items.length === 0) return
      
      const item = this.items.shift()
      if (item) {
        (notification as any)[item.type](item.message, item.options)
        
        // Process next item after a delay
        if (this.items.length > 0) {
          setTimeout(() => this.process(), 500)
        }
      }
    },

    clear() {
      this.items = []
      notification.dismiss()
    },
  },

  // Browser notifications (requires permission)
  async requestPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return false
  },

  async browser(title: string, options?: NotificationOptions & { body?: string; icon?: string }) {
    const hasPermission = await this.requestPermission()
    
    if (!hasPermission) {
      // Fallback to toast notification
      return notification.info(title, options)
    }

    const browserNotification = new Notification(title, {
      body: options?.body || options?.description,
      icon: options?.icon || '/icon-192x192.png',
      badge: '/icon-96x96.png',
      silent: options?.sound === false,
      requireInteraction: options?.persist,
    })

    if (options?.action) {
      browserNotification.onclick = options.action.onClick
    }

    return browserNotification
  },
}

// Export shorthand functions
export const notify = notification
export const toast = sonnerToast