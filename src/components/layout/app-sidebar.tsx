'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { api } from '@/utils/api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { ShameWidget } from '@/components/ai-shame/shame-widget'
import { 
  Home, 
  Users, 
  Calendar, 
  Trophy, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X,
  Award,
  FileBarChart
} from 'lucide-react'
import { useState } from 'react'

const sidebarItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/workouts', label: 'Workouts', icon: Calendar },
  { href: '/buddy', label: 'Buddy', icon: Users },
  { href: '/badges', label: 'Achievements', icon: Award },
  { href: '/reports', label: 'Reports', icon: FileBarChart },
  { href: '/competitions', label: 'Competitions', icon: Trophy },
  { href: '/progress', label: 'Progress', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { data: user } = api.auth.getUser.useQuery()
  const signOut = api.auth.signOut.useMutation({
    onSuccess: () => {
      window.location.href = '/'
    },
  })

  const sidebarContent = (
    <>
      <div className="px-3 py-4">
        <h2 className="mb-6 px-4 text-xl font-bold text-sidebar-foreground flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 dark:from-brand-400 dark:to-violet-400 flex items-center justify-center">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <span>Bigger</span>
        </h2>
        <div className="space-y-1">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span
                className={cn(
                  "group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  pathname === item.href 
                    ? "bg-gradient-to-r from-brand-500/10 to-violet-500/10 dark:from-brand-500/20 dark:to-violet-500/20 text-sidebar-foreground border-l-4 border-brand-500 dark:border-brand-400" 
                    : "text-sidebar-foreground/60 hover:bg-white/5 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className={cn(
                  "mr-3 h-4 w-4 transition-colors",
                  pathname === item.href ? "text-brand-500 dark:text-brand-400" : ""
                )} />
                <span>{item.label}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
      <div className="mt-auto border-t border-sidebar-border/50 p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-brand-500 dark:from-violet-400 dark:to-brand-400 p-0.5">
            <div className="h-full w-full rounded-full bg-sidebar-background flex items-center justify-center">
              <span className="text-xs font-medium text-sidebar-foreground">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-sidebar-foreground">{user?.email}</p>
          </div>
          <ShameWidget className="mr-2" showToast={false} />
          <ThemeToggle />
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/5 transition-colors"
          onClick={() => signOut.mutate()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden",
          isMobileMenuOpen ? "block" : "hidden"
        )}
      >
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
        <nav className="fixed left-0 top-0 bottom-0 w-72 bg-sidebar-background border-r border-sidebar-border flex flex-col shadow-soft-lg">
          {sidebarContent}
        </nav>
      </div>

      {/* Desktop sidebar */}
      <nav className="hidden md:flex w-72 border-r border-sidebar-border bg-sidebar-background flex-col h-screen sticky top-0">
        {sidebarContent}
      </nav>
    </>
  )
}