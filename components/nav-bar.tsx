'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Image, Settings, Chrome as Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NavBar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/chat', label: 'Chat', icon: MessageSquare },
    { href: '/images', label: 'Images', icon: Image },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            <span className="text-lg font-semibold">Universal AI</span>
          </div>
          <div className="flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Button
                  key={item.href}
                  asChild
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="sm"
                >
                  <Link href={item.href} className="gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
