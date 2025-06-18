"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Edit3, Save, X, AlertTriangle } from 'lucide-react';
import NoteRenderer from '@/components/ui/NoteRenderer';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NoteEditorProps {
  initialContent: string;
  onSave: (content: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  className?: string;
  placeholder?: string;
  format?: 'Markdown' | 'LaTeX';
}

export default function NoteEditor({
  initialContent,
  onSave,
  onCancel,
  isLoading = false,
  className = "",
  placeholder = "Start editing your note...",
  format = 'Markdown'
}: NoteEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Track unsaved changes
  useEffect(() => {
    const hasChanges = content !== initialContent;
    setHasUnsavedChanges(hasChanges);
  }, [content, initialContent]);

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && hasUnsavedChanges) {
        // Page is being hidden with unsaved changes
        // Browser will show the beforeunload dialog
      }
    };

    if (hasUnsavedChanges) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [hasUnsavedChanges]);

  const handleSave = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      await onSave(content);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving note:', error);
      // Error handling will be done by parent component
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel? Your changes will be lost.'
      );
      if (!confirmed) {
        return;
      }
    }
    onCancel();
  };

  const togglePreview = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Editor Controls */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-center gap-2">
          {/* Preview Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={togglePreview}
            className="flex items-center gap-2"
          >
            {isPreviewMode ? (
              <>
                <Edit3 className="h-4 w-4" />
                Edit
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Preview
              </>
            )}
          </Button>
          
          {/* Format indicator */}
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {format} Format
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Unsaved changes indicator */}
          {hasUnsavedChanges && (
            <div className="flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3 w-3" />
              Unsaved changes
            </div>
          )}

          {/* Action buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={isSaving}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSaving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Editor/Preview Content */}
      <div className="min-h-[400px]">
        {isPreviewMode ? (
          /* Preview Mode */
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
            <div className="mb-2 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-2">
              Preview Mode
            </div>
            {content.trim() ? (
              <NoteRenderer content={content} format={format} />
            ) : (
              <div className="text-gray-500 dark:text-gray-400 italic">
                No content to preview. Switch to edit mode to add content.
              </div>
            )}
          </div>
        ) : (
          /* Edit Mode */
          <div className="space-y-2">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Edit Mode - Write your note in {format} format
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={placeholder}
              className="w-full min-h-[400px] p-4 border border-gray-200 dark:border-gray-700 rounded-lg 
                         bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                         font-mono text-sm leading-relaxed resize-y
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         placeholder-gray-400 dark:placeholder-gray-500"
              disabled={isSaving}
            />
            
            {/* Character count */}
            <div className="text-right text-xs text-gray-500 dark:text-gray-400">
              {content.length} characters
            </div>
          </div>
        )}
      </div>

      {/* Help text */}
      {!isPreviewMode && (
        <Alert>
          <AlertDescription className="text-sm">
            <strong>Tip:</strong> You can use standard Markdown syntax. For math expressions, use <code>$...$</code> for inline math and <code>$$...$$</code> for display math.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
} 