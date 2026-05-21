import React from 'react';
import * as LucideIcons from 'lucide-react';

interface IconRendererProps {
  name: string;
  size?: number;
  className?: string;
}

export function IconRenderer({ name, size = 24, className }: IconRendererProps) {
  const IconComponent = (LucideIcons as any)[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in lucide-react`);
    return <LucideIcons.HelpCircle size={size} className={className} />;
  }
  
  return <IconComponent size={size} className={className} />;
}
