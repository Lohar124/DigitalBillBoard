'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const navItems = [
  { title: 'Leaderboard', href: '/' },
  { title: 'About', href: '/about' },
  { title: 'Rules', href: '/rules' },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { isMobile } = useSidebar();

  if (!isMobile) return null;

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-border/60">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 p-[1px] shadow-xs">
            <div className="size-full bg-background rounded-[7px] flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="size-4 text-amber-500"
              >
                <rect x="3" y="3" width="18" height="13" rx="2.5" stroke="currentColor" strokeWidth="2" />
                <path d="M7 8h10M7 11h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M9 16v5M15 16v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M6 21h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <div className="font-bold text-lg tracking-tight">
            <span className="text-foreground">Digital </span>
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              BillBoard
            </span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="p-2">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                isActive={pathname === item.href}
                className={cn(pathname === item.href && 'bg-muted font-semibold')}
                render={<Link href={item.href} />}
              >
                {item.title}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
