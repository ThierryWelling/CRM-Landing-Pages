'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, LinkIcon } from '@heroicons/react/24/outline'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  url: string
}

export default function ShareModal({ isOpen, onClose, url }: ShareModalProps) {
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [copied])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch (err) {
      console.error('Erro ao copiar:', err)
    }
  }

  if (!mounted || !isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" onClick={onClose}></div>
        
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="absolute right-4 top-4">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Compartilhar
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Copie o link abaixo para compartilhar esta página
            </p>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                {url}
              </p>
            </div>
            <button
              onClick={handleCopy}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md
                shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2
                focus:ring-offset-2 focus:ring-primary"
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 