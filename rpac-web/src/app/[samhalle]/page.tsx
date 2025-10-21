import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import CommunityHomespace from '@/components/community-homespace';

// Configure for Edge Runtime (required for Cloudflare Pages)
export const runtime = 'edge';

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ samhalle: string }> }) {
  const { samhalle } = await params;

  const { data: homespace } = await supabase
    .from('community_homespaces')
    .select(`
      *,
      communities:local_communities (
        id,
        community_name,
        county,
        description,
        created_at,
        member_count
      )
    `)
    .eq('slug', samhalle)
    .eq('published', true)
    .single();

  if (!homespace) {
    return {
      title: 'Samhälle hittades inte | Beready',
    };
  }

  return {
    title: `${homespace.communities.community_name} | Beready`,
    description: homespace.about_text || homespace.communities.description || `Välkommen till ${homespace.communities.community_name} - ett lokalt beredskapssamhälle.`,
    openGraph: {
      title: homespace.communities.community_name,
      description: homespace.about_text || homespace.communities.description,
      type: 'website',
    },
  };
}

export default async function SamhallePage({ params }: { params: Promise<{ samhalle: string }> }) {
  const { samhalle } = await params;

  // Fetch homespace data
  const { data: homespace, error } = await supabase
    .from('community_homespaces')
    .select(`
      *,
      communities:local_communities (
        id,
        community_name,
        county,
        description,
        created_at,
        member_count
      )
    `)
    .eq('slug', samhalle)
    .eq('published', true)
    .single();

  // If homespace doesn't exist or isn't published, show 404
  if (error || !homespace) {
    notFound();
  }

  // Normalize communities data (handle array or object)
  const normalizedHomespace = {
    ...homespace,
    communities: Array.isArray(homespace.communities) 
      ? homespace.communities[0] 
      : homespace.communities
  };

  // Track view count (fire and forget - don't wait for response)
  supabase
    .rpc('increment_homespace_views', { homespace_id: homespace.id })
    .then((result) => {
      // Silently handle both success and error
      if (result.error) {
        // View counting failed, but not critical
      }
    });

  return <CommunityHomespace homespace={normalizedHomespace} />;
}

