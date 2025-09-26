import { useState, useCallback, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import MessageBlock from "@/components/message-block";
import type { BlockWithLinks } from "@shared/schema";
import { nanoid } from "nanoid";

type MessageRole = "You" | "Assistant" | "System";

interface ThreadMessage {
  id: string;
  content: string;
  role: MessageRole;
  createdAt: Date;
  updatedAt: Date;
  lastSyncedBlockUpdatedAt?: string; // Track when we last synced with backend
  originalBlockId?: string; // Link to original block if converted
}

interface ThreadViewProps {
  blocks: BlockWithLinks[];
  isLoading: boolean;
}

export default function ThreadView({ blocks, isLoading }: ThreadViewProps) {
  const [messages, setMessages] = useState<ThreadMessage[]>(() => {
    const convertedBlocks = blocks.map(block => ({
      id: block.id,
      content: `# ${block.title}\n\n${block.content}`,
      role: "You" as MessageRole,
      createdAt: new Date(block.createdAt),
      updatedAt: new Date(block.updatedAt),
      originalBlockId: block.id
    }));

    // Always ensure we have at least one empty message to start with
    if (convertedBlocks.length === 0) {
      return [{
        id: nanoid(),
        content: "",
        role: "You" as MessageRole,
        createdAt: new Date(),
        updatedAt: new Date()
      }];
    }

    return convertedBlocks;
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Update messages when blocks change, preserving existing roles and local state
  useEffect(() => {
    setMessages(prevMessages => {
      // Create a map of existing messages by ID for quick lookup
      const existingMessagesMap = new Map(
        prevMessages.map(msg => [msg.id, msg])
      );

      const newMessages = blocks.map(block => {
        const existingMessage = existingMessagesMap.get(block.id);
        
        // If we have an existing message, preserve its role and other local state
        if (existingMessage && existingMessage.originalBlockId === block.id) {
          const shouldUpdateContent = !existingMessage.lastSyncedBlockUpdatedAt || 
                                    block.updatedAt > existingMessage.lastSyncedBlockUpdatedAt;
          
          return {
            ...existingMessage,
            // Update content only if the backend block actually changed since last sync
            content: shouldUpdateContent 
              ? `# ${block.title}\n\n${block.content}`
              : existingMessage.content,
            createdAt: new Date(block.createdAt),
            // Don't update updatedAt from backend - keep local changes
            lastSyncedBlockUpdatedAt: block.updatedAt,
          };
        }

        // New message - use default role
        return {
          id: block.id,
          content: `# ${block.title}\n\n${block.content}`,
          role: "You" as MessageRole,
          createdAt: new Date(block.createdAt),
          updatedAt: new Date(block.updatedAt),
          lastSyncedBlockUpdatedAt: block.updatedAt,
          originalBlockId: block.id
        };
      });

      // Add any messages that don't correspond to blocks (user-created messages)
      const blockIds = new Set(blocks.map(b => b.id));
      const userMessages = prevMessages.filter(msg => !msg.originalBlockId || !blockIds.has(msg.id));
      
      const allMessages = [...newMessages, ...userMessages];
      
      // Always ensure we have at least one empty message available
      if (allMessages.length === 0) {
        return [{
          id: nanoid(),
          content: "",
          role: "You" as MessageRole,
          createdAt: new Date(),
          updatedAt: new Date()
        }];
      }

      return allMessages;
    });
  }, [blocks]);

  const updateMessageMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: { content?: string; role?: MessageRole } }) => {
      const message = messages.find(m => m.id === id);
      if (message?.originalBlockId && updates.content) {
        // Parse title and content from the message format
        const lines = updates.content.split('\n');
        const titleLineIndex = lines.findIndex(line => line.startsWith('# '));
        
        let title: string;
        let content: string;
        
        if (titleLineIndex !== -1) {
          // Title found
          title = lines[titleLineIndex].substring(2).trim();
          // Content starts after the title line and optional blank line
          const contentStartIndex = titleLineIndex + 1;
          const nextContentIndex = lines[contentStartIndex] === '' ? contentStartIndex + 1 : contentStartIndex;
          content = lines.slice(nextContentIndex).join('\n').trim();
        } else {
          // No title found, treat entire content as message content
          title = 'Message';
          content = updates.content.trim();
        }

        const response = await apiRequest("PUT", `/api/blocks/${message.originalBlockId}`, {
          title,
          content
        });
        const result = await response.json();
        return { result, blockUpdated: true };
      }
      return { result: null, blockUpdated: false };
    },
    onSuccess: (data) => {
      // Only invalidate queries if we actually made a backend request
      if (data?.blockUpdated) {
        queryClient.invalidateQueries({ queryKey: ["/api/blocks"] });
      }
    }
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (id: string) => {
      const message = messages.find(m => m.id === id);
      if (message?.originalBlockId) {
        const response = await apiRequest("DELETE", `/api/blocks/${message.originalBlockId}`);
        return response.json();
      }
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blocks"] });
    }
  });

  const handleMessageUpdate = useCallback((id: string, updates: { content?: string; role?: MessageRole }) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id 
        ? { 
            ...msg, 
            ...updates, 
            // Only update timestamp for content changes, not role changes
            updatedAt: updates.content !== undefined ? new Date() : msg.updatedAt 
          }
        : msg
    ));
    
    // Only trigger backend mutation for content changes
    if (updates.content !== undefined) {
      updateMessageMutation.mutate({ id, updates });
    }
  }, [updateMessageMutation]);

  const handleMessageDelete = useCallback((id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
    deleteMessageMutation.mutate(id);
    
    toast({
      title: "Message deleted",
      description: "The message has been removed",
    });
  }, [deleteMessageMutation, toast]);

  const handleAddMessage = useCallback(() => {
    const newMessage: ThreadMessage = {
      id: nanoid(),
      content: "",
      role: "You",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border-l-4 border-l-muted pl-4 py-2">
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-muted rounded w-16"></div>
              <div className="h-20 bg-muted rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="space-y-0 font-mono">
        <>
          {messages.map((message, index) => (
            <MessageBlock
              key={message.id}
              id={message.id}
              content={message.content}
              role={message.role}
              createdAt={message.createdAt}
              updatedAt={message.updatedAt}
              onUpdate={handleMessageUpdate}
              onDelete={handleMessageDelete}
              isFirst={index === 0}
            />
          ))}
          
          <button
            onClick={handleAddMessage}
            className="mt-4 w-full border-2 border-dashed border-muted hover:border-accent/50 rounded-lg p-4 text-center transition-colors group"
            data-testid="button-add-message"
          >
            <div className="space-y-2">
              <div className="text-2xl text-muted-foreground group-hover:text-accent transition-colors">+</div>
              <p className="text-muted-foreground group-hover:text-foreground text-sm">
                Add new message
              </p>
            </div>
          </button>
        </>
      </div>
    </div>
  );
}