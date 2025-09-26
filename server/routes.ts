import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertBlockSchema, insertLinkSchema, insertCommentSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Block routes
  app.get("/api/blocks", async (req, res) => {
    try {
      const blocks = await storage.getBlocks();
      res.json(blocks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blocks" });
    }
  });

  app.get("/api/blocks/:id", async (req, res) => {
    try {
      const block = await storage.getBlockWithLinks(req.params.id);
      if (!block) {
        return res.status(404).json({ message: "Block not found" });
      }
      res.json(block);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch block" });
    }
  });

  app.post("/api/blocks", async (req, res) => {
    try {
      const validatedBlock = insertBlockSchema.parse(req.body);
      const block = await storage.createBlock(validatedBlock);
      
      // Broadcast to WebSocket clients
      broadcastToClients({ type: "block_created", data: block });
      
      res.json(block);
    } catch (error) {
      res.status(400).json({ message: "Invalid block data" });
    }
  });

  app.put("/api/blocks/:id", async (req, res) => {
    try {
      const updates = insertBlockSchema.partial().parse(req.body);
      const block = await storage.updateBlock(req.params.id, updates);
      if (!block) {
        return res.status(404).json({ message: "Block not found" });
      }
      
      // Broadcast to WebSocket clients
      broadcastToClients({ type: "block_updated", data: block });
      
      res.json(block);
    } catch (error) {
      res.status(400).json({ message: "Invalid update data" });
    }
  });

  app.delete("/api/blocks/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteBlock(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Block not found" });
      }
      
      // Broadcast to WebSocket clients
      broadcastToClients({ type: "block_deleted", data: { id: req.params.id } });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete block" });
    }
  });

  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Query parameter required" });
      }
      const results = await storage.searchBlocks(query);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Link routes
  app.get("/api/links", async (req, res) => {
    try {
      const links = await storage.getLinks();
      res.json(links);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch links" });
    }
  });

  app.post("/api/links", async (req, res) => {
    try {
      const validatedLink = insertLinkSchema.parse(req.body);
      
      // Check if link already exists
      const existingLinks = await storage.getLinksBetween(
        validatedLink.fromBlockId,
        validatedLink.toBlockId
      );
      
      if (existingLinks.length > 0) {
        return res.status(400).json({ message: "Link already exists" });
      }
      
      const link = await storage.createLink(validatedLink);
      
      // Broadcast to WebSocket clients
      broadcastToClients({ type: "link_created", data: link });
      
      res.json(link);
    } catch (error) {
      res.status(400).json({ message: "Invalid link data" });
    }
  });

  app.delete("/api/links/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteLink(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Link not found" });
      }
      
      // Broadcast to WebSocket clients
      broadcastToClients({ type: "link_deleted", data: { id: req.params.id } });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete link" });
    }
  });

  // Comment routes
  app.get("/api/blocks/:blockId/comments", async (req, res) => {
    try {
      const comments = await storage.getCommentsForBlock(req.params.blockId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/blocks/:blockId/comments", async (req, res) => {
    try {
      const validatedComment = insertCommentSchema.parse({
        ...req.body,
        blockId: req.params.blockId,
      });
      const comment = await storage.createComment(validatedComment);
      
      // Broadcast to WebSocket clients
      broadcastToClients({ type: "comment_created", data: comment });
      
      res.json(comment);
    } catch (error) {
      res.status(400).json({ message: "Invalid comment data" });
    }
  });

  app.delete("/api/comments/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteComment(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      // Broadcast to WebSocket clients
      broadcastToClients({ type: "comment_deleted", data: { id: req.params.id } });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // Graph data
  app.get("/api/graph", async (req, res) => {
    try {
      const graphData = await storage.getGraphData();
      res.json(graphData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch graph data" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    
    ws.on('close', () => {
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  function broadcastToClients(message: any) {
    const messageStr = JSON.stringify(message);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  return httpServer;
}
