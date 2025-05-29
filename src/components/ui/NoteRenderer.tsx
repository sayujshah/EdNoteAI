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
  format?: 'Markdown' | 'LaTeX';
  className?: string;
}

interface MathSegment {
  type: 'text' | 'inline-math' | 'block-math';
  content: string;
  index: number;
}

export default function NoteRenderer({ content, className = "" }: NoteRendererProps) {
  // Clean up AI-generated code block wrappers
  const cleanContent = (rawContent: string): string => {
    return rawContent
      .replace(/^```(?:markdown|md|latex|tex)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
  };

  // Parse content into segments (text, inline math, block math)
  const parseContentSegments = (text: string): MathSegment[] => {
    const segments: MathSegment[] = [];
    let textStart = 0;
    
    // First pass: find all block math ($$...$$) - these are separate segments
    const blockMathMatches: Array<{start: number, end: number, content: string}> = [];
    const blockMathRegex = /\$\$[\s\S]*?\$\$/g;
    let blockMatch;
    
    while ((blockMatch = blockMathRegex.exec(text)) !== null) {
      blockMathMatches.push({
        start: blockMatch.index,
        end: blockMatch.index + blockMatch[0].length,
        content: blockMatch[0].slice(2, -2).trim()
      });
    }
    
    // Create segments, preserving block math as separate elements
    blockMathMatches.forEach(match => {
      // Add text before this block math (will contain inline math)
      if (match.start > textStart) {
        const textContent = text.slice(textStart, match.start);
        if (textContent.trim()) {
          segments.push({
            type: 'text',
            content: textContent,
            index: textStart
          });
        }
      }
      
      // Add block math segment
      segments.push({
        type: 'block-math',
        content: match.content,
        index: match.start
      });
      
      textStart = match.end;
    });
    
    // Add remaining text
    if (textStart < text.length) {
      const textContent = text.slice(textStart);
      if (textContent.trim()) {
        segments.push({
          type: 'text',
          content: textContent,
          index: textStart
        });
        }
      }

    return segments;
    };

  // Enhanced function to render content with proper inline math handling within text segments
  const renderTextSegmentWithMath = (textContent: string): React.ReactElement => {
    // Pre-process text to ensure proper spacing around inline math
    let processedText = textContent;
    
    // Add spaces around inline math if missing
    processedText = processedText.replace(/(?<![\s$])\$/g, ' $');
    processedText = processedText.replace(/\$(?![\s$])/g, '$ ');
    
    // Clean up multiple spaces
    processedText = processedText.replace(/  +/g, ' ');

    // Create a custom text component that handles inline math within text nodes
    const MathAwareText: React.FC<{ children: React.ReactNode }> = ({ children }) => {
      if (typeof children !== 'string') {
        return <>{children}</>;
      }

      const text = children;
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;

      // Find all inline math expressions
      const mathRegex = /\$([^$\n]+?)\$/g;
      let match;
      
      while ((match = mathRegex.exec(text)) !== null) {
        const mathContent = match[1].trim();

        // Enhanced math detection
        const hasMathContent = /[\\{}^_]|\\[a-zA-Z]+|frac|sqrt|sum|int|prod|lim|infty|alpha|beta|gamma|theta|pi|sigma|mu|nu|tau|omega|Delta|Gamma|Phi|Psi|cdot|times|div|pm|mp|leq|geq|neq|equiv|approx|propto|subset|supset|in|notin|cup|cap|vee|wedge|neg|forall|exists|nabla|partial|rightarrow|leftarrow|Rightarrow|Leftarrow/.test(mathContent);
        const isSingleVariable = /^[a-zA-Z]$/.test(mathContent);
        const isSimpleMath = /^[a-zA-Z0-9]+[\+\-\*\/\^_]|[\+\-\*\/\^_][a-zA-Z0-9]+|[a-zA-Z][0-9]|[0-9][a-zA-Z]|[a-zA-Z]+\([a-zA-Z0-9\-\+\*\/]*\)/.test(mathContent);
        const isSimpleNumber = /^[\d\s,\.]+$/.test(mathContent);
        const isLikelyCurrency = /^\d+(\.\d{2})?$/.test(mathContent);
        
        if ((hasMathContent || isSingleVariable || isSimpleMath) && !isSimpleNumber && !isLikelyCurrency) {
          // Add text before math
          if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
          }
          
          // Add inline math component
          try {
            parts.push(
              <InlineMath key={`math-${match.index}`}>{mathContent}</InlineMath>
            );
          } catch (error) {
            console.warn('Inline math rendering error:', error);
            parts.push(
              <code key={`math-error-${match.index}`} className="bg-red-100 text-red-800 px-1 rounded text-sm">
                ${mathContent}$
              </code>
            );
          }
          
          lastIndex = match.index + match[0].length;
        }
      }
      
      // Add remaining text
      if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
      }
      
      // Return as inline elements to preserve text flow
      return parts.length > 1 ? <>{parts}</> : <>{children}</>;
    };

    return (
      <ReactMarkdown
        components={{
          // Block-level elements
          h1: ({ children }) => <h1 className="text-3xl font-bold mt-6 mb-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-2xl font-bold mt-6 mb-4">{children}</h2>,
          h3: ({ children }) => <h3 className="text-xl font-semibold mt-5 mb-3">{children}</h3>,
          h4: ({ children }) => <h4 className="text-lg font-medium mt-4 mb-2">{children}</h4>,
          h5: ({ children }) => <h5 className="text-base font-medium mt-3 mb-2">{children}</h5>,
          h6: ({ children }) => <h6 className="text-sm font-medium mt-2 mb-1">{children}</h6>,
          
          // Paragraph with proper inline handling
          p: ({ children }) => (
            <p className="mb-4 leading-relaxed">
              <MathAwareText>{children}</MathAwareText>
            </p>
          ),
          
          // Lists
          ul: ({ children }) => <ul className="list-disc list-inside my-4 space-y-2 ml-4">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside my-4 space-y-2 ml-4">{children}</ol>,
          li: ({ children }) => (
            <li className="text-gray-700 dark:text-gray-300">
              <MathAwareText>{children}</MathAwareText>
            </li>
          ),
          
          // Inline elements
          strong: ({ children }) => (
            <strong className="font-bold">
              <MathAwareText>{children}</MathAwareText>
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic">
              <MathAwareText>{children}</MathAwareText>
            </em>
          ),
          
          // Code elements
          code: ({ children }) => (
            <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto my-4">
              {children}
            </pre>
          ),
          
          // Block quote
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4 text-gray-600 dark:text-gray-400">
              <MathAwareText>{children}</MathAwareText>
            </blockquote>
          ),
          
          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-gray-200 dark:border-gray-700">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 font-semibold text-left">
              <MathAwareText>{children}</MathAwareText>
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2">
              <MathAwareText>{children}</MathAwareText>
            </td>
          ),
          
          // Handle text nodes for math
          text: ({ children }) => <MathAwareText>{children}</MathAwareText>,
        }}
      >
        {processedText}
      </ReactMarkdown>
    );
  };

  // Render a single segment
  const renderSegment = (segment: MathSegment, index: number): React.ReactNode => {
    const key = `segment-${segment.type}-${index}`;
    
    switch (segment.type) {
      case 'block-math':
        try {
          return (
            <div key={key} className="my-4 text-center">
              <BlockMath>{segment.content}</BlockMath>
            </div>
          );
        } catch (error) {
          console.warn('Block math rendering error:', error);
          return (
            <div key={key} className="my-4 p-2 bg-red-50 border border-red-200 rounded">
              <code className="text-red-800">$${segment.content}$$</code>
              <div className="text-xs text-red-600 mt-1">Math rendering error</div>
            </div>
          );
        }
        
      case 'text':
        // Render text segment with proper inline math handling
        return (
          <div key={key}>
            {renderTextSegmentWithMath(segment.content)}
          </div>
        );
        
      default:
        return null;
    }
  };

  const cleanedContent = cleanContent(content);

    return (
      <div className={`prose prose-slate max-w-none dark:prose-invert ${className}`}>
      {parseContentSegments(cleanedContent).map((segment, index) => renderSegment(segment, index))}
      </div>
    );
} 