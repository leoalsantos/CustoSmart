import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ScrollToBottomButtonProps {
  onClick: () => void;
  showBadge?: boolean;
  badgeCount?: number;
}

export function ScrollToBottomButton({
  onClick,
  showBadge = false,
  badgeCount
}: ScrollToBottomButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="rounded-full shadow-md bg-background hover:bg-background flex items-center justify-center"
      onClick={onClick}
    >
      <ChevronDown className="h-4 w-4 mr-1" />
      <span className="text-xs">Novas mensagens</span>
      {showBadge && badgeCount && badgeCount > 0 && (
        <Badge variant="destructive" className="ml-2">{badgeCount}</Badge>
      )}
    </Button>
  );
}