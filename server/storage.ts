import { type Block, type Link, type Comment, type InsertBlock, type InsertLink, type InsertComment, type BlockWithLinks, type CommentWithReplies } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Block operations
  getBlocks(): Promise<Block[]>;
  getBlock(id: string): Promise<Block | undefined>;
  getBlockWithLinks(id: string): Promise<BlockWithLinks | undefined>;
  createBlock(block: InsertBlock): Promise<Block>;
  updateBlock(id: string, updates: Partial<InsertBlock>): Promise<Block | undefined>;
  deleteBlock(id: string): Promise<boolean>;
  searchBlocks(query: string): Promise<Block[]>;

  // Link operations
  getLinks(): Promise<Link[]>;
  getLinksForBlock(blockId: string): Promise<Link[]>;
  createLink(link: InsertLink): Promise<Link>;
  deleteLink(id: string): Promise<boolean>;
  getLinksBetween(fromBlockId: string, toBlockId: string): Promise<Link[]>;

  // Comment operations
  getCommentsForBlock(blockId: string): Promise<CommentWithReplies[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: string): Promise<boolean>;

  // Graph operations
  getGraphData(): Promise<{ nodes: Block[]; edges: Link[] }>;
}

export class MemStorage implements IStorage {
  private blocks: Map<string, Block>;
  private links: Map<string, Link>;
  private comments: Map<string, Comment>;

  constructor() {
    this.blocks = new Map();
    this.links = new Map();
    this.comments = new Map();
  }

  async getBlocks(): Promise<Block[]> {
    return Array.from(this.blocks.values()).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async getBlock(id: string): Promise<Block | undefined> {
    return this.blocks.get(id);
  }

  async getBlockWithLinks(id: string): Promise<BlockWithLinks | undefined> {
    const block = this.blocks.get(id);
    if (!block) return undefined;

    const allLinks = Array.from(this.links.values());
    const outgoingLinks = allLinks.filter(link => link.fromBlockId === id);
    const incomingLinks = allLinks.filter(link => link.toBlockId === id);

    const linkedTo = outgoingLinks
      .map(link => this.blocks.get(link.toBlockId))
      .filter(Boolean) as Block[];

    const linkedFrom = incomingLinks
      .map(link => this.blocks.get(link.fromBlockId))
      .filter(Boolean) as Block[];

    const comments = Array.from(this.comments.values())
      .filter(comment => comment.blockId === id);

    return {
      ...block,
      linkedTo,
      linkedFrom,
      comments,
      linkCount: linkedTo.length + linkedFrom.length,
      commentCount: comments.length,
    };
  }

  async createBlock(insertBlock: InsertBlock): Promise<Block> {
    const id = randomUUID();
    const now = new Date();
    const block: Block = {
      id,
      title: insertBlock.title,
      content: insertBlock.content || "",
      contentType: insertBlock.contentType || "text",
      position: insertBlock.position || { x: 0, y: 0 },
      tags: insertBlock.tags || [],
      createdAt: now,
      updatedAt: now,
      authorId: insertBlock.authorId,
      authorName: insertBlock.authorName,
    };
    this.blocks.set(id, block);
    return block;
  }

  async updateBlock(id: string, updates: Partial<InsertBlock>): Promise<Block | undefined> {
    const existingBlock = this.blocks.get(id);
    if (!existingBlock) return undefined;

    const updatedBlock: Block = {
      ...existingBlock,
      ...updates,
      updatedAt: new Date(),
    };
    this.blocks.set(id, updatedBlock);
    return updatedBlock;
  }

  async deleteBlock(id: string): Promise<boolean> {
    const deleted = this.blocks.delete(id);
    
    // Delete associated links and comments
    if (deleted) {
      const linksToDelete = Array.from(this.links.entries())
        .filter(([, link]) => link.fromBlockId === id || link.toBlockId === id)
        .map(([linkId]) => linkId);
      
      linksToDelete.forEach(linkId => this.links.delete(linkId));

      const commentsToDelete = Array.from(this.comments.entries())
        .filter(([, comment]) => comment.blockId === id)
        .map(([commentId]) => commentId);
      
      commentsToDelete.forEach(commentId => this.comments.delete(commentId));
    }
    
    return deleted;
  }

  async searchBlocks(query: string): Promise<Block[]> {
    const blocks = Array.from(this.blocks.values());
    const lowercaseQuery = query.toLowerCase();
    
    return blocks.filter(block => 
      block.title.toLowerCase().includes(lowercaseQuery) ||
      block.content.toLowerCase().includes(lowercaseQuery) ||
      (block.tags || []).some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  async getLinks(): Promise<Link[]> {
    return Array.from(this.links.values());
  }

  async getLinksForBlock(blockId: string): Promise<Link[]> {
    return Array.from(this.links.values())
      .filter(link => link.fromBlockId === blockId || link.toBlockId === blockId);
  }

  async createLink(insertLink: InsertLink): Promise<Link> {
    const id = randomUUID();
    const link: Link = {
      ...insertLink,
      id,
      createdAt: new Date(),
    };
    this.links.set(id, link);
    return link;
  }

  async deleteLink(id: string): Promise<boolean> {
    return this.links.delete(id);
  }

  async getLinksBetween(fromBlockId: string, toBlockId: string): Promise<Link[]> {
    return Array.from(this.links.values())
      .filter(link => 
        (link.fromBlockId === fromBlockId && link.toBlockId === toBlockId) ||
        (link.fromBlockId === toBlockId && link.toBlockId === fromBlockId)
      );
  }

  async getCommentsForBlock(blockId: string): Promise<CommentWithReplies[]> {
    const blockComments = Array.from(this.comments.values())
      .filter(comment => comment.blockId === blockId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // Build nested comment structure
    const commentMap = new Map<string, CommentWithReplies>();
    const rootComments: CommentWithReplies[] = [];

    // Initialize all comments with empty replies
    blockComments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Build the tree structure
    blockComments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!;
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    return rootComments;
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = randomUUID();
    const comment: Comment = {
      id,
      content: insertComment.content,
      blockId: insertComment.blockId,
      authorId: insertComment.authorId,
      authorName: insertComment.authorName,
      parentId: insertComment.parentId || null,
      createdAt: new Date(),
    };
    this.comments.set(id, comment);
    return comment;
  }

  async deleteComment(id: string): Promise<boolean> {
    return this.comments.delete(id);
  }

  async getGraphData(): Promise<{ nodes: Block[]; edges: Link[] }> {
    const nodes = Array.from(this.blocks.values());
    const edges = Array.from(this.links.values());
    return { nodes, edges };
  }
}

export const storage = new MemStorage();
