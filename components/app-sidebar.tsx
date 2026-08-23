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
      <SidebarHeader className="p-4">
        <Link href="/" className="font-bold text-xl tracking-tight">
          Digital Billboard
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                isActive={pathname === item.href}
                className={cn(pathname === item.href && 'bg-muted')}
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
