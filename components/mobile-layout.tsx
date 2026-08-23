'use client';

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

// Always mounted so `useSidebar()` (e.g. in Header's SidebarTrigger) never
// throws. AppSidebar itself no-ops on desktop, so this has no layout effect
// there — see the isMobile guard in app-sidebar.tsx.
export function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      {/* flex-1: without it this flex item shrinks to its content's width
          instead of filling the row, which pushes centered content (mx-auto)
          to the left edge instead of the middle of the viewport. */}
      <div className="flex-1 min-w-0">{children}</div>
    </SidebarProvider>
  );
}
