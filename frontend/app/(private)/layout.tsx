import { AppSidebar } from "@/components/custom/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardHeader } from "@/components/custom/dashboard-header";
import { AuthGuard } from "@/components/custom/auth-guard";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex flex-1 flex-col overflow-hidden bg-background">
          <DashboardHeader />
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6">
            {children}
          </div>
        </main>
      </SidebarProvider>
    </AuthGuard>
  );
}
