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
  originalBlockId?: string; // Link to original block if converted
}

interface ThreadViewProps {
  blocks: BlockWithLinks[];
  isLoading: boolean;
}

export default function ThreadView({ blocks, isLoading }: ThreadViewProps) {
  const [messages, setMessages] = useState<ThreadMessage[]>(() => 
    // Convert blocks to messages initially
    blocks.map(block => ({
      id: block.id,
      content: `# ${block.title}\n\n${block.content}`,
      role: "You" as MessageRole,
      createdAt: new Date(block.createdAt),
      updatedAt: new Date(block.updatedAt),
      originalBlockId: block.id
    }))
  );

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Update messages when blocks change
  useEffect(() => {
    const newMessages = blocks.map(block => ({
      id: block.id,
      content: `# ${block.title}\n\n${block.content}`,
      role: "You" as MessageRole,
      createdAt: new Date(block.createdAt),
      updatedAt: new Date(block.updatedAt),
      originalBlockId: block.id
    }));
    setMessages(newMessages);
  }, [blocks]);

  const updateMessageMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: { content?: string; role?: MessageRole } }) => {
      const message = messages.find(m => m.id === id);
      if (message?.originalBlockId && updates.content) {
        // Parse title and content from the message format
        const lines = updates.content.split('\n');
        const titleLine = lines.find(line => line.startsWith('# '));
        const title = titleLine ? titleLine.substring(2).trim() : 'Untitled';
        const contentStart = lines.findIndex(line => line.startsWith('# ')) + 1;
        const content = lines.slice(contentStart + 1).join('\n').trim(); // Skip empty line after title

        const response = await apiRequest("PUT", `/api/blocks/${message.originalBlockId}`, {
          title,
          content
        });
        return response.json();
      }
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blocks"] });
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
        ? { ...msg, ...updates, updatedAt: new Date() }
        : msg
    ));
    
    updateMessageMutation.mutate({ id, updates });
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
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">💭</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Start your first thread</h3>
                <p className="text-muted-foreground">
                  Click below to create your first message, or use the terminal command bar
                </p>
              </div>
              <button
                onClick={handleAddMessage}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-accent text-accent-foreground rounded-md hover:bg-accent/90 transition-colors"
                data-testid="button-add-first-message"
              >
                <span>+</span>
                <span>Add message</span>
              </button>
            </div>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}