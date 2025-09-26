import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Link as LinkIcon, Search, Network } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import type { Block } from "@shared/schema";

export default function RightPanel() {
  const { data: blocks = [] } = useQuery<Block[]>({
    queryKey: ["/api/blocks"],
  });

  // Mock recent activity data
  const recentActivity = [
    {
      id: "1",
      user: "Current User",
      action: "updated",
      target: "Product Development Roadmap",
      time: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      avatar: "CU",
    },
    {
      id: "2", 
      user: "John Doe",
      action: "commented on",
      target: "Product Development Roadmap",
      time: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      avatar: "JD",
    },
    {
      id: "3",
      user: "Current User", 
      action: "created",
      target: "Technical Architecture Overview",
      time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      avatar: "CU",
    },
  ];

  const commands = [
    { label: "New block", command: "/new" },
    { label: "Link blocks", command: "/link" },
    { label: "Search", command: "/find" },
    { label: "Graph view", command: "/graph" },
    { label: "Discussion", command: "/discuss" },
  ];

  return (
    <aside className="w-72 bg-card border-l border-border overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Quick Actions */}
        <div>
          <h3 className="font-semibold text-sm mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="ghost"
              className="p-3 h-auto bg-accent/10 hover:bg-accent/20 flex-col space-y-1 group"
              data-testid="button-quick-new-block"
            >
              <Plus className="h-5 w-5 text-accent" />
              <span className="text-xs font-medium">New Block</span>
            </Button>
            
            <Button
              variant="ghost"
              className="p-3 h-auto bg-success/10 hover:bg-success/20 flex-col space-y-1 group"
              data-testid="button-quick-link-blocks"
            >
              <LinkIcon className="h-5 w-5 text-success" />
              <span className="text-xs font-medium">Link Blocks</span>
            </Button>
            
            <Button
              variant="ghost"
              className="p-3 h-auto bg-warning/10 hover:bg-warning/20 flex-col space-y-1 group"
              data-testid="button-quick-search"
            >
              <Search className="h-5 w-5 text-warning" />
              <span className="text-xs font-medium">Search</span>
            </Button>
            
            <Button
              variant="ghost"
              className="p-3 h-auto bg-primary/10 hover:bg-primary/20 flex-col space-y-1 group"
              data-testid="button-quick-graph-view"
            >
              <Network className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium">Graph View</span>
            </Button>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h3 className="font-semibold text-sm mb-3">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3" data-testid={`activity-${activity.id}`}>
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs">{activity.avatar}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user}</span>
                    <span className="text-muted-foreground"> {activity.action} </span>
                    <span className="font-medium">{activity.target}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(activity.time, { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Command Reference */}
        <div>
          <h3 className="font-semibold text-sm mb-3">Command Reference</h3>
          <div className="space-y-2 text-sm">
            {commands.map((cmd) => (
              <div key={cmd.command} className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">{cmd.label}</span>
                <Badge variant="secondary" className="text-xs font-mono">
                  {cmd.command}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div>
          <h3 className="font-semibold text-sm mb-3">Workspace Stats</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total blocks</span>
              <span className="font-medium" data-testid="stat-total-blocks">{blocks.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active today</span>
              <span className="font-medium text-success" data-testid="stat-active-today">3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Collaborators</span>
              <span className="font-medium" data-testid="stat-collaborators">2</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
