"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/utils/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ShameWidget } from "@/components/ai-shame/shame-widget";
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
  FileBarChart,
  Dumbbell,
  Brain,
  Target,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const sidebarSections = [
  {
    label: "MAIN",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: Home },
      { href: "/workouts", label: "Workouts", icon: Dumbbell },
      { href: "/buddy", label: "Buddy", icon: Users },
    ],
  },
  {
    label: "TRACKING",
    items: [
      { href: "/progress", label: "Progress", icon: BarChart3 },
      { href: "/goals", label: "Goals", icon: Target },
      { href: "/reports", label: "Reports", icon: FileBarChart },
      { href: "/insights", label: "Smart Insights", icon: Brain },
    ],
  },
  {
    label: "COMPETE",
    items: [
      { href: "/competitions", label: "Competitions", icon: Trophy },
      { href: "/badges", label: "Achievements", icon: Award },
    ],
  },
];

const standaloneItems = [
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: user } = api.auth.getUser.useQuery();
  const { data: pendingRequests } = api.pairings.getPendingRequests.useQuery();
  const signOut = api.auth.signOut.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-6 pt-8 pb-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="h-10 w-10 relative">
            <Image
              src="/android-chrome-512x512.png"
              alt="Gym Buddy Logo"
              width={40}
              height={40}
              className="rounded-lg"
            />
          </div>
          <span className="text-xl font-semibold tracking-tight">Bigger</span>
        </Link>
      </div>

      {/* Main navigation */}
      <div className="flex-1 px-3 pb-8 overflow-y-auto">
        <div className="space-y-8">
          {sidebarSections.map((section) => (
            <div key={section.label}>
              <h3 className="px-3 mb-2 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                {section.label}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span
                      className={cn(
                        "group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 relative",
                        pathname === item.href
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      {pathname === item.href && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-primary rounded-r" />
                      )}
                      <item.icon
                        className={cn(
                          "mr-3 h-4 w-4 transition-all duration-200",
                          pathname === item.href
                            ? "text-primary"
                            : "text-muted-foreground/70 group-hover:text-muted-foreground"
                        )}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.label === "Buddy" && pendingRequests && pendingRequests.length > 0 && (
                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                          {pendingRequests.length}
                        </span>
                      )}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {/* Standalone items */}
          <div className="pt-4 border-t border-border/50">
            <div className="space-y-1">
              {standaloneItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span
                    className={cn(
                      "group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 relative",
                      pathname === item.href
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    {pathname === item.href && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-primary rounded-r" />
                    )}
                    <item.icon
                      className={cn(
                        "mr-3 h-4 w-4 transition-all duration-200",
                        pathname === item.href
                          ? "text-primary"
                          : "text-muted-foreground/70 group-hover:text-muted-foreground"
                      )}
                    />
                    <span>{item.label}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* User section */}
      <div className="border-t border-border/50 p-4 bg-muted/5">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <span className="text-sm font-medium">
              {user?.username?.charAt(0).toUpperCase() ||
                user?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.username || user?.email}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
          <ThemeToggle />
        </div>
        
        {/* Workout status - separate from other controls */}
        <div className="mb-3 px-1">
          <ShameWidget
            className="w-full"
            showToast={false}
          />
        </div>
        
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground h-10"
          onClick={() => signOut.mutate()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50 h-10 w-10 bg-background/80 backdrop-blur-sm border border-border/50"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden",
          isMobileMenuOpen ? "block" : "hidden"
        )}
      >
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <nav className="fixed left-0 top-0 bottom-0 w-72 bg-background border-r border-border flex flex-col">
          {sidebarContent}
        </nav>
      </div>

      {/* Desktop sidebar */}
      <nav className="hidden md:flex w-72 border-r border-border bg-muted/5 flex-col h-screen sticky top-0">
        {sidebarContent}
      </nav>
    </>
  );
}
