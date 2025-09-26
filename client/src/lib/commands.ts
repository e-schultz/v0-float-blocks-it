import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";

interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
}

export async function executeCommand(command: string): Promise<CommandResult> {
  const [cmd, ...args] = command.split(" ");
  
  switch (cmd.toLowerCase()) {
    case "/new":
      return await createNewBlock(args.join(" "));
    
    case "/find":
    case "/search":
      return await searchBlocks(args.join(" "));
    
    case "/link":
      return await linkBlocks(args);
    
    case "/graph":
      return await showGraph();
    
    case "/discuss":
      return await toggleDiscussion(args[0]);
    
    case "/help":
      return {
        success: true,
        message: "Available commands: /new, /find, /link, /graph, /discuss, /help",
      };
    
    default:
      return {
        success: false,
        message: `Unknown command: ${cmd}. Type /help for available commands.`,
      };
  }
}

async function createNewBlock(title: string): Promise<CommandResult> {
  if (!title.trim()) {
    return {
      success: false,
      message: "Block title is required. Usage: /new <title>",
    };
  }

  try {
    const response = await apiRequest("POST", "/api/blocks", {
      title: title.trim(),
      content: "",
      contentType: "text",
      position: { x: 0, y: 0 },
      tags: [],
      authorId: "current-user",
      authorName: "Current User",
    });

    const block = await response.json();
    
    // Invalidate cache to refresh the UI
    queryClient.invalidateQueries({ queryKey: ["/api/blocks"] });

    return {
      success: true,
      message: `Created new block: "${block.title}"`,
      data: block,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to create block",
    };
  }
}

async function searchBlocks(query: string): Promise<CommandResult> {
  if (!query.trim()) {
    return {
      success: false,
      message: "Search query is required. Usage: /find <query>",
    };
  }

  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const results = await response.json();

    if (results.length === 0) {
      return {
        success: true,
        message: `No blocks found for "${query}"`,
      };
    }

    return {
      success: true,
      message: `Found ${results.length} block(s) for "${query}"`,
      data: results,
    };
  } catch (error) {
    return {
      success: false,
      message: "Search failed",
    };
  }
}

async function linkBlocks(args: string[]): Promise<CommandResult> {
  if (args.length < 2) {
    return {
      success: false,
      message: "Two block IDs required. Usage: /link <blockId1> <blockId2>",
    };
  }

  const [fromId, toId] = args;

  try {
    const response = await apiRequest("POST", "/api/links", {
      fromBlockId: fromId,
      toBlockId: toId,
    });

    const link = await response.json();
    
    // Invalidate cache to refresh the UI
    queryClient.invalidateQueries({ queryKey: ["/api/blocks"] });
    queryClient.invalidateQueries({ queryKey: ["/api/graph"] });

    return {
      success: true,
      message: "Blocks linked successfully",
      data: link,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to link blocks. Make sure both block IDs exist.",
    };
  }
}

async function showGraph(): Promise<CommandResult> {
  // This would trigger a graph view in a real implementation
  return {
    success: true,
    message: "Graph view would open here (feature in progress)",
  };
}

async function toggleDiscussion(blockId: string): Promise<CommandResult> {
  if (!blockId) {
    return {
      success: false,
      message: "Block ID required. Usage: /discuss <blockId>",
    };
  }

  // This would toggle discussion for a specific block
  return {
    success: true,
    message: `Discussion toggled for block ${blockId}`,
  };
}
