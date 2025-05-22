'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '../../components/AuthGuard'; // Adjust path as needed
import NoteCard from '../../components/NoteCard'; // Import NoteCard component

// Define interfaces for Video/Note data based on Supabase schema and API response
interface TranscriptData {
  id: string;
  video_id: string;
  content: string; // Raw transcript
  segmented_content: { // Structured AI-generated notes
    title?: string;
    segments?: Array<{
      heading?: string;
      summary?: string;
      key_points?: string[];
      demonstration_description?: string;
      start_time?: number;
      end_time?: number;
      on_screen_text?: string[]; // Added based on Note Agent structure
    }>;
    generated_at?: string;
  } | null;
  created_at: string;
}

interface LessonData {
    tags?: string[]; // Assuming tags are an array of strings
}

interface VideoDataFromApi {
  id: string;
  lesson_id: string;
  url: string;
  transcription_status: string;
  created_at: string;
  title?: string; // Video title might be stored here
  transcripts: TranscriptData | null; // Assuming one transcript per video
  lessons: LessonData | null; // Assuming one lesson per video
}

// Interface for data used in NoteCard component
interface NoteCardData {
  id: string; // Video ID
  title: string; // Video title (or inferred from notes)
  description: string; // Short description/excerpt (inferred from notes)
  tags: string[]; // Tags (from lessons or inferred)
  created_at: string; // Video creation date
  type: 'video' | 'audio'; // Media type
  // Include other data needed for actions (download, delete)
}

export default function NotesLibraryPage() {
  const [notes, setNotes] = useState<NoteCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'video' | 'audio'>('all'); // State for type filter
  const [sortBy, setSortBy] = useState<'created_at_desc' | 'created_at_asc' | 'title_asc' | 'title_desc'>('created_at_desc'); // State for sorting with more options

  // Function to fetch user's notes (videos with transcripts/segmented content)
  const fetchNotes = async () => {
    setLoading(true);
    setError(null);
    try {
      // Construct query parameters based on filter and sort state
      const queryParams = new URLSearchParams();
      if (typeFilter !== 'all') {
        queryParams.append('type', typeFilter);
      }
      if (sortBy === 'created_at_desc') {
        queryParams.append('sortBy', 'created_at_desc');
      } else if (sortBy === 'created_at_asc') {
        queryParams.append('sortBy', 'created_at_asc');
      } else if (sortBy === 'title_asc') {
        queryParams.append('sortBy', 'title_asc');
      } else if (sortBy === 'title_desc') {
        queryParams.append('sortBy', 'title_desc');
      }

      const response = await fetch(`/api/media?${queryParams.toString()}`); // Fetch data with query parameters
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch notes');
      }
      const data: VideoDataFromApi[] = await response.json(); // Use 'any' for now, map to NoteCardData

      // Map fetched data to NoteCardData structure
      const formattedNotes: NoteCardData[] = data.map(video => ({
        id: video.id,
        title: video.title || video.transcripts?.segmented_content?.title || `Video ${video.id}`, // Use video title or inferred title
        description: video.transcripts?.segmented_content?.segments?.[0]?.summary || video.transcripts?.content?.substring(0, 150) + '...' || 'No description available.', // Use segment summary or transcript excerpt
        tags: video.lessons?.tags || [], // Assuming tags are on lessons
        created_at: video.created_at,
        type: video.url.includes('.mp4') ? 'video' : 'audio', // Infer type from URL (basic)
        // Include other data needed for actions
      }));

      setNotes(formattedNotes);

    } catch (error: any) {
      setError(error.message);
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch notes on component mount and when filter/sort state changes
  useEffect(() => {
    fetchNotes();
  }, [typeFilter, sortBy, fetchNotes]); // Rerun effect when filter or sort changes

  // Event handlers for filtering and sorting
  const handleTypeFilterChange = (filter: 'all' | 'video' | 'audio') => {
    setTypeFilter(filter);
  };

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(event.target.value as 'created_at_desc'); // Cast value to sortBy type
  };
  // TODO: Implement other sorting options

  if (loading) return <p>Loading notes library...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <AuthGuard> {/* Wrap content with AuthGuard */}
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Your Notes Library</h1>

        {/* Filtering and Sorting */}
        <div className="flex justify-between items-center mb-6">
          {/* Filter buttons (All, Video, Audio) */}
          <div>
            <button
              onClick={() => handleTypeFilterChange('all')}
              className={`mr-2 px-3 py-1 border rounded text-sm ${typeFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
            >
              All Notes
            </button>
            <button
              onClick={() => handleTypeFilterChange('video')}
              className={`mr-2 px-3 py-1 border rounded text-sm ${typeFilter === 'video' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
            >
              Video
            </button>
            <button
              onClick={() => handleTypeFilterChange('audio')}
              className={`px-3 py-1 border rounded text-sm ${typeFilter === 'audio' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
            >
              Audio
            </button>
          </div>
          {/* Sorting dropdown */}
          <div>
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="border rounded px-3 py-1 text-sm text-gray-700"
            >
              <option value="created_at_desc">Newest First</option>
              <option value="created_at_asc">Oldest First</option>
              <option value="title_asc">Title (A-Z)</option>
              <option value="title_desc">Title (Z-A)</option>
            </select>
          </div>
        </div>

        {/* Notes Grid */}
        {!loading && notes.length === 0 && <p>No notes found in your library.</p>}

        {!loading && notes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} onDelete={async (noteId) => {
                // Implement delete logic here or pass down from parent
                if (confirm('Are you sure you want to delete this note?')) {
                  try {
                    const response = await fetch(`/api/media/${noteId}`, {
                      method: 'DELETE',
                    });
                    if (!response.ok) {
                      const errorData = await response.json();
                      throw new Error(errorData.message || 'Failed to delete note');
                    }
                    // Remove the deleted note from the state
                    setNotes(notes.filter(n => n.id !== noteId));
                    console.log(`Note ${noteId} deleted successfully.`);
                  } catch (error: any) {
                    console.error('Error deleting note:', error);
                    alert(`Failed to delete note: ${error.message}`);
                  }
                }
              }} />
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
