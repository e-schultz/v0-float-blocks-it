import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle } from "lucide-react";
import type { CommentWithReplies } from "@shared/schema";

interface DiscussionThreadProps {
  blockId: string;
}

interface CommentItemProps {
  comment: CommentWithReplies;
  blockId: string;
  onReply: (parentId: string) => void;
}

function CommentItem({ comment, blockId, onReply }: CommentItemProps) {
  const initials = comment.authorName
    .split(" ")
    .map(name => name[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-3">
      <div className="flex space-x-3">
        <Avatar className="w-7 h-7">
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="bg-background rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-medium text-sm">{comment.authorName}</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
          </div>
          <div className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReply(comment.id)}
              className="text-xs h-6 px-2"
              data-testid={`button-reply-${comment.id}`}
            >
              Reply
            </Button>
          </div>
          
          {/* Nested replies */}
          {comment.replies.length > 0 && (
            <div className="discussion-thread mt-3">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  blockId={blockId}
                  onReply={onReply}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DiscussionThread({ blockId }: DiscussionThreadProps) {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: comments = [], isLoading } = useQuery<CommentWithReplies[]>({
    queryKey: ["/api/blocks", blockId, "comments"],
  });

  const createCommentMutation = useMutation({
    mutationFn: async (commentData: { content: string; parentId?: string }) => {
      const response = await apiRequest("POST", `/api/blocks/${blockId}/comments`, {
        content: commentData.content,
        parentId: commentData.parentId,
        authorId: "current-user", // In a real app, this would come from auth
        authorName: "Current User",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blocks", blockId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blocks"] });
      setNewComment("");
      setReplyingTo(null);
      toast({
        title: "Comment added",
        description: "Your comment has been posted",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    createCommentMutation.mutate({
      content: newComment.trim(),
      parentId: replyingTo || undefined,
    });
  };

  const handleReply = (parentId: string) => {
    setReplyingTo(parentId);
    // Focus the textarea
    setTimeout(() => {
      const textarea = document.querySelector(`[data-testid="textarea-comment-${blockId}"]`) as HTMLTextAreaElement;
      textarea?.focus();
    }, 100);
  };

  if (isLoading) {
    return (
      <div className="border-t border-border bg-muted/30 p-4">
        <div className="animate-pulse space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-muted rounded-full"></div>
            <div className="h-4 bg-muted rounded w-24"></div>
          </div>
          <div className="h-16 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-border bg-muted/30">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center">
            <MessageCircle className="w-4 h-4 mr-2 text-accent" />
            Discussion ({comments.length})
          </h3>
        </div>

        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet. Start the discussion!</p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment: CommentWithReplies) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                blockId={blockId}
                onReply={handleReply}
              />
            ))}
          </div>
        )}

        {/* Comment Input */}
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <Avatar className="w-7 h-7">
            <AvatarFallback className="text-xs">You</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            {replyingTo && (
              <div className="text-xs text-muted-foreground">
                Replying to comment...{" "}
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-xs"
                  onClick={() => setReplyingTo(null)}
                >
                  Cancel
                </Button>
              </div>
            )}
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="min-h-[60px] resize-none"
              data-testid={`textarea-comment-${blockId}`}
            />
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNewComment("");
                  setReplyingTo(null);
                }}
                data-testid={`button-cancel-comment-${blockId}`}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!newComment.trim() || createCommentMutation.isPending}
                data-testid={`button-submit-comment-${blockId}`}
              >
                {createCommentMutation.isPending ? "Posting..." : "Comment"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
