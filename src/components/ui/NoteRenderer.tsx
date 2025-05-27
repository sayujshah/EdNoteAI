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

export default function NoteRenderer({ content, format = 'Markdown', className = "" }: NoteRendererProps) {
  // Clean up AI-generated code block wrappers
  const cleanContent = (rawContent: string): string => {
    return rawContent
      .replace(/^```(?:markdown|md|latex|tex)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
  };

  // Fix missing backslashes before LaTeX math functions
  const fixMissingBackslashes = (text: string): string => {
    // List of common LaTeX math functions that require backslashes
    const mathFunctions = [
      // Basic math functions
      'frac', 'sqrt', 'cbrt', 'root',
      // Trigonometric functions
      'sin', 'cos', 'tan', 'sec', 'csc', 'cot',
      'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh',
      // Logarithmic functions
      'log', 'ln', 'lg',
      // Summation and integration
      'sum', 'prod', 'int', 'oint', 'iint', 'iiint',
      // Limits and derivatives
      'lim', 'limsup', 'liminf', 'sup', 'inf',
      'partial', 'nabla', 'grad', 'div', 'curl',
      // Greek letters
      'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'varepsilon',
      'zeta', 'eta', 'theta', 'vartheta', 'iota', 'kappa',
      'lambda', 'mu', 'nu', 'xi', 'pi', 'varpi', 'rho', 'varrho',
      'sigma', 'varsigma', 'tau', 'upsilon', 'phi', 'varphi',
      'chi', 'psi', 'omega',
      'Gamma', 'Delta', 'Theta', 'Lambda', 'Xi', 'Pi', 'Sigma',
      'Upsilon', 'Phi', 'Psi', 'Omega',
      // Mathematical operators and symbols
      'cdot', 'times', 'div', 'pm', 'mp', 'ast', 'star',
      'circ', 'bullet', 'diamond', 'oplus', 'ominus', 'otimes',
      'odot', 'oslash', 'cap', 'cup', 'uplus', 'sqcap', 'sqcup',
      'vee', 'wedge', 'setminus', 'wr',
      // Relations
      'leq', 'geq', 'equiv', 'models', 'prec', 'succ', 'sim',
      'perp', 'mid', 'parallel', 'bowtie', 'smile', 'frown',
      'asymp', 'notin', 'neq', 'approx', 'cong', 'simeq',
      'propto', 'sqsubseteq', 'sqsupseteq', 'subset', 'supset',
      'subseteq', 'supseteq',
      // Arrows
      'leftarrow', 'rightarrow', 'leftrightarrow', 'uparrow',
      'downarrow', 'updownarrow', 'Leftarrow', 'Rightarrow',
      'Leftrightarrow', 'Uparrow', 'Downarrow', 'Updownarrow',
      'mapsto', 'longmapsto', 'hookleftarrow', 'hookrightarrow',
      'leftharpoonup', 'rightharpoonup', 'leftharpoondown', 'rightharpoondown',
      // Special symbols
      'infty', 'emptyset', 'varnothing', 'triangle', 'Box',
      'Diamond', 'clubsuit', 'diamondsuit', 'heartsuit', 'spadesuit',
      'neg', 'flat', 'natural', 'sharp', 'ell', 'hbar',
      'imath', 'jmath', 'wp', 'Re', 'Im', 'prime', 'forall', 'exists',
      // Text modifiers (though less common in math mode)
      'text', 'textbf', 'textit', 'textrm', 'textsc', 'texttt',
      'mathbf', 'mathit', 'mathrm', 'mathbb', 'mathcal', 'mathfrak',
      'mathsf', 'mathtt',
      // Spacing
      'quad', 'qquad', 'thinspace', 'medspace', 'thickspace',
      // Brackets and delimiters  
      'left', 'right', 'big', 'Big', 'bigg', 'Bigg',
      // Matrix and array
      'begin', 'end', 'matrix', 'pmatrix', 'bmatrix', 'vmatrix', 'Vmatrix',
      // Other common functions
      'to', 'gcd', 'lcm', 'max', 'min', 'arg', 'ker', 'dim', 'hom',
      'det', 'exp', 'deg', 'Pr'
    ];

    // Create regex pattern for math functions
    const mathFunctionPattern = mathFunctions.join('|');
    
    // Fix missing backslashes in both inline and block math
    // Pattern: $ followed by math function (without backslash)
    const inlineMathPattern = new RegExp(`(\\$)([^$\\\\]*?)(${mathFunctionPattern})([^$]*?\\$)`, 'g');
    const blockMathPattern = new RegExp(`(\\$\\$)([^$\\\\]*?)(${mathFunctionPattern})([^$]*?\\$\\$)`, 'g');
    
    let fixedText = text;
    
    // Fix block math first (to avoid conflicts with inline math)
    fixedText = fixedText.replace(blockMathPattern, (match, opening, beforeFunc, func, afterFunc) => {
      // Only add backslash if there isn't already one
      if (!beforeFunc.endsWith('\\')) {
        return `${opening}${beforeFunc}\\${func}${afterFunc}`;
      }
      return match;
    });
    
    // Fix inline math
    fixedText = fixedText.replace(inlineMathPattern, (match, opening, beforeFunc, func, afterFunc) => {
      // Only add backslash if there isn't already one
      if (!beforeFunc.endsWith('\\')) {
        return `${opening}${beforeFunc}\\${func}${afterFunc}`;
      }
      return match;
    });
    
    // Additional fix for cases where math function is immediately after the $
    // Pattern: $functionName or $$functionName
    const immediatePattern = new RegExp(`(\\$\\$?)(${mathFunctionPattern})`, 'g');
    fixedText = fixedText.replace(immediatePattern, (match, dollars, func) => {
      return `${dollars}\\${func}`;
    });
    
    return fixedText;
  };

  // Parse content into segments (text, inline math, block math)
  const parseContentSegments = (text: string): MathSegment[] => {
    const segments: MathSegment[] = [];
    let currentIndex = 0;
    
    // First pass: find all block math ($$...$$)
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
    
    // Second pass: find all inline math ($...$) that don't overlap with block math
    const inlineMathMatches: Array<{start: number, end: number, content: string}> = [];
    const inlineMathRegex = /\$([^$\n]+?)\$/g;
    let inlineMatch;
    
    while ((inlineMatch = inlineMathRegex.exec(text)) !== null) {
      const start = inlineMatch.index;
      const end = start + inlineMatch[0].length;
      
      // Check if this inline math overlaps with any block math
      const overlapsWithBlock = blockMathMatches.some(block => 
        (start >= block.start && start < block.end) || 
        (end > block.start && end <= block.end) ||
        (start < block.start && end > block.end)
      );
      
      if (!overlapsWithBlock) {
        const mathContent = inlineMatch[1].trim();
        
        // Improved math detection - check for LaTeX commands or mathematical symbols
        const hasMathContent = /[\\{}^_]|\\[a-zA-Z]+|frac|sqrt|sum|int|prod|lim|infty|alpha|beta|gamma|theta|pi|sigma|mu|nu|tau|omega|Delta|Gamma|Phi|Psi|cdot|times|div|pm|mp|leq|geq|neq|equiv|approx|propto|subset|supset|in|notin|cup|cap|vee|wedge|neg|forall|exists|nabla|partial|rightarrow|leftarrow|Rightarrow|Leftarrow/.test(mathContent);
        
        // Don't treat simple numbers or currency as math
        const isSimpleNumber = /^[\d\s,\.]+$/.test(mathContent);
        const isLikelyCurrency = /^\d+(\.\d{2})?$/.test(mathContent);
        
        if (hasMathContent && !isSimpleNumber && !isLikelyCurrency) {
          inlineMathMatches.push({
            start,
            end,
            content: mathContent
          });
        }
      }
    }
    
    // Combine and sort all matches
    const allMatches = [
      ...blockMathMatches.map(m => ({...m, type: 'block-math' as const})),
      ...inlineMathMatches.map(m => ({...m, type: 'inline-math' as const}))
    ].sort((a, b) => a.start - b.start);
    
    // Create segments
    let textStart = 0;
    
    allMatches.forEach(match => {
      // Add text before this math
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
      
      // Add math segment
      segments.push({
        type: match.type,
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
        
      case 'inline-math':
        try {
          return <InlineMath key={key}>{segment.content}</InlineMath>;
        } catch (error) {
          console.warn('Inline math rendering error:', error);
          return (
            <code key={key} className="bg-red-100 text-red-800 px-1 rounded text-sm">
              ${segment.content}$
            </code>
          );
        }
        
      case 'text':
        // Render text segment as markdown
        return (
          <ReactMarkdown
            key={key}
            components={{
              h1: ({ children }) => <h1 className="text-3xl font-bold mt-6 mb-4">{children}</h1>,
              h2: ({ children }) => <h2 className="text-2xl font-bold mt-6 mb-4">{children}</h2>,
              h3: ({ children }) => <h3 className="text-xl font-semibold mt-5 mb-3">{children}</h3>,
              h4: ({ children }) => <h4 className="text-lg font-medium mt-4 mb-2">{children}</h4>,
              h5: ({ children }) => <h5 className="text-base font-medium mt-3 mb-2">{children}</h5>,
              h6: ({ children }) => <h6 className="text-sm font-medium mt-2 mb-1">{children}</h6>,
              p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="list-disc list-inside my-4 space-y-2 ml-4">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside my-4 space-y-2 ml-4">{children}</ol>,
              li: ({ children }) => <li className="text-gray-700 dark:text-gray-300">{children}</li>,
              strong: ({ children }) => <strong className="font-bold">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
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
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4 text-gray-600 dark:text-gray-400">
                  {children}
                </blockquote>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto my-4">
                  <table className="min-w-full border-collapse border border-gray-200 dark:border-gray-700">
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 font-semibold text-left">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border border-gray-200 dark:border-gray-700 px-3 py-2">
                  {children}
                </td>
              ),
            }}
          >
            {segment.content}
          </ReactMarkdown>
        );
        
      default:
        return null;
    }
  };

  const cleanedContent = cleanContent(content);
  const fixedContent = fixMissingBackslashes(cleanedContent);
  const segments = parseContentSegments(fixedContent);

  return (
    <div className={`prose prose-slate max-w-none dark:prose-invert ${className}`}>
      {segments.map((segment, index) => renderSegment(segment, index))}
    </div>
  );
}