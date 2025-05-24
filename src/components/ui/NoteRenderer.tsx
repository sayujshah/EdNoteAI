"use client";

import React from 'react';
import 'katex/dist/katex.min.css';
import dynamic from 'next/dynamic';
import { InlineMath, BlockMath } from 'react-katex';

// Dynamic import for ReactMarkdown with proper configuration
const ReactMarkdown = dynamic(() => import('react-markdown'), { 
  ssr: false,
  loading: () => <div>Loading...</div>
});

interface NoteRendererProps {
  content: string;
  format: 'Markdown' | 'LaTeX';
  className?: string;
}

export default function NoteRenderer({ content, format, className = "" }: NoteRendererProps) {
  // Clean up AI-generated code block wrappers
  const cleanContent = (rawContent: string): string => {
    return rawContent
      // Remove markdown code block wrappers
      .replace(/^```markdown\s*/i, '')
      .replace(/^```md\s*/i, '')
      .replace(/\s*```$/, '')
      // Remove LaTeX code block wrappers
      .replace(/^```latex\s*/i, '')
      .replace(/^```tex\s*/i, '')
      // Remove any generic code block wrappers at start/end
      .replace(/^```\w*\s*/, '')
      .replace(/\s*```$/, '')
      .trim();
  };

  const cleanedContent = cleanContent(content);

  // Enhanced LaTeX rendering function with nested structure support
  const renderLatexContent = (text: string): React.ReactElement[] => {
    const elements: React.ReactElement[] = [];
    let currentIndex = 0;
    
    interface LatexMatch {
      type: string;
      match: string;
      content: string;
      index: number;
      endIndex: number;
    }

    // Comprehensive LaTeX command cleanup function
    const cleanupLatexCommands = (inputText: string): string => {
      return inputText
        // Remove list environment commands
        .replace(/\\end\{itemize\}/g, '')
        .replace(/\\end\{enumerate\}/g, '')
        .replace(/\\begin\{itemize\}/g, '')
        .replace(/\\begin\{enumerate\}/g, '')
        // Remove other common LaTeX commands that might be missed
        .replace(/\\item\s*/g, '')
        .replace(/\\[a-zA-Z]+\{[^}]*\}/g, '') // Remove any remaining \command{content}
        .replace(/\\[a-zA-Z]+/g, '') // Remove any remaining \command
        // Clean up whitespace
        .replace(/\s+/g, ' ')
        .trim();
    };

    // Process text formatting first (textbf, textit, etc.) - these are inline
    const processTextFormatting = (inputText: string): (string | React.ReactElement)[] => {
      const result: (string | React.ReactElement)[] = [];
      let lastIndex = 0;
      
      // First, clean up any remaining LaTeX commands that weren't processed
      let cleanedText = inputText
        .replace(/\\end\{itemize\}/g, '')  // Remove stray \end{itemize}
        .replace(/\\end\{enumerate\}/g, '') // Remove stray \end{enumerate}
        .replace(/\\begin\{itemize\}/g, '') // Remove stray \begin{itemize}
        .replace(/\\begin\{enumerate\}/g, '') // Remove stray \begin{enumerate}
        .replace(/\s+/g, ' ')  // Clean up extra whitespace
        .trim();
      
      const patterns = [
        { type: 'textbf', regex: /\\textbf\{([^}]+)\}/g },
        { type: 'textit', regex: /\\textit\{([^}]+)\}/g },
        { type: 'emph', regex: /\\emph\{([^}]+)\}/g },
      ];

      const allMatches: { type: string; match: RegExpExecArray }[] = [];
      
      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.regex.exec(cleanedText)) !== null) {
          allMatches.push({ type: pattern.type, match });
        }
        pattern.regex.lastIndex = 0;
      });

      allMatches.sort((a, b) => a.match.index - b.match.index);

      allMatches.forEach((matchObj, i) => {
        const { type, match } = matchObj;
        
        if (match.index > lastIndex) {
          result.push(cleanedText.slice(lastIndex, match.index));
        }

        if (type === 'textbf') {
          result.push(
            <strong key={`bold-${i}-${match.index}`} className="font-bold">
              {match[1]}
            </strong>
          );
        } else if (type === 'textit' || type === 'emph') {
          result.push(
            <em key={`italic-${i}-${match.index}`} className="italic">
              {match[1]}
            </em>
          );
        }

        lastIndex = match.index + match[0].length;
      });

      if (lastIndex < cleanedText.length) {
        const remainingText = cleanedText.slice(lastIndex);
        // Apply final cleanup to any remaining text
        const finalText = cleanupLatexCommands(remainingText);
        if (finalText) {
          result.push(finalText);
        }
      }

      return result.length > 0 ? result : [cleanupLatexCommands(cleanedText)];
    };

    // Recursive function to parse nested lists
    const parseNestedList = (listContent: string, listType: 'itemize' | 'enumerate'): React.ReactElement[] => {
      const items: React.ReactElement[] = [];
      const lines = listContent.split('\n');
      let currentItem = '';
      let itemIndex = 0;
      let insideNestedList = false;
      let nestedListContent = '';
      let nestedListType: 'itemize' | 'enumerate' | null = null;
      let braceCount = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Check for nested list start
        if (line.includes('\\begin{itemize}') || line.includes('\\begin{enumerate}')) {
          if (currentItem) {
            // Save current item before starting nested list
            items.push(
              <li key={`item-${itemIndex}`} className="text-gray-700 dark:text-gray-300 mb-2">
                {processTextFormatting(currentItem.trim())}
              </li>
            );
            itemIndex++;
            currentItem = '';
          }
          
          insideNestedList = true;
          nestedListType = line.includes('\\begin{itemize}') ? 'itemize' : 'enumerate';
          nestedListContent = '';
          braceCount = 1;
          continue;
        }

        // Check for nested list end
        if (insideNestedList && (line.includes('\\end{itemize}') || line.includes('\\end{enumerate}'))) {
          braceCount--;
          if (braceCount === 0) {
            // Render nested list
            const nestedItems = parseNestedList(nestedListContent, nestedListType!);
            const NestedListComponent = nestedListType === 'itemize' ? 'ul' : 'ol';
            const nestedListClass = nestedListType === 'itemize' 
              ? "list-disc list-inside my-2 space-y-1 ml-6"
              : "list-decimal list-inside my-2 space-y-1 ml-6";
            
            items.push(
              React.createElement(
                NestedListComponent,
                {
                  key: `nested-${itemIndex}`,
                  className: nestedListClass
                },
                nestedItems
              )
            );
            
            itemIndex++;
            insideNestedList = false;
            nestedListContent = '';
            nestedListType = null;
            continue;
          }
        }

        // If inside nested list, accumulate content
        if (insideNestedList) {
          // Check for additional nested beginnings
          if (line.includes('\\begin{')) braceCount++;
          nestedListContent += line + '\n';
          continue;
        }

        // Regular item processing
        if (line.startsWith('\\item')) {
          // Save previous item if exists
          if (currentItem.trim()) {
            items.push(
              <li key={`item-${itemIndex}`} className="text-gray-700 dark:text-gray-300 mb-2">
                {processTextFormatting(currentItem.trim())}
              </li>
            );
            itemIndex++;
          }
          // Start new item
          currentItem = line.replace(/^\\item\s*/, '');
        } else if (currentItem && line) {
          // Continue current item
          currentItem += ' ' + line;
        }
      }

      // Add final item if exists
      if (currentItem.trim()) {
        items.push(
          <li key={`item-${itemIndex}`} className="text-gray-700 dark:text-gray-300 mb-2">
            {processTextFormatting(currentItem.trim())}
          </li>
        );
      }

      return items;
    };

    // Main patterns for block-level elements (excluding lists for special handling)
    const patterns = [
      // Math expressions (highest priority)
      { type: 'blockmath', regex: /\$\$[\s\S]*?\$\$/g },
      { type: 'inlinemath', regex: /\$[^$\n]+?\$/g },
      // Document structure
      { type: 'section', regex: /\\section\{([^}]+)\}/g },
      { type: 'subsection', regex: /\\subsection\{([^}]+)\}/g },
      { type: 'subsubsection', regex: /\\subsubsection\{([^}]+)\}/g },
    ];

    // Find all matches except lists
    const matches: LatexMatch[] = [];
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.regex.exec(text)) !== null) {
        matches.push({
          type: pattern.type,
          match: match[0],
          content: match[1] || match[0],
          index: match.index,
          endIndex: match.index + match[0].length
        });
      }
    });

    // Find list matches separately with better parsing
    const findListMatches = (input: string, startIndex: number = 0): LatexMatch[] => {
      const listMatches: LatexMatch[] = [];
      const listTypes = ['itemize', 'enumerate'];
      
      listTypes.forEach(listType => {
        const beginPattern = new RegExp(`\\\\begin\\{${listType}\\}`, 'g');
        const endPattern = `\\\\end\\{${listType}\\}`;
        
        let match;
        beginPattern.lastIndex = startIndex;
        
        while ((match = beginPattern.exec(input)) !== null) {
          // Find matching end, accounting for nesting
          let braceCount = 1;
          let searchIndex = match.index + match[0].length;
          let endIndex = -1;
          
          while (braceCount > 0 && searchIndex < input.length) {
            const beginMatch = input.indexOf(`\\begin{${listType}}`, searchIndex);
            const endMatch = input.indexOf(`\\end{${listType}}`, searchIndex);
            
            if (endMatch === -1) break;
            
            if (beginMatch !== -1 && beginMatch < endMatch) {
              braceCount++;
              searchIndex = beginMatch + `\\begin{${listType}}`.length;
            } else {
              braceCount--;
              if (braceCount === 0) {
                endIndex = endMatch + `\\end{${listType}}`.length;
              } else {
                searchIndex = endMatch + `\\end{${listType}}`.length;
              }
            }
          }
          
          if (endIndex !== -1) {
            const fullMatch = input.slice(match.index, endIndex);
            const content = input.slice(match.index + match[0].length, endIndex - `\\end{${listType}}`.length);
            
            listMatches.push({
              type: listType,
              match: fullMatch,
              content: content,
              index: match.index,
              endIndex: endIndex
            });
          }
        }
      });
      
      return listMatches;
    };

    // Add list matches
    matches.push(...findListMatches(text));

    // Sort all matches by position
    matches.sort((a, b) => a.index - b.index);

    // Process text and matches
    matches.forEach((matchObj, i) => {
      // Add text before this match
      if (matchObj.index > currentIndex) {
        const textBefore = text.slice(currentIndex, matchObj.index);
        if (textBefore.trim()) {
          const processedText = processTextFormatting(textBefore.trim());
          elements.push(
            <div key={`text-${currentIndex}`} className="whitespace-pre-wrap mb-2">
              {processedText}
            </div>
          );
        }
      }

      const key = `${matchObj.type}-${matchObj.index}`;
      
      switch (matchObj.type) {
        case 'blockmath':
          try {
            const mathExpression = matchObj.content.slice(2, -2).trim();
            elements.push(
              <div key={key} className="my-4">
                <BlockMath>{mathExpression}</BlockMath>
              </div>
            );
          } catch (error) {
            elements.push(
              <code key={key} className="bg-red-100 text-red-800 px-1 rounded">
                {matchObj.match}
              </code>
            );
          }
          break;

        case 'inlinemath':
          try {
            const mathExpression = matchObj.content.slice(1, -1).trim();
            elements.push(
              <InlineMath key={key}>{mathExpression}</InlineMath>
            );
          } catch (error) {
            elements.push(
              <code key={key} className="bg-red-100 text-red-800 px-1 rounded">
                {matchObj.match}
              </code>
            );
          }
          break;

        case 'section':
          elements.push(
            <h2 key={key} className="text-2xl font-bold mt-6 mb-4 text-gray-900 dark:text-gray-100">
              {matchObj.content}
            </h2>
          );
          break;

        case 'subsection':
          elements.push(
            <h3 key={key} className="text-xl font-semibold mt-5 mb-3 text-gray-800 dark:text-gray-200">
              {matchObj.content}
            </h3>
          );
          break;

        case 'subsubsection':
          elements.push(
            <h4 key={key} className="text-lg font-medium mt-4 mb-2 text-gray-700 dark:text-gray-300">
              {matchObj.content}
            </h4>
          );
          break;

        case 'itemize':
          const items = parseNestedList(matchObj.content, 'itemize');
          elements.push(
            <ul key={key} className="list-disc list-inside my-4 space-y-2 ml-4">
              {items}
            </ul>
          );
          break;

        case 'enumerate':
          const enumItems = parseNestedList(matchObj.content, 'enumerate');
          elements.push(
            <ol key={key} className="list-decimal list-inside my-4 space-y-2 ml-4">
              {enumItems}
            </ol>
          );
          break;

        default:
          elements.push(
            <span key={key}>{matchObj.match}</span>
          );
      }

      currentIndex = matchObj.endIndex;
    });

    // Add any remaining text
    if (currentIndex < text.length) {
      const remainingText = text.slice(currentIndex);
      if (remainingText.trim()) {
        const processedText = processTextFormatting(remainingText.trim());
        elements.push(
          <div key="text-end" className="whitespace-pre-wrap">
            {processedText}
          </div>
        );
      }
    }

    return elements.length > 0 ? elements : [
      <div key="empty" className="whitespace-pre-wrap">{text}</div>
    ];
  };

  if (format === 'LaTeX') {
    return (
      <div className={`prose prose-slate max-w-none dark:prose-invert ${className}`}>
        <div className="text-base leading-relaxed">
          {renderLatexContent(cleanedContent)}
        </div>
      </div>
    );
  } else {
    // For Markdown, use ReactMarkdown with proper configuration
    return (
      <div className={`prose prose-slate max-w-none dark:prose-invert ${className}`}>
        <ReactMarkdown
          components={{
            // Ensure proper styling for markdown elements
            h1: ({ children }) => <h1 className="text-3xl font-bold mt-6 mb-4">{children}</h1>,
            h2: ({ children }) => <h2 className="text-2xl font-bold mt-6 mb-4">{children}</h2>,
            h3: ({ children }) => <h3 className="text-xl font-semibold mt-5 mb-3">{children}</h3>,
            ul: ({ children }) => <ul className="list-disc list-inside my-4 space-y-2 ml-4">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-inside my-4 space-y-2 ml-4">{children}</ol>,
            li: ({ children }) => <li className="text-gray-700 dark:text-gray-300">{children}</li>,
            p: ({ children }) => <p className="mb-4">{children}</p>,
            strong: ({ children }) => <strong className="font-bold">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
          }}
        >
          {cleanedContent}
        </ReactMarkdown>
      </div>
    );
  }
} 