import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onerror = (error) => {
      console.error("WebSocket connection error:", error);
      // Don't crash the app if WebSocket fails
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case "block_created":
            queryClient.invalidateQueries({ queryKey: ["/api/blocks"] });
            queryClient.invalidateQueries({ queryKey: ["/api/graph"] });
            toast({
              title: "New block created",
              description: `"${message.data.title}" was added`,
            });
            break;

          case "block_updated":
            queryClient.invalidateQueries({ queryKey: ["/api/blocks"] });
            queryClient.invalidateQueries({ queryKey: ["/api/blocks", message.data.id] });
            break;

          case "block_deleted":
            queryClient.invalidateQueries({ queryKey: ["/api/blocks"] });
            queryClient.invalidateQueries({ queryKey: ["/api/graph"] });
            toast({
              title: "Block deleted",
              description: "A block was removed",
            });
            break;

          case "link_created":
            queryClient.invalidateQueries({ queryKey: ["/api/blocks"] });
            queryClient.invalidateQueries({ queryKey: ["/api/links"] });
            queryClient.invalidateQueries({ queryKey: ["/api/graph"] });
            toast({
              title: "Blocks linked",
              description: "A new connection was created",
            });
            break;

          case "link_deleted":
            queryClient.invalidateQueries({ queryKey: ["/api/blocks"] });
            queryClient.invalidateQueries({ queryKey: ["/api/links"] });
            queryClient.invalidateQueries({ queryKey: ["/api/graph"] });
            break;

          case "comment_created":
            queryClient.invalidateQueries({ 
              queryKey: ["/api/blocks", message.data.blockId, "comments"] 
            });
            queryClient.invalidateQueries({ queryKey: ["/api/blocks"] });
            break;

          case "comment_deleted":
            queryClient.invalidateQueries({ 
              queryKey: ["/api/blocks"] 
            });
            break;

          default:
            console.log("Unknown message type:", message.type);
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [queryClient, toast]);

  return wsRef.current;
}
