import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Expand } from "lucide-react";
import type { Block, Link } from "@shared/schema";

interface GraphData {
  nodes: Block[];
  edges: Link[];
}

export default function GraphView({ isFullScreen = false }: { isFullScreen?: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { data: graphData, isLoading } = useQuery<GraphData>({
    queryKey: ["/api/graph"],
  });

  useEffect(() => {
    if (!graphData || !svgRef.current) return;

    const svg = svgRef.current;
    const { nodes, edges } = graphData;
    
    // Clear previous content
    svg.innerHTML = "";
    
    if (nodes.length === 0) return;

    const width = svg.clientWidth || 300;
    const height = svg.clientHeight || 200;
    
    // Simple force-directed layout simulation
    const nodeMap = new Map();
    const nodePositions = nodes.map((node, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI;
      const radius = Math.min(width, height) * 0.3;
      const x = width / 2 + Math.cos(angle) * radius;
      const y = height / 2 + Math.sin(angle) * radius;
      const pos = { ...node, x, y };
      nodeMap.set(node.id, pos);
      return pos;
    });

    // Draw edges
    edges.forEach(edge => {
      const fromNode = nodeMap.get(edge.fromBlockId);
      const toNode = nodeMap.get(edge.toBlockId);
      
      if (fromNode && toNode) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", fromNode.x.toString());
        line.setAttribute("y1", fromNode.y.toString());
        line.setAttribute("x2", toNode.x.toString());
        line.setAttribute("y2", toNode.y.toString());
        line.setAttribute("class", "graph-link");
        svg.appendChild(line);
      }
    });

    // Draw nodes
    nodePositions.forEach(node => {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", node.x.toString());
      circle.setAttribute("cy", node.y.toString());
      circle.setAttribute("r", isFullScreen ? "8" : "4");
      circle.setAttribute("class", "graph-node");
      circle.setAttribute("data-testid", `graph-node-${node.id}`);
      
      // Add click handler
      circle.style.cursor = "pointer";
      circle.addEventListener("click", () => {
        console.log("Clicked node:", node.title);
      });

      svg.appendChild(circle);

      // Add labels for full screen view
      if (isFullScreen && node.title) {
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", node.x.toString());
        text.setAttribute("y", (node.y + 20).toString());
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("class", "text-xs fill-current");
        text.textContent = node.title.length > 15 
          ? node.title.substring(0, 15) + "..." 
          : node.title;
        svg.appendChild(text);
      }
    });

  }, [graphData, isFullScreen]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading graph...</div>
      </div>
    );
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-2xl">🕸️</div>
          <p className="text-sm text-muted-foreground">No connections yet</p>
          <p className="text-xs text-muted-foreground">
            Create blocks and link them to see the graph
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <h3 className="text-sm font-semibold mb-3 flex items-center">
        <svg className="w-4 h-4 mr-2 text-accent" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
        Connection Map
      </h3>
      
      <div className="graph-canvas bg-muted rounded-lg relative overflow-hidden" 
           style={{ height: isFullScreen ? "400px" : "128px" }}>
        <svg
          ref={svgRef}
          className="w-full h-full"
          data-testid="graph-svg"
        />
        
        {!isFullScreen && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 bg-background/80 hover:bg-background"
            data-testid="button-expand-graph"
          >
            <Expand className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      {graphData && (
        <div className="mt-2 text-xs text-muted-foreground">
          {graphData.nodes.length} blocks • {graphData.edges.length} connections
        </div>
      )}
    </div>
  );
}
