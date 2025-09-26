import { useState } from "react";
import TerminalCommand from "@/components/terminal-command";
import Sidebar from "@/components/sidebar";
import ThreadView from "@/components/thread-view";
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
          <ThreadView blocks={blocks} isLoading={isLoading} />
        </main>

        <RightPanel />
      </div>
    </div>
  );
}
