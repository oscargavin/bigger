'use client'

import * as React from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button 
        className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center"
        aria-label="Toggle theme"
      />
    )
  }

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className={cn(
        "relative h-10 w-10 rounded-lg flex items-center justify-center group",
        "transition-all duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      )}
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        <Sun 
          className={cn(
            "absolute inset-0 h-5 w-5 text-amber-500 transition-all duration-300 ease-out",
            theme === "dark" 
              ? "opacity-0 scale-50 rotate-180" 
              : "opacity-100 scale-100 rotate-0",
            "group-hover:rotate-12"
          )}
          strokeWidth={2}
        />
        <Moon 
          className={cn(
            "absolute inset-0 h-5 w-5 text-blue-500 transition-all duration-300 ease-out",
            theme === "dark" 
              ? "opacity-100 scale-100 rotate-0" 
              : "opacity-0 scale-50 -rotate-180",
            "group-hover:-rotate-12"
          )}
          strokeWidth={2}
        />
      </div>
    </button>
  )
}