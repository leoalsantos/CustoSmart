import React, { useState } from 'react';
import { Info } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from '@/lib/utils';

interface HelpBubbleProps {
  title: string;
  content: string;
  illustration?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  triggerClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'info' | 'tip' | 'warning';
}

export function HelpBubble({
  title,
  content,
  illustration,
  position = 'top',
  className,
  triggerClassName,
  size = 'md',
  variant = 'info'
}: HelpBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Variantes de cores baseadas no tipo
  const variantStyles = {
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-500',
      title: 'text-blue-700 dark:text-blue-300',
    },
    tip: {
      bg: 'bg-green-50 dark:bg-green-950',
      border: 'border-green-200 dark:border-green-800',
      icon: 'text-green-500',
      title: 'text-green-700 dark:text-green-300',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950',
      border: 'border-amber-200 dark:border-amber-800',
      icon: 'text-amber-500',
      title: 'text-amber-700 dark:text-amber-300',
    },
  };

  // Tamanhos para o ícone do trigger
  const sizeStyles = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  // Tamanhos para o conteúdo do popover
  const contentSizeStyles = {
    sm: 'max-w-[200px]',
    md: 'max-w-[280px]',
    lg: 'max-w-[350px]',
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center justify-center rounded-full p-1 transition-colors",
            "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring",
            variantStyles[variant].icon,
            triggerClassName
          )}
          aria-label={`Ajuda sobre ${title}`}
        >
          <Info className={cn(sizeStyles[size])} />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn(
          "p-0 w-auto shadow-md animate-in fade-in-50",
          variantStyles[variant].bg,
          variantStyles[variant].border,
          contentSizeStyles[size],
          className
        )}
        side={position}
        align="center"
      >
        <div className="p-4">
          <h3 className={cn(
            "font-semibold mb-2 text-sm",
            variantStyles[variant].title,
          )}>
            {title}
          </h3>
          
          {illustration && (
            <div className="flex justify-center mb-3">
              <img
                src={illustration}
                alt={`Ilustração para ${title}`}
                className="max-h-32 rounded-md"
              />
            </div>
          )}
          
          <p className="text-sm text-muted-foreground">{content}</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}