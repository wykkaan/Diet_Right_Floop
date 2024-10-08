import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ message: 'Missing auth token' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) throw userError;

    const { weight } = await req.json();
    const { data, error } = await supabase
      .from('users')
      .update({ weight })
      .eq('id', user.id);

    if (error) throw error;

    return NextResponse.json({ message: 'Weight updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating weight:', error);
    return NextResponse.json({ message: 'Failed to update weight' }, { status: 500 });
  }
}