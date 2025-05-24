"use client";

import { useState } from "react";
import { X, Save, Loader2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SaveNoteRequest } from '@/lib/types/library';

interface SaveToLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (noteData: SaveNoteRequest) => Promise<void>;
  onSaveSuccess?: () => void;
  defaultTitle?: string;
  content: string;
  format: 'Markdown' | 'LaTeX';
  mediaId?: string;
  mediaTitle?: string;
}

export default function SaveToLibraryModal({
  isOpen,
  onClose,
  onSave,
  onSaveSuccess,
  defaultTitle = "",
  content,
  format,
  mediaId,
  mediaTitle
}: SaveToLibraryModalProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Please enter a title for your note");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave({
        title: title.trim(),
        content,
        format,
        original_media_id: mediaId,
        original_media_title: mediaTitle,
        tags
      });
      
      // Reset form and close modal
      setTitle("");
      setTags([]);
      setTagInput("");
      onClose();
      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (err: any) {
      setError(err.message || "Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = () => {
    const newTag = tagInput.trim().toLowerCase();
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Save to Library</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Title Input */}
          <div>
            <Label htmlFor="note-title">Note Title</Label>
            <Input
              id="note-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for your note..."
              className="mt-1"
            />
          </div>

          {/* Format Display */}
          <div>
            <Label>Format</Label>
            <div className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm">
              {format} {format === 'LaTeX' && '(Mathematical)'}
            </div>
          </div>

          {/* Source Media Display */}
          {mediaTitle && (
            <div>
              <Label>Source Media</Label>
              <div className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm truncate">
                {mediaTitle}
              </div>
            </div>
          )}

          {/* Tags Input */}
          <div>
            <Label htmlFor="tag-input">Tags (optional)</Label>
            <div className="mt-1 space-y-2">
              <div className="flex gap-2">
                <Input
                  id="tag-input"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagInputKeyPress}
                  placeholder="Add a tag..."
                  className="flex-1"
                />
                <Button type="button" onClick={handleAddTag} variant="outline" size="sm">
                  <Tag className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Tags Display */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Content Preview */}
          <div>
            <Label>Content Preview</Label>
            <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded text-sm max-h-24 overflow-y-auto">
              {content.substring(0, 200)}
              {content.length > 200 && "..."}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded">
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} disabled={saving} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !title.trim()} className="flex-1">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Note
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 