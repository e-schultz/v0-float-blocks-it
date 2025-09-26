// Utility for highlighting dispatch patterns and bracketed text

// Color mappings for different highlight types
const HIGHLIGHT_COLORS = {
  'r': 'red',
  'red': 'red',
  'b': 'blue', 
  'blue': 'blue',
  'g': 'green',
  'green': 'green',
  'y': 'yellow',
  'yellow': 'yellow',
  'o': 'orange',
  'orange': 'orange',
  'p': 'purple',
  'purple': 'purple',
  'pink': 'pink',
  'gray': 'gray',
  'grey': 'gray'
};

// Common dispatch patterns
const DISPATCH_PATTERNS = {
  'karen': 'purple',
  'ctx': 'blue', 
  'sysop': 'green',
  'lf1m': 'yellow',
  'highlight': 'yellow',
  'hl': 'yellow',
  'float': 'orange',
  'bridge': 'blue'
};

export function parseAndHighlightText(text: string): JSX.Element {
  if (!text) return <span>{text}</span>;
  
  const parts: JSX.Element[] = [];
  let currentIndex = 0;
  
  // Regex patterns to match
  const patterns = [
    // [highlight::text] or [hl::text] - bracketed inline highlighting
    /\[(highlight|hl)::([^\]]+)\]/g,
    // highlight:color or hl::color - dispatch patterns  
    /(highlight|hl)::?(\w+)/g,
    // Common dispatch patterns like karen::, ctx::, float.dispatch
    /(\w+)::/g,
    // Method calls like float.dispatch
    /(\w+)\.(\w+)/g
  ];
  
  // Find all matches and their positions
  const matches: Array<{
    start: number;
    end: number;
    text: string;
    type: string;
    color?: string;
    content?: string;
  }> = [];
  
  // Pattern 1: [highlight::text] or [hl::text]
  let match: RegExpExecArray | null;
  const bracketPattern = /\[(highlight|hl)::([^\]]+)\]/g;
  while ((match = bracketPattern.exec(text)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[0],
      type: 'bracketed',
      color: 'yellow', // Default color for bracketed highlights
      content: match[2] // The text inside the brackets
    });
  }
  
  // Pattern 2: highlight:color or hl::color
  const dispatchColorPattern = /(highlight|hl)::?(\w+)/g;
  let colorMatch: RegExpExecArray | null;
  while ((colorMatch = dispatchColorPattern.exec(text)) !== null) {
    const colorKey = colorMatch[2];
    const color = HIGHLIGHT_COLORS[colorKey as keyof typeof HIGHLIGHT_COLORS] || 'yellow';
    matches.push({
      start: colorMatch.index,
      end: colorMatch.index + colorMatch[0].length,
      text: colorMatch[0],
      type: 'dispatch-color',
      color: color
    });
  }
  
  // Pattern 3: Common dispatch patterns (karen::, ctx::, etc.)
  const commonDispatchPattern = /(\w+)::/g;
  let dispatchMatch: RegExpExecArray | null;
  while ((dispatchMatch = commonDispatchPattern.exec(text)) !== null) {
    // Skip if already matched by previous patterns
    const isAlreadyMatched = matches.some(m => 
      dispatchMatch!.index >= m.start && dispatchMatch!.index < m.end
    );
    if (!isAlreadyMatched) {
      const dispatchKey = dispatchMatch[1];
      const color = DISPATCH_PATTERNS[dispatchKey as keyof typeof DISPATCH_PATTERNS] || 'gray';
      matches.push({
        start: dispatchMatch.index,
        end: dispatchMatch.index + dispatchMatch[0].length,
        text: dispatchMatch[0],
        type: 'dispatch',
        color: color
      });
    }
  }
  
  // Pattern 4: Method calls like float.dispatch
  const methodPattern = /(\w+)\.(\w+)/g;
  let methodMatch: RegExpExecArray | null;
  while ((methodMatch = methodPattern.exec(text)) !== null) {
    // Skip if already matched by previous patterns
    const isAlreadyMatched = matches.some(m => 
      methodMatch!.index >= m.start && methodMatch!.index < m.end
    );
    if (!isAlreadyMatched) {
      const objName = methodMatch[1];
      const color = DISPATCH_PATTERNS[objName as keyof typeof DISPATCH_PATTERNS] || 'orange';
      matches.push({
        start: methodMatch.index,
        end: methodMatch.index + methodMatch[0].length,
        text: methodMatch[0],
        type: 'method',
        color: color
      });
    }
  }
  
  // Sort matches by start position
  matches.sort((a, b) => a.start - b.start);
  
  // Remove overlapping matches (keep the first one)
  const filteredMatches = [];
  let lastEnd = 0;
  for (const match of matches) {
    if (match.start >= lastEnd) {
      filteredMatches.push(match);
      lastEnd = match.end;
    }
  }
  
  // Build JSX with highlighted parts
  let partIndex = 0;
  for (const match of filteredMatches) {
    // Add text before the match
    if (match.start > currentIndex) {
      const beforeText = text.slice(currentIndex, match.start);
      parts.push(<span key={`text-${partIndex++}`}>{beforeText}</span>);
    }
    
    // Add the highlighted match
    const displayText = match.type === 'bracketed' ? match.content : match.text;
    parts.push(
      <span 
        key={`highlight-${partIndex++}`}
        className={`highlight highlight-${match.color} px-1 rounded font-medium`}
        data-testid={`highlight-${match.type}-${match.color}`}
      >
        {displayText}
      </span>
    );
    
    currentIndex = match.end;
  }
  
  // Add remaining text
  if (currentIndex < text.length) {
    const remainingText = text.slice(currentIndex);
    parts.push(<span key={`text-${partIndex++}`}>{remainingText}</span>);
  }
  
  return <span>{parts}</span>;
}