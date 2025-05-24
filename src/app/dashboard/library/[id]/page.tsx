"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { BookOpen, ArrowLeft, Edit3, Save, X, Tag, Calendar, FileText, Brain, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/Skeleton";
import 'katex/dist/katex.min.css';
import dynamic from 'next/dynamic';
import { InlineMath, BlockMath } from 'react-katex';
import type { SavedNote, UpdateSavedNoteRequest } from '@/lib/types/library';
import NoteRenderer from '@/components/ui/NoteRenderer';
import { useAuth } from '@/contexts/AuthContext';

// Dynamic import for ReactMarkdown
const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false });

export default function NoteViewerPage() {
  const { id } = useParams() as { id: string };
  const auth = useAuth();
  const router = useRouter();
  const [note, setNote] = useState<SavedNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    fetchNote();
  }, [id]);

  const fetchNote = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/library/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Note not found');
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to fetch note');
        }
        return;
      }
      
      const noteData: SavedNote = await response.json();
      setNote(noteData);
      setEditTitle(noteData.title);
      setEditTags([...noteData.tags]);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!note || !editTitle.trim()) return;
    
    setSaving(true);
    setSaveError(null);
    
    try {
      const updates: UpdateSavedNoteRequest = {
        title: editTitle.trim(),
        tags: editTags
      };
      
      const response = await fetch(`/api/library/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update note');
      }
      
      const updatedNote: SavedNote = await response.json();
      setNote(updatedNote);
      setIsEditing(false);
      
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!note) return;
    
    if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/library/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete note');
      }
      
      router.push('/dashboard/library');
      
    } catch (err: any) {
      alert(`Failed to delete note: ${err.message}`);
    }
  };

  const handleAddTag = () => {
    const trimmedTag = newTag.trim().toLowerCase();
    if (trimmedTag && !editTags.includes(trimmedTag)) {
      setEditTags([...editTags, trimmedTag]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditTags(editTags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderNoteContent = () => {
    if (!note) return null;

    return (
      <NoteRenderer 
        content={note.content} 
        format={note.format}
      />
    );
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">EdNoteAI</span>
            </div>
          </div>
        </header>
        
        <main className="flex-1 container py-8 max-w-4xl">
          <div className="space-y-6">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-12 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">EdNoteAI</span>
            </div>
          </div>
        </header>
        
        <main className="flex-1 container py-8 max-w-4xl">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {error === 'Note not found' ? 'Note Not Found' : 'Error Loading Note'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <div className="flex gap-4 justify-center">
              <Link href="/dashboard/library">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Library
                </Button>
              </Link>
              {error !== 'Note not found' && (
                <Button onClick={fetchNote}>Try Again</Button>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">EdNoteAI</span>
            <span className="text-sm text-muted-foreground ml-2">/ Note</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/dashboard/library" className="text-sm font-medium hover:text-primary">
              Library
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container py-8 max-w-4xl">
        {/* Back Button */}
        <Link href="/dashboard/library">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Button>
        </Link>

        {note && (
          <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-title">Title</Label>
                    <Input
                      id="edit-title"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-tags">Tags</Label>
                    <div className="mt-1 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          id="edit-tags"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={handleTagKeyPress}
                          placeholder="Add a tag..."
                          className="flex-1"
                        />
                        <Button type="button" onClick={handleAddTag} variant="outline" size="sm">
                          <Tag className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {editTags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {editTags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full"
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

                  {saveError && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded">
                      {saveError}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button onClick={handleSave} disabled={saving || !editTitle.trim()}>
                      {saving ? (
                        <>
                          <Save className="h-4 w-4 mr-2 animate-pulse" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setIsEditing(false);
                      setEditTitle(note.title);
                      setEditTags([...note.tags]);
                      setSaveError(null);
                    }} disabled={saving}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {note.format === 'LaTeX' ? (
                        <Brain className="h-6 w-6 text-purple-600" />
                      ) : (
                        <FileText className="h-6 w-6 text-blue-600" />
                      )}
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {note.title}
                        </h1>
                        <span className="text-sm font-medium px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          {note.format} Format
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setIsEditing(true)}>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  {/* Tags */}
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {note.tags.map((tag) => (
                        <span 
                          key={tag}
                          className="inline-block px-2 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Created {formatDate(note.created_at)}</span>
                    </div>
                    {note.updated_at !== note.created_at && (
                      <span>Updated {formatDate(note.updated_at)}</span>
                    )}
                    {note.original_media_title && (
                      <span className="truncate">From: {note.original_media_title}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Content Section */}
            {!isEditing && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8">
                {renderNoteContent()}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
} 