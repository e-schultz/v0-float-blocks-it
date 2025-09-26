import { useState } from "react";
import TerminalCommand from "@/components/terminal-command";
import Sidebar from "@/components/sidebar";
import ContentBlock from "@/components/content-block";
import RightPanel from "@/components/right-panel";
import { useBlocks } from "@/hooks/use-blocks";
import { useWebSocket } from "@/hooks/use-websocket";
import { Button } from "@/components/ui/button";
import { Users, Settings } from "lucide-react";

export default function Home() {
  const [selectedView, setSelectedView] = useState<"blocks" | "graph">("blocks");
  const { blocks, isLoading } = useBlocks();
  useWebSocket(); // Enable real-time updates

  return (
    <div className="h-screen flex flex-col">
      {/* Terminal Header */}
      <header className="bg-terminal text-white px-4 py-2 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-accent rounded flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-sm"></div>
            </div>
            <span className="font-display font-semibold text-lg">ThinkLink</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-accent">📁</span>
            <span>My Workspace</span>
          </div>
        </div>
        
        <TerminalCommand />

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-6 h-6 rounded-full bg-success border-2 border-white flex items-center justify-center text-xs font-semibold">
              ES
            </div>
            <div className="w-6 h-6 rounded-full bg-warning border-2 border-white flex items-center justify-center text-xs font-semibold">
              JD
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white hover:bg-white/10"
            data-testid="button-settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <Sidebar 
          selectedView={selectedView}
          onViewChange={setSelectedView}
          blocks={blocks}
          isLoading={isLoading}
        />
        
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6 space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-xl border border-border p-6">
                    <div className="animate-pulse space-y-3">
                      <div className="h-6 bg-muted rounded w-1/3"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded"></div>
                        <div className="h-4 bg-muted rounded w-5/6"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : blocks.length === 0 ? (
              <div className="border-2 border-dashed border-border hover:border-accent/50 rounded-xl p-12 text-center transition-colors">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl">📝</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">No blocks yet</h3>
                    <p className="text-muted-foreground">
                      Start building your knowledge base by creating your first block
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Press <kbd className="px-2 py-1 bg-muted rounded text-xs">Cmd+K</kbd> or type{" "}
                    <code className="px-1 py-0.5 bg-muted rounded text-xs">/new</code> in the command bar
                  </div>
                </div>
              </div>
            ) : (
              <>
                {blocks.map((block) => (
                  <ContentBlock key={block.id} block={block} />
                ))}
                
                <div className="border-2 border-dashed border-border hover:border-accent/50 rounded-xl p-6 text-center transition-colors group cursor-pointer">
                  <div className="space-y-2">
                    <div className="text-2xl text-muted-foreground group-hover:text-accent transition-colors">+</div>
                    <p className="text-muted-foreground group-hover:text-foreground">
                      <strong>Add a new block</strong><br />
                      <span className="text-sm">
                        Press <kbd className="px-1 py-0.5 text-xs bg-muted rounded">Cmd+K</kbd> or type{" "}
                        <code>/new</code> in the command bar
                      </span>
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>

        <RightPanel />
      </div>
    </div>
  );
}
