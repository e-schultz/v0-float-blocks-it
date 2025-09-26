import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { executeCommand } from "@/lib/commands";
import { useToast } from "@/hooks/use-toast";

export default function TerminalCommand() {
  const [command, setCommand] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || isExecuting) return;

    setIsExecuting(true);
    try {
      const result = await executeCommand(command.trim());
      if (result.success) {
        toast({
          title: "Command executed",
          description: result.message,
        });
      } else {
        toast({
          title: "Command failed",
          description: result.message,
          variant: "destructive",
        });
      }
      setCommand("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to execute command",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="flex-1 max-w-2xl mx-8">
      <form onSubmit={handleSubmit}>
        <div className="bg-black/20 rounded-lg px-3 py-1.5 font-mono text-sm flex items-center">
          <span className="text-accent mr-2">{'>'}</span>
          <Input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Type command... (e.g., /new, /link, /find)"
            className="bg-transparent border-none outline-none text-white placeholder-gray-400 flex-1 p-0 h-auto focus-visible:ring-0"
            disabled={isExecuting}
            data-testid="input-terminal-command"
          />
          {!isExecuting && <span className="terminal-cursor ml-1"></span>}
          {isExecuting && <span className="ml-1 text-accent">⏳</span>}
        </div>
      </form>
    </div>
  );
}
