import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

type MessageRole = "You" | "Assistant" | "System";

interface MessageBlockProps {
  id: string;
  content: string;
  role: MessageRole;
  createdAt: Date;
  updatedAt: Date;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: { content?: string; role?: MessageRole }) => void;
  isFirst?: boolean;
}

export default function MessageBlock({ 
  id, 
  content: initialContent, 
  role: initialRole, 
  createdAt, 
  updatedAt,
  onDelete,
  onUpdate,
  isFirst = false 
}: MessageBlockProps) {
  const [content, setContent] = useState(initialContent);
  const [role, setRole] = useState<MessageRole>(initialRole);
  const [isEditing, setIsEditing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (updates: { content?: string; role?: MessageRole }) => {
      // For now, we'll just track changes locally since the backend expects specific schema
      return updates;
    },
    onSuccess: (updates) => {
      onUpdate(id, updates);
      setIsDirty(false);
      toast({
        title: "Message updated",
        description: "Your changes have been saved",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update message",
        variant: "destructive",
      });
    },
  });

  // Auto-save when content changes and user stops typing
  useEffect(() => {
    if (isDirty && content !== initialContent) {
      const timeout = setTimeout(() => {
        updateMutation.mutate({ content });
      }, 1000); // Auto-save after 1 second of no typing
      
      return () => clearTimeout(timeout);
    }
  }, [content, isDirty, initialContent, updateMutation]);

  // Handle keyboard shortcuts in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    
    // Delete entire block when cursor is at beginning and backspace/delete is pressed
    if ((e.key === 'Backspace' || e.key === 'Delete') && textarea.selectionStart === 0 && textarea.selectionEnd === 0) {
      e.preventDefault();
      handleDelete();
      return;
    }
    
    // Submit message with Cmd+Enter (like Zed)
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
      return;
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content, isEditing]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setIsDirty(true);
  };

  const handleRoleClick = () => {
    const roles: MessageRole[] = ["You", "Assistant", "System"];
    const currentIndex = roles.indexOf(role);
    const nextRole = roles[(currentIndex + 1) % roles.length];
    setRole(nextRole);
    updateMutation.mutate({ role: nextRole });
  };

  const handleDelete = () => {
    onDelete(id);
  };

  const handleSubmit = () => {
    if (role === "You" && content.trim()) {
      // Create a new Assistant response block
      // This would trigger LLM response in a real implementation
      toast({
        title: "Message submitted",
        description: "Response generation would happen here",
      });
    }
  };

  const handleFocus = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const getRoleColor = (role: MessageRole) => {
    switch (role) {
      case "You":
        return "text-blue-600 dark:text-blue-400";
      case "Assistant":
        return "text-purple-600 dark:text-purple-400";
      case "System":
        return "text-orange-600 dark:text-orange-400";
      default:
        return "text-muted-foreground";
    }
  };

  const getBlockStyle = (role: MessageRole) => {
    switch (role) {
      case "You":
        return "border-l-blue-200 dark:border-l-blue-800 bg-blue-50/50 dark:bg-blue-950/20";
      case "Assistant":
        return "border-l-purple-200 dark:border-l-purple-800 bg-purple-50/50 dark:bg-purple-950/20";
      case "System":
        return "border-l-orange-200 dark:border-l-orange-800 bg-orange-50/50 dark:bg-orange-950/20";
      default:
        return "border-l-muted bg-background";
    }
  };

  return (
    <div 
      ref={blockRef}
      className={cn(
        "group border-l-4 pl-4 py-2 transition-all duration-200",
        getBlockStyle(role),
        isEditing && "ring-1 ring-accent/30",
        !isFirst && "mt-1"
      )}
      data-testid={`message-block-${id}`}
    >
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={handleRoleClick}
          className={cn(
            "text-sm font-medium px-2 py-1 rounded hover:bg-background/50 transition-colors",
            getRoleColor(role)
          )}
          data-testid={`role-${role.toLowerCase()}-${id}`}
        >
          {role}
        </button>
        
        <div className="flex items-center space-x-2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          {isDirty && <span className="text-yellow-600">•</span>}
          <span>{formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}</span>
          <button
            onClick={handleDelete}
            className="text-destructive hover:text-destructive/80 px-1 py-0.5 rounded"
            data-testid={`button-delete-${id}`}
          >
            ×
          </button>
        </div>
      </div>

      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={role === "You" ? "Type your message here..." : "Response content..."}
        className={cn(
          "w-full bg-transparent border-none resize-none outline-none",
          "font-mono text-sm leading-relaxed",
          "placeholder:text-muted-foreground/50",
          isEditing ? "ring-0" : "cursor-pointer"
        )}
        style={{ minHeight: "2rem" }}
        data-testid={`textarea-${id}`}
      />
      
      {role === "You" && isEditing && (
        <div className="mt-2 text-xs text-muted-foreground">
          Press <kbd className="px-1 py-0.5 bg-muted rounded">Cmd+Enter</kbd> to submit
        </div>
      )}
    </div>
  );
}