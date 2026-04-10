"use client";

import type { ReactNode } from "react";
import { RefreshCcwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";

type QueryStateProps = {
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  isEmpty: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRetry?: () => void;
  loadingText?: string;
  children: ReactNode;
};

export function QueryState({
  isLoading,
  isError,
  errorMessage,
  isEmpty,
  emptyTitle = "No data found",
  emptyDescription = "Try changing filters or add a new record.",
  onRetry,
  loadingText = "Loading...",
  children,
}: QueryStateProps) {
  if (isLoading) {
    return (
      <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
        <Spinner className="size-4" />
        <span>{loadingText}</span>
      </div>
    );
  }

  if (isError) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Something went wrong</EmptyTitle>
          <EmptyDescription>{errorMessage ?? "Request failed. Please try again."}</EmptyDescription>
        </EmptyHeader>
        {onRetry ? (
          <Button variant="outline" onClick={onRetry}>
            <RefreshCcwIcon />
            Retry
          </Button>
        ) : null}
      </Empty>
    );
  }

  if (isEmpty) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>{emptyTitle}</EmptyTitle>
          <EmptyDescription>{emptyDescription}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return <>{children}</>;
}
