import React from 'react';
import * as LucideIcons from 'lucide-react';

interface IconRendererProps {
  name: string;
  size?: number;
  className?: string;
}

export function IconRenderer({ name, size = 24, className }: IconRendererProps) {
  // Try to find the exact case-sensitive match first
  if (typeof name !== 'string') {
    return <LucideIcons.HelpCircle size={size} className={className} />;
  }

  let Icon = (LucideIcons as any)[name];
  
  // If not found, try to find a case-insensitive match
  if (!Icon && name) {
    const iconKey = Object.keys(LucideIcons).find(k => k.toLowerCase() === name.toLowerCase());
    if (iconKey) {
        Icon = (LucideIcons as any)[iconKey];
    }
  }
  
  if (!Icon) {
    return <LucideIcons.HelpCircle size={size} className={className} />;
  }
  
  return <Icon size={size} className={className} />;
}
