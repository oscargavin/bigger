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
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";

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
  const [mounted, setMounted] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  const { data: user } = api.auth.getUser.useQuery();
  const { data: pendingRequests } = api.pairings.getPendingRequests.useQuery();
  const signOut = api.auth.signOut.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  // Scroll detection for mobile menu button
  const lastScrollY = useRef(0);
  const scrollDirection = useRef<"up" | "down">("up");
  const [showMobileButton, setShowMobileButton] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let ticking = false;

    const updateScrollDirection = () => {
      // Find the main element that has the scroll
      const mainElement = document.querySelector('main');
      if (!mainElement) return;
      
      const scrollY = mainElement.scrollTop;

      if (Math.abs(scrollY - lastScrollY.current) < 10) {
        ticking = false;
        return;
      }

      if (scrollY > lastScrollY.current && scrollY > 100) {
        // Scrolling down and past threshold
        if (scrollDirection.current !== "down") {
          scrollDirection.current = "down";
          setShowMobileButton(false);
        }
      } else if (scrollY < lastScrollY.current) {
        // Scrolling up
        if (scrollDirection.current !== "up") {
          scrollDirection.current = "up";
          setShowMobileButton(true);
        }
      }

      lastScrollY.current = scrollY;
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking = true;
      }
    };

    // Find and attach to the main scrollable element
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      const el = document.querySelector('main');
      if (el) {
        el.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  // Use resolved theme to handle system theme
  const currentTheme = mounted ? resolvedTheme || theme : "light";

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
          <span
            className={cn(
              "text-xl font-semibold tracking-tight",
              currentTheme === "dark" ? "text-gray-100" : "text-gray-900"
            )}
          >
            Bigger
          </span>
        </Link>
      </div>

      {/* Main navigation */}
      <div className="flex-1 px-3 pb-8 overflow-y-auto">
        <div className="space-y-8">
          {sidebarSections.map((section) => (
            <div key={section.label}>
              <h3
                className={cn(
                  "px-3 mb-2 text-xs font-medium uppercase tracking-wider",
                  currentTheme === "dark" ? "text-gray-400" : "text-gray-500"
                )}
              >
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
                          ? currentTheme === "dark"
                            ? "bg-blue-950/20 text-blue-400"
                            : "bg-blue-50 text-blue-600"
                          : currentTheme === "dark"
                          ? "text-gray-300 hover:bg-gray-800 hover:text-gray-100"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      )}
                    >
                      {pathname === item.href && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-primary rounded-r" />
                      )}
                      <item.icon
                        className={cn(
                          "mr-3 h-4 w-4 transition-all duration-200",
                          pathname === item.href
                            ? currentTheme === "dark"
                              ? "text-blue-400"
                              : "text-blue-600"
                            : currentTheme === "dark"
                            ? "text-gray-400 group-hover:text-gray-300"
                            : "text-gray-500 group-hover:text-gray-700"
                        )}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.label === "Buddy" &&
                        pendingRequests &&
                        pendingRequests.length > 0 && (
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
                        ? currentTheme === "dark"
                          ? "bg-blue-950/20 text-blue-400"
                          : "bg-blue-50 text-blue-600"
                        : currentTheme === "dark"
                        ? "text-gray-300 hover:bg-gray-800 hover:text-gray-100"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    {pathname === item.href && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-primary rounded-r" />
                    )}
                    <item.icon
                      className={cn(
                        "mr-3 h-4 w-4 transition-all duration-200",
                        pathname === item.href
                          ? currentTheme === "dark"
                            ? "text-blue-400"
                            : "text-blue-600"
                          : currentTheme === "dark"
                          ? "text-gray-400 group-hover:text-gray-300"
                          : "text-gray-500 group-hover:text-gray-700"
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
      <div
        className={cn(
          "border-t p-4",
          currentTheme === "dark"
            ? "border-zinc-800 bg-zinc-800"
            : "border-gray-200 bg-gray-50"
        )}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center overflow-hidden",
              currentTheme === "dark" ? "bg-gray-700" : "bg-gray-200"
            )}
          >
            {user?.avatar_url || user?.avatarUrl ? (
              <Image
                src={user?.avatar_url || user?.avatarUrl || ""}
                alt="Profile"
                width={40}
                height={40}
                className="object-cover w-full h-full"
              />
            ) : (
              <span
                className={cn(
                  "text-sm font-medium",
                  currentTheme === "dark" ? "text-gray-200" : "text-gray-700"
                )}
              >
                {user?.username?.charAt(0).toUpperCase() ||
                  user?.email?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "text-sm font-medium truncate",
                currentTheme === "dark" ? "text-gray-100" : "text-gray-900"
              )}
            >
              {user?.username || user?.email}
            </p>
            <p
              className={cn(
                "text-xs truncate",
                currentTheme === "dark" ? "text-gray-400" : "text-gray-500"
              )}
            >
              {user?.email}
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Workout status - separate from other controls */}
        <div className="mb-3 px-1">
          <ShameWidget className="w-full" showToast={false} />
        </div>

        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start h-10",
            currentTheme === "dark"
              ? "text-gray-400 hover:text-gray-100 hover:bg-gray-800"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
          )}
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
      <AnimatePresence>
        {(showMobileButton || isMobileMenuOpen) && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              opacity: { duration: 0.2 }
            }}
            className="md:hidden fixed top-4 left-4 z-50"
          >
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10 rounded-lg border shadow-sm hover:shadow-md transition-shadow duration-200",
                currentTheme === "dark" 
                  ? "bg-zinc-900 border-zinc-700" 
                  : "bg-white border-gray-200"
              )}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <motion.div
                initial={false}
                animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Menu className="h-5 w-5 text-muted-foreground" />
                )}
              </motion.div>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={cn(
                "fixed inset-0 z-40 md:hidden backdrop-blur-sm",
                currentTheme === "dark"
                  ? "bg-black/60"
                  : "bg-black/40"
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Sidebar */}
            <motion.nav
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={cn(
                "fixed left-0 top-0 bottom-0 w-72 flex flex-col z-50 md:hidden shadow-xl",
                currentTheme === "dark"
                  ? "bg-zinc-900 border-r border-zinc-800"
                  : "bg-white border-r border-gray-200"
              )}
            >
              {sidebarContent}
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <nav
        className={cn(
          "hidden md:flex w-72 flex-col h-screen sticky top-0",
          currentTheme === "dark"
            ? "bg-zinc-900 border-r border-zinc-800"
            : "bg-white border-r border-gray-200"
        )}
      >
        {sidebarContent}
      </nav>
    </>
  );
}
