import { FC } from 'react'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  className?: string
  children?: React.ReactNode
}

export const Switch: FC<SwitchProps> = ({ checked, onChange, className = '', children }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={className}
    >
      {children}
    </button>
  )
} 