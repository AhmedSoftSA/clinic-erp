import type { ReactNode } from "react";
import { AdminMobileTabs, Sidebar } from "./Sidebar";

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-mist md:h-screen md:overflow-hidden">
      <Sidebar />
      <main className="min-w-0 flex-1 pb-24 md:overflow-y-auto md:pb-0">{children}</main>
      <AdminMobileTabs />
    </div>
  );
}
