"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface DropdownMenuProps {
  children: React.ReactNode
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode
  asChild?: boolean
  className?: string
}

interface DropdownMenuContentProps {
  children: React.ReactNode
  align?: "start" | "center" | "end"
  className?: string
}

interface DropdownMenuItemProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

const DropdownMenuContext = React.createContext<{
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}>({
  isOpen: false,
  setIsOpen: () => {}
})

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('[data-dropdown-menu]')) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  return (
    <DropdownMenuContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="relative" data-dropdown-menu>
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

export function DropdownMenuTrigger({ 
  children, 
  asChild = false, 
  className
}: DropdownMenuTriggerProps) {
  const { isOpen, setIsOpen } = React.useContext(DropdownMenuContext)

  const handleClick = () => {
    setIsOpen(!isOpen)
  }

  if (asChild) {
    const childElement = children as React.ReactElement<any>
    return React.cloneElement(childElement, {
      ...childElement.props,
      onClick: handleClick,
      'aria-expanded': isOpen,
      'aria-haspopup': true
    })
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex items-center justify-center gap-2 px-3 py-1 text-sm border rounded hover:bg-muted",
        className
      )}
      aria-expanded={isOpen}
      aria-haspopup={true}
    >
      {children}
    </button>
  )
}

export function DropdownMenuContent({ 
  children, 
  align = "end",
  className 
}: DropdownMenuContentProps) {
  const { isOpen } = React.useContext(DropdownMenuContext)

  if (!isOpen) return null

  const alignmentClasses = {
    start: "left-0",
    center: "left-1/2 transform -translate-x-1/2", 
    end: "right-0"
  }

  return (
    <div
      className={cn(
        "absolute top-full mt-1 min-w-[8rem] z-50 rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
        alignmentClasses[align],
        className
      )}
    >
      {children}
    </div>
  )
}

export function DropdownMenuItem({ 
  children, 
  onClick,
  className 
}: DropdownMenuItemProps) {
  const { setIsOpen } = React.useContext(DropdownMenuContext)

  const handleClick = () => {
    onClick?.()
    setIsOpen(false)
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
        className
      )}
    >
      {children}
    </div>
  )
} 