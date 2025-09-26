import { useQuery } from "@tanstack/react-query";
import type { BlockWithLinks } from "@shared/schema";

export function useBlocks() {
  const {
    data: blocks = [],
    isLoading,
    error,
  } = useQuery<BlockWithLinks[]>({
    queryKey: ["/api/blocks"],
  });

  return {
    blocks,
    isLoading,
    error,
  };
}

export function useBlock(id: string) {
  const {
    data: block,
    isLoading,
    error,
  } = useQuery<BlockWithLinks>({
    queryKey: ["/api/blocks", id],
    enabled: !!id,
  });

  return {
    block,
    isLoading,
    error,
  };
}
