"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, Search, Filter, Plus, FileText, Brain, Grid3X3, List, SortAsc, SortDesc } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/Skeleton";
import type { SavedNote } from '@/lib/types/library';

// Note Card Component
interface NoteCardProps {
  note: SavedNote;
  onDelete: (noteId: string) => void;
  viewMode: 'grid' | 'list';
}

function NoteCard({ note, onDelete, viewMode }: NoteCardProps) {
  const isGridView = viewMode === 'grid';
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPreview = (content: string, maxLength: number = 150) => {
    // Remove LaTeX commands and get plain text preview
    const plainText = content
      .replace(/\\[a-zA-Z]+\{[^}]*\}/g, '') // Remove LaTeX commands
      .replace(/\$\$[\s\S]*?\$\$/g, '[Math]') // Replace block math
      .replace(/\$[^$]*?\$/g, '[Math]') // Replace inline math
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim();
    
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...'
      : plainText;
  };

  if (isGridView) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {note.format === 'LaTeX' ? (
              <Brain className="h-5 w-5 text-purple-600" />
            ) : (
              <FileText className="h-5 w-5 text-blue-600" />
            )}
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              {note.format}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={() => onDelete(note.id)}
          >
            Delete
          </Button>
        </div>
        
        <Link href={`/dashboard/library/${note.id}`}>
          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer line-clamp-2">
            {note.title}
          </h3>
        </Link>
        
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
          {getPreview(note.content)}
        </p>
        
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {note.tags.slice(0, 3).map((tag) => (
              <span 
                key={tag}
                className="inline-block px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full"
              >
                {tag}
              </span>
            ))}
            {note.tags.length > 3 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                +{note.tags.length - 3} more
              </span>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Created {formatDate(note.created_at)}</span>
          {note.original_media_title && (
            <span className="truncate ml-2" title={note.original_media_title}>
              From: {note.original_media_title}
            </span>
          )}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-sm transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2">
              {note.format === 'LaTeX' ? (
                <Brain className="h-4 w-4 text-purple-600" />
              ) : (
                <FileText className="h-4 w-4 text-blue-600" />
              )}
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                {note.format}
              </span>
            </div>
            
            <Link href={`/dashboard/library/${note.id}`}>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer truncate">
                {note.title}
              </h3>
            </Link>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2">
            {getPreview(note.content, 200)}
          </p>
          
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span>Created {formatDate(note.created_at)}</span>
            {note.original_media_title && (
              <span className="truncate" title={note.original_media_title}>
                From: {note.original_media_title}
              </span>
            )}
            {note.tags.length > 0 && (
              <span>{note.tags.length} tag{note.tags.length > 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 ml-4"
          onClick={() => onDelete(note.id)}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}

export default function LibraryPage() {
  const [notes, setNotes] = useState<SavedNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters and search
  const [searchQuery, setSearchQuery] = useState("");
  const [formatFilter, setFormatFilter] = useState<'all' | 'Markdown' | 'LaTeX'>('all');
  const [sortField, setSortField] = useState<'created_at' | 'updated_at' | 'title'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotes, setTotalNotes] = useState(0);

  const fetchNotes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        sortField,
        sortDirection
      });
      
      if (formatFilter !== 'all') {
        params.append('format', formatFilter);
      }
      
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      
      const response = await fetch(`/api/library?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch notes');
      }
      
      const data = await response.json();
      setNotes(data.notes);
      setTotalPages(data.pagination.totalPages);
      setTotalNotes(data.pagination.total);
      
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [currentPage, formatFilter, sortField, sortDirection, searchQuery]);

  const handleDelete = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/library/${noteId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete note');
      }
      
      // Remove note from local state
      setNotes(notes.filter(note => note.id !== noteId));
      setTotalNotes(prev => prev - 1);
      
    } catch (err: any) {
      alert(`Failed to delete note: ${err.message}`);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchNotes();
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">EdNoteAI</span>
            <span className="text-sm text-muted-foreground ml-2">/ Notes Library</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/dashboard" className="text-sm font-medium hover:text-primary">
              Dashboard
            </Link>
            <Link href="/dashboard/upload" className="text-sm font-medium hover:text-primary">
              Upload
            </Link>
            <Button variant="ghost" size="sm">
              Sign Out
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Your Notes Library</h1>
            <p className="text-muted-foreground mt-2">
              {totalNotes > 0 
                ? `${totalNotes} saved note${totalNotes > 1 ? 's' : ''}`
                : 'No saved notes yet'
              }
            </p>
          </div>
          <Link href="/dashboard/upload">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Upload Media
            </Button>
          </Link>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 items-end">
            {/* Search */}
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Search notes</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title or content..."
                  className="pl-10"
                />
              </div>
            </div>

            {/* Format Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Format</label>
              <Select value={formatFilter} onValueChange={(value: 'all' | 'Markdown' | 'LaTeX') => setFormatFilter(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Markdown">Markdown</SelectItem>
                  <SelectItem value="LaTeX">LaTeX</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div>
              <label className="text-sm font-medium mb-2 block">Sort by</label>
              <div className="flex gap-2">
                <Select value={sortField} onValueChange={(value: 'created_at' | 'updated_at' | 'title') => setSortField(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Created</SelectItem>
                    <SelectItem value="updated_at">Updated</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                >
                  {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* View Mode */}
            <div>
              <label className="text-sm font-medium mb-2 block">View</label>
              <div className="flex rounded-lg border border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Notes Grid/List */}
        {loading ? (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
          }>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <Skeleton className="h-6 w-3/4 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <div className="flex gap-2 mb-3">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400 mb-4">Error loading notes: {error}</p>
            <Button onClick={fetchNotes}>Try Again</Button>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {searchQuery || formatFilter !== 'all' ? 'No matching notes found' : 'No saved notes yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery || formatFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Upload media and generate notes to get started'
              }
            </p>
            {!searchQuery && formatFilter === 'all' && (
              <Link href="/dashboard/upload">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Your First Media
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
            }>
              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onDelete={handleDelete}
                  viewMode={viewMode}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && (
                    <>
                      <span className="px-2">...</span>
                      <Button
                        variant={currentPage === totalPages ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
} 