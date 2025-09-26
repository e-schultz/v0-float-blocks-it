import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import DiscussionThread from "@/components/discussion-thread";
import { formatDistanceToNow } from "date-fns";
import { GripVertical, MessageCircle, Link as LinkIcon, MoreHorizontal } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { BlockWithLinks } from "@shared/schema";

interface ContentBlockProps {
  block: BlockWithLinks;
}

export default function ContentBlock({ block }: ContentBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDiscussion, setShowDiscussion] = useState(false);
  const [title, setTitle] = useState(block.title);
  const [content, setContent] = useState(block.content);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateBlockMutation = useMutation({
    mutationFn: async (updates: { title?: string; content?: string }) => {
      const response = await apiRequest("PUT", `/api/blocks/${block.id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blocks"] });
      toast({
        title: "Block updated",
        description: "Your changes have been saved",
      });
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update block",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (title !== block.title || content !== block.content) {
      updateBlockMutation.mutate({ title, content });
    } else {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setTitle(block.title);
    setContent(block.content);
    setIsEditing(false);
  };

  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;

  return (
    <div className="group bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all content-block">
      <div className="flex items-start space-x-3 p-4">
        {/* Drag Handle */}
        <div className="block-handle mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
        </div>

        <div className="flex-1 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xl font-display font-semibold bg-transparent border-none outline-none focus:ring-0 flex-1"
                data-testid={`input-title-${block.id}`}
              />
            ) : (
              <h2 
                className="text-xl font-display font-semibold cursor-pointer"
                onClick={() => setIsEditing(true)}
                data-testid={`text-title-${block.id}`}
              >
                {block.title}
              </h2>
            )}
            
            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDiscussion(!showDiscussion)}
                className="h-8 w-8"
                data-testid={`button-discussion-${block.id}`}
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                data-testid={`button-create-link-${block.id}`}
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                data-testid={`button-more-${block.id}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="prose max-w-none">
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[100px] resize-none"
                  data-testid={`textarea-content-${block.id}`}
                />
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    onClick={handleSave}
                    disabled={updateBlockMutation.isPending}
                    data-testid={`button-save-${block.id}`}
                  >
                    {updateBlockMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleCancel}
                    data-testid={`button-cancel-${block.id}`}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div 
                className="cursor-pointer"
                onClick={() => setIsEditing(true)}
                data-testid={`text-content-${block.id}`}
              >
                {block.contentType === "code" ? (
                  <pre className="bg-terminal text-white p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <code>{block.content}</code>
                  </pre>
                ) : (
                  <div className="whitespace-pre-wrap">{block.content}</div>
                )}
              </div>
            )}
          </div>

          {/* Links */}
          {(block.linkedTo.length > 0 || block.linkedFrom.length > 0) && (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {block.linkedTo.length > 0 && (
                <>
                  <span className="text-sm text-muted-foreground">Linked to:</span>
                  {block.linkedTo.map((linkedBlock) => (
                    <Badge
                      key={linkedBlock.id}
                      variant="secondary"
                      className="text-xs bg-accent/10 text-accent hover:bg-accent/20 cursor-pointer"
                      data-testid={`link-to-${linkedBlock.id}`}
                    >
                      → {linkedBlock.title}
                    </Badge>
                  ))}
                </>
              )}
              
              {block.linkedFrom.length > 0 && (
                <>
                  <span className="text-sm text-muted-foreground">Backlinks:</span>
                  {block.linkedFrom.map((linkedBlock) => (
                    <Badge
                      key={linkedBlock.id}
                      variant="secondary"
                      className="text-xs bg-success/10 text-success hover:bg-success/20 cursor-pointer"
                      data-testid={`link-from-${linkedBlock.id}`}
                    >
                      ← {linkedBlock.title}
                    </Badge>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Tags */}
          {(block.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {(block.tags || []).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-xs"
                  data-testid={`tag-${tag}-${block.id}`}
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between pt-3 border-t border-border/50 text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span data-testid={`text-created-${block.id}`}>
                Created {formatDistanceToNow(new Date(block.createdAt), { addSuffix: true })}
              </span>
              <span data-testid={`text-author-${block.id}`}>by {block.authorName}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span data-testid={`text-word-count-${block.id}`}>{wordCount} words</span>
              <span>•</span>
              <span data-testid={`text-link-count-${block.id}`}>{block.linkCount} links</span>
              {block.commentCount > 0 && (
                <>
                  <span>•</span>
                  <span data-testid={`text-comment-count-${block.id}`}>{block.commentCount} comments</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Discussion Thread */}
      {showDiscussion && (
        <DiscussionThread blockId={block.id} />
      )}
    </div>
  );
}
