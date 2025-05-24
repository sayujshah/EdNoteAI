import { NextResponse } from 'next/server';
import createClient from '../../../lib/supabase/server';
import type { SavedNote, LibraryFilter, LibrarySort } from '@/lib/types/library';

// API route for managing saved notes library

// GET /api/library - Retrieve user's saved notes with filtering and sorting
export async function GET(request: Request) {
  // Get authenticated user
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  
  // Parse query parameters
  const format = searchParams.get('format') as 'Markdown' | 'LaTeX' | 'all';
  const search = searchParams.get('search');
  const sortField = searchParams.get('sortField') as 'created_at' | 'updated_at' | 'title' || 'created_at';
  const sortDirection = searchParams.get('sortDirection') as 'asc' | 'desc' || 'desc';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  console.log(`Fetching saved notes for user: ${user.id}, Format: ${format}, Search: ${search}`);

  try {
    // Build the query
    let query = supabaseServer
      .from('saved_notes')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    // Apply filters
    if (format && format !== 'all') {
      query = query.eq('format', format);
    }

    if (search) {
      // Search in title and content
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    // Apply sorting
    query = query.order(sortField, { ascending: sortDirection === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: savedNotes, error, count } = await query;

    if (error) {
      console.error('Error fetching saved notes:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      notes: savedNotes,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (err: any) {
    console.error('Error fetching saved notes:', err);
    return NextResponse.json({ error: 'Failed to fetch saved notes' }, { status: 500 });
  }
}

// POST /api/library - Save a new note to library
export async function POST(request: Request) {
  // Get authenticated user
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const {
      title,
      content,
      format,
      original_media_id,
      original_media_title,
      tags = []
    } = await request.json();

    // Validate required fields
    if (!title || !content || !format) {
      return NextResponse.json({ 
        error: 'Title, content, and format are required' 
      }, { status: 400 });
    }

    if (!['Markdown', 'LaTeX'].includes(format)) {
      return NextResponse.json({ 
        error: 'Format must be either Markdown or LaTeX' 
      }, { status: 400 });
    }

    console.log(`Saving note "${title}" for user: ${user.id}`);

    const { data: savedNote, error } = await supabaseServer
      .from('saved_notes')
      .insert([{
        user_id: user.id,
        title,
        content,
        format,
        original_media_id,
        original_media_title,
        tags
      }])
      .select()
      .single();

    if (error) {
      console.error('Error saving note:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(savedNote, { status: 201 });

  } catch (err: any) {
    console.error('Error saving note:', err);
    return NextResponse.json({ error: 'Failed to save note' }, { status: 500 });
  }
} 