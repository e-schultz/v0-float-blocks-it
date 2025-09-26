import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import GraphView from "@/components/graph-view";
import { formatDistanceToNow } from "date-fns";
import { List, Network, MessageCircle, Link as LinkIcon } from "lucide-react";
import type { Block } from "@shared/schema";

interface SidebarProps {
  selectedView: "blocks" | "graph";
  onViewChange: (view: "blocks" | "graph") => void;
  blocks: Block[];
  isLoading: boolean;
}

export default function Sidebar({ selectedView, onViewChange, blocks, isLoading }: SidebarProps) {
  const recentBlocks = blocks.slice(0, 10);
  const tags = Array.from(new Set(blocks.flatMap(block => block.tags || []))).slice(0, 8);

  return (
    <aside className="w-80 bg-card border-r border-border flex flex-col">
      {/* Navigation Tabs */}
      <div className="p-4 border-b border-border">
        <div className="flex space-x-1 bg-muted rounded-lg p-1">
          <Button
            variant={selectedView === "blocks" ? "default" : "ghost"}
            size="sm"
            className="flex-1 text-xs"
            onClick={() => onViewChange("blocks")}
            data-testid="button-blocks-view"
          >
            <List className="w-3 h-3 mr-1" />
            Blocks
          </Button>
          <Button
            variant={selectedView === "graph" ? "default" : "ghost"}
            size="sm"
            className="flex-1 text-xs"
            onClick={() => onViewChange("graph")}
            data-testid="button-graph-view"
          >
            <Network className="w-3 h-3 mr-1" />
            Graph
          </Button>
        </div>
      </div>

      {selectedView === "blocks" ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Recent Blocks */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Recent Blocks</h3>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-12 bg-muted rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : recentBlocks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No blocks yet</p>
            ) : (
              <div className="space-y-1">
                {recentBlocks.map((block) => (
                  <div
                    key={block.id}
                    className="group flex items-center space-x-2 p-2 rounded-lg hover:bg-muted cursor-pointer"
                    data-testid={`block-item-${block.id}`}
                  >
                    <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{block.title}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {block.content.substring(0, 50)}...
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(block.updatedAt), { addSuffix: true })}
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-accent hover:bg-accent/20"
                        data-testid={`button-comment-${block.id}`}
                      >
                        <MessageCircle className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-accent hover:bg-accent/20"
                        data-testid={`button-link-${block.id}`}
                      >
                        <LinkIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs cursor-pointer hover:bg-accent/20"
                    data-testid={`tag-${tag}`}
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 p-4">
          <GraphView />
        </div>
      )}
    </aside>
  );
}
