import React from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border border-dashed border-primary/20 bg-card/40 backdrop-blur-sm transition-all hover:border-primary/40 ${className}`}
    >
      <div className="relative mb-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary/20 via-secondary/15 to-accent/20 flex items-center justify-center text-primary shadow-inner border border-primary/20">
          <Icon className="w-7 h-7" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-primary/20 animate-ping" />
      </div>

      <h3 className="text-sm sm:text-base font-heading font-semibold text-foreground tracking-tight">
        {title}
      </h3>
      <p className="text-xs text-muted-foreground mt-1 max-w-sm sm:max-w-md leading-relaxed">
        {description}
      </p>

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
          {actionLabel && onAction && (
            <Button
              size="sm"
              onClick={onAction}
              className="h-8 text-xs px-3.5 gradient-button font-heading font-semibold shadow-sm"
            >
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              size="sm"
              variant="outline"
              onClick={onSecondaryAction}
              className="h-8 text-xs px-3 text-muted-foreground hover:text-foreground border-border/80"
            >
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
