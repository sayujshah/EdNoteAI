import { NextResponse } from 'next/server';
import createClient from '../../../../../lib/supabase/server'; // Import server-side client - Corrected path

// API route for exporting video notes/transcripts by video ID

// GET /api/videos/{videoId}/export?format={format} - Export notes/transcript
export async function GET(request: Request, { params }: { params: { videoId: string } }) {
  // Get authenticated user
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const videoId = params.videoId;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format'); // Get the requested format

  if (!format) {
    return NextResponse.json({ error: 'Missing format parameter' }, { status: 400 });
  }

  console.log(`Exporting video ${videoId} for user ${user.id} in format: ${format}`);

  // Fetch the video and its associated transcript and segmented content
  const { data: videoData, error: fetchError } = await supabaseServer
    .from('videos')
    .select('lessons(user_id), transcripts(*)') // Select video, lesson user_id, and transcript
    .eq('id', videoId)
    .single();

  if (fetchError || !videoData || videoData.lessons?.user_id !== user.id) {
    return NextResponse.json({ error: 'Video not found or user does not own it' }, { status: 404 });
  }

  if (!videoData.transcripts) {
      return NextResponse.json({ error: 'Transcript not available for this video' }, { status: 404 });
  }

  const rawTranscript = videoData.transcripts.content;
  const segmentedContent = videoData.transcripts.segmented_content; // Get segmented content

  let exportedContent: string;
  let contentType: string;
  let fileExtension: string;

  // TODO: Implement formatting logic based on the requested format
  switch (format) {
    case 'markdown':
      exportedContent = `# ${videoData.title || 'Video Notes'}\n\n## Raw Transcript\n${rawTranscript}\n\n## Generated Notes\n${JSON.stringify(segmentedContent, null, 2)}`; // Placeholder
      contentType = 'text/markdown';
      fileExtension = 'md';
      break;
    case 'latex':
      exportedContent = `\\documentclass{article}\n\\title{${videoData.title || 'Video Notes'}}\n\\author{}\n\\date{}\n\\begin{document}\n\\maketitle\n\n\\section*{Raw Transcript}\n${rawTranscript}\n\n\\section*{Generated Notes}\n\\begin{verbatim}\n${JSON.stringify(segmentedContent, null, 2)}\n\\end{verbatim}\n\n\\end{document}`; // Placeholder
      contentType = 'application/x-latex';
      fileExtension = 'tex';
      break;
    case 'docx':
      // DOCX generation is complex and usually requires a library or service
      return NextResponse.json({ error: 'DOCX export not yet implemented' }, { status: 501 });
    case 'txt':
      exportedContent = `Video Notes: ${videoData.title || 'Untitled'}\n\nRaw Transcript:\n${rawTranscript}\n\nGenerated Notes:\n${JSON.stringify(segmentedContent, null, 2)}`; // Placeholder
      contentType = 'text/plain';
      fileExtension = 'txt';
      break;
    default:
      return NextResponse.json({ error: `Unsupported format: ${format}` }, { status: 400 });
  }

  // TODO: Set appropriate headers for file download
  const headers = new Headers();
  headers.set('Content-Type', contentType);
  headers.set('Content-Disposition', `attachment; filename="video_notes.${fileExtension}"`);

  return new NextResponse(exportedContent, { headers });
}
