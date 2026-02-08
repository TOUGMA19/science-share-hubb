import React from 'react';

/**
 * Formats a biography text by converting lines starting with "-" into bullet points
 */
export function formatBioWithBullets(bio: string): React.ReactNode {
  if (!bio) return null;
  
  const lines = bio.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  
  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="my-2 ml-4 list-disc space-y-1 text-muted-foreground">
          {currentList.map((item, idx) => (
            <li key={idx}>{item.trim()}</li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('-')) {
      // This is a bullet point
      const content = trimmedLine.substring(1).trim();
      if (content) {
        currentList.push(content);
      }
    } else {
      // Regular text - flush any pending list first
      flushList();
      
      if (trimmedLine) {
        elements.push(
          <p key={`p-${index}`} className="text-muted-foreground">
            {trimmedLine}
          </p>
        );
      }
    }
  });
  
  // Flush any remaining list items
  flushList();
  
  return <div className="space-y-2">{elements}</div>;
}
