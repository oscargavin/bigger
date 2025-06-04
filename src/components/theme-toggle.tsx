'use client'

import * as React from "react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [isAnimating, setIsAnimating] = React.useState(false)

  const handleToggle = () => {
    setIsAnimating(true)
    setTheme(theme === "light" ? "dark" : "light")
    setTimeout(() => setIsAnimating(false), 600)
  }

  return (
    <button
      onClick={handleToggle}
      className="relative h-10 w-10 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-background transition-colors"
      aria-label="Toggle theme"
    >
      {/* Background circle */}
      <div 
        className={`absolute inset-0 transition-all duration-500 ${
          theme === "dark" 
            ? "bg-gradient-to-br from-indigo-600 to-purple-700" 
            : "bg-gradient-to-br from-amber-400 to-orange-500"
        }`}
      />
      
      {/* Sun/Moon container */}
      <div className="relative h-full w-full flex items-center justify-center">
        {/* Sun rays */}
        <div className={`absolute inset-0 transition-all duration-500 ${theme === "dark" ? "opacity-0 scale-50" : "opacity-100 scale-100"}`}>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={`absolute h-1 w-1 bg-white rounded-full transition-all duration-500 ${
                isAnimating ? "animate-pulse" : ""
              }`}
              style={{
                top: "50%",
                left: "50%",
                transform: `
                  translate(-50%, -50%) 
                  rotate(${i * 45}deg) 
                  translateY(${theme === "dark" ? "0" : "-14"}px)
                `,
                transitionDelay: `${i * 30}ms`,
              }}
            />
          ))}
        </div>

        {/* Center circle (sun/moon) */}
        <div 
          className={`relative w-5 h-5 rounded-full transition-all duration-500 ${
            theme === "dark" 
              ? "bg-white shadow-[inset_-3px_-2px_0_0_rgba(0,0,0,0.15)]" 
              : "bg-white"
          }`}
        >
          {/* Moon craters */}
          <div 
            className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-gray-300 transition-all duration-500 ${
              theme === "dark" ? "opacity-100" : "opacity-0"
            }`}
          />
          <div 
            className={`absolute bottom-1 left-1 w-1 h-1 rounded-full bg-gray-300 transition-all duration-500 ${
              theme === "dark" ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>

        {/* Stars for dark mode */}
        <div className={`absolute inset-0 transition-all duration-700 ${theme === "dark" ? "opacity-100" : "opacity-0"}`}>
          {[
            { top: "15%", left: "20%", delay: "100ms" },
            { top: "25%", left: "75%", delay: "200ms" },
            { top: "70%", left: "25%", delay: "300ms" },
            { top: "75%", left: "70%", delay: "400ms" },
          ].map((star, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-0.5 bg-white rounded-full animate-twinkle"
              style={{
                top: star.top,
                left: star.left,
                animationDelay: star.delay,
              }}
            />
          ))}
        </div>
      </div>

      {/* Ripple effect on click */}
      {isAnimating && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full h-full bg-white/20 animate-ping" />
        </div>
      )}
    </button>
  )
}