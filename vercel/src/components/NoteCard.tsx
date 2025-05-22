'use client';

import Link from 'next/link';
// TODO: Import icons for Edit, Download, Delete from lucide-react

interface NoteCardProps {
  note: {
    id: string; // Media ID
    title: string; // Media title (or inferred from notes)
    description: string; // Short description/excerpt (inferred from notes)
    tags: string[]; // Tags (from lessons or inferred)
    created_at: string; // Media creation date
    type: 'video' | 'audio'; // Media type
    // Include other data needed for actions (download, delete)
  };
  onDelete: (noteId: string) => void; // Function to handle delete action
  // TODO: Add onDownload and onEdit handlers if needed
}

export default function NoteCard({ note, onDelete }: NoteCardProps) {
  return (
    <div className="border rounded-lg p-4 shadow-sm flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-bold mb-2">{note.title}</h3>
        <p className="text-sm text-muted-foreground mb-3">{note.description}</p>
        {/* Display tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="mb-2">
            {note.tags.map(tag => (
              <span key={tag} className="inline-block bg-gray-200 rounded-full px-2 py-0.5 text-xs font-semibold text-gray-700 mr-2">{tag}</span>
            ))}
          </div>
        )}
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-3">Created: {new Date(note.created_at).toLocaleDateString()}</p>
        {/* Action Icons */}
        <div className="flex justify-end space-x-2">
          {/* Edit Icon (Link to media detail page) */}
          <Link href={`/media/${note.id}`} className="text-gray-500 hover:text-blue-600 text-sm" title="Edit Note"> {/* Updated link */}
            {/* TODO: Replace with actual Edit icon */}
            Edit
          </Link>
          {/* Download Icon (triggers export API) */}
          <button
            onClick={() => window.open(`/api/media/${note.id}/export?format=markdown`, '_blank')} // Default to markdown for now
            className="text-gray-500 hover:text-green-600 text-sm"
            title="Download Notes (Markdown)"
          >
            {/* TODO: Replace with actual Download icon */}
            Download
          </button>
          {/* Delete Icon (triggers delete API via onDelete prop) */}
          <button
            onClick={() => onDelete(note.id)}
            className="text-gray-500 hover:text-red-600 text-sm"
            title="Delete Note"
          >
            {/* TODO: Replace with actual Delete icon */}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
