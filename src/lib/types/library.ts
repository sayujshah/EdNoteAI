// TypeScript interfaces for the Notes Library system

export interface SavedNote {
  id: string;
  user_id: string;
  title: string;
  content: string;
  format: 'Markdown' | 'LaTeX';
  original_media_id?: string;
  original_media_title?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface SaveNoteRequest {
  title: string;
  content: string;
  format: 'Markdown' | 'LaTeX';
  original_media_id?: string;
  original_media_title?: string;
  tags?: string[];
}

export interface UpdateSavedNoteRequest {
  title?: string;
  content?: string;
  tags?: string[];
}

export interface LibraryFilter {
  format?: 'Markdown' | 'LaTeX' | 'all';
  tags?: string[];
  search?: string;
}

export interface LibrarySort {
  field: 'created_at' | 'updated_at' | 'title';
  direction: 'asc' | 'desc';
} 