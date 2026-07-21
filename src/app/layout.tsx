import type { Metadata, Viewport } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileBlocker } from "@/components/layout/MobileBlocker";
import { NotificationProvider } from "@/components/providers/NotificationProvider";
import { ProgressBarProvider } from "@/components/providers/ProgressBarProvider";
import { SubCategoryProvider } from "@/components/providers/SubCategoryProvider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: {
    template: '%s | Warehouse Ops',
    default: 'Warehouse Ops',
  },
  description: "Next generation warehouse operations management",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            try {
              if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            } catch (e) {}
          `
        }} />
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased h-screen overflow-hidden text-foreground bg-background`}
      >
        <MobileBlocker>
        <ProgressBarProvider>
          <NotificationProvider>
            <SubCategoryProvider>
            <div className="relative h-screen w-full bg-background overflow-hidden">
              <div className="absolute inset-0 z-0 pointer-events-none bg-pattern-dot opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10 flex h-full w-full">
              {/* Desktop Sidebar */}
              <Sidebar />

              {/* Main Application Area */}
              <main className="flex-1 overflow-y-auto relative z-0 w-full h-full p-4 pl-20">
                {children}
              </main>
            </div>
            
            <Toaster 
              position="top-right"
              toastOptions={{
                unstyled: true,
                classNames: {
                  toast: "flex items-center gap-3 w-auto min-w-[300px] py-3 px-4 rounded-lg shadow-xl border font-sans z-[9999]",
                  title: "text-sm font-medium leading-none",
                  description: "text-xs opacity-90 mt-1",
                  icon: "w-5 h-5 flex-shrink-0",
                  content: "flex flex-col flex-1",
                  success: "bg-emerald-500 border-emerald-600 text-white shadow-emerald-900/20",
                  error: "bg-rose-500 border-rose-600 text-white shadow-rose-900/20",
                  warning: "bg-amber-500 border-amber-600 text-white shadow-amber-900/20",
                  info: "bg-blue-500 border-blue-600 text-white shadow-blue-900/20",
                  default: "bg-zinc-800 border-zinc-900 text-white shadow-zinc-900/20 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-200",
                }
              }}
            />
          </div>
            </SubCategoryProvider>
          </NotificationProvider>
        </ProgressBarProvider>
        </MobileBlocker>
      </body>
    </html>
  );
}
