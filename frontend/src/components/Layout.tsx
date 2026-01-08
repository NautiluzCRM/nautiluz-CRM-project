import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { BottomNav } from "./BottomNav";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="h-screen flex w-full bg-background overflow-hidden">

        <div className="hidden md:flex h-full border-r border-border bg-sidebar z-20"> {/* Sidebar escondido em telas pequenas */}
           <AppSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0 w-full h-full relative overflow-hidden">
          <Header />
          <main className="flex-1 overflow-hidden h-full pb-16 md:pb-0">
            {children}
          </main>
          <BottomNav />
        </div>
      </div>
    </SidebarProvider>
  );
}