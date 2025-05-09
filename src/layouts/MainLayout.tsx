import { AppSidebar } from "@/components/common/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as React from "react";

interface RouteConfig {
  parent?: string;
  label: string;
  path: string;
}

const ROUTE_MAP: Record<string, RouteConfig> = {
  users: {
    parent: "Management",
    label: "Users",
    path: "/users",
  },
  locations: {
    parent: "Masters",
    label: "Locations",
    path: "/locations",
  },
  packages: {
    parent: "Masters",
    label: "Packages",
    path: "/packages",
  },
  countries: {
    parent: "Masters",
    label: "Countries",
    path: "/countries",
  },
  states: {
    parent: "Masters",
    label: "States",
    path: "/states",
  },
  cities: {
    parent: "Masters",
    label: "Cities",
    path: "/cities",
  },
  sectors: {
    parent: "Masters",
    label: "Sectors",
    path: "/sectors",
  },
  branches: {
    parent: "Masters",
    label: "Branches",
    path: "/branches",
  },
};

export default function MainLayout() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      return savedTheme === "dark";
    }
    // If no saved preference, check system preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Effect to sync dark mode state with HTML class
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  // Effect to listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) {
        setIsDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const location = useLocation();

  const getBreadcrumbs = () => {
    const currentPath = location.pathname.split("/").filter(Boolean)[0];

    // If the current path is in our route map and has a parent
    const route = ROUTE_MAP[currentPath];
    if (route && route.parent) {
      return [
        {
          label: route.parent,
          path: "",
          isLast: false,
        },
        {
          label: route.label,
          path: route.path,
          isLast: true,
        },
      ];
    }

    // Default fallback for unmapped routes
    return [
      {
        label: currentPath
          ? currentPath.charAt(0).toUpperCase() + currentPath.slice(1)
          : "Home",
        path: `/${currentPath}`,
        isLast: true,
      },
    ];
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem("theme", newDarkMode ? "dark" : "light");
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Sticky Header */}
        <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-background shadow-sm transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4 w-full justify-between">
            {/* Sidebar Trigger and Breadcrumb */}
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  {getBreadcrumbs().map((crumb, index) => (
                    <div key={crumb.path} className="flex items-center">
                      <BreadcrumbItem className="hidden md:block">
                        {crumb.isLast ? (
                          <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink href={crumb.path}>
                            {crumb.label}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {!crumb.isLast && (
                        <BreadcrumbSeparator className="hidden md:block" />
                      )}
                    </div>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Dark Mode Switcher */}
            <Button
              onClick={toggleDarkMode}
              className="size-7 cursor-pointer"
              variant="ghost"
              size="icon"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Moon /> : <Sun />}
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <main className="pt-2">
          {/* Add padding to prevent content from being hidden */}
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}