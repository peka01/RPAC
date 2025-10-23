/**
 * Regional Service - County-level data aggregation and regional coordination
 * Provides functions for aggregating community data at the county (län) level
 */

import { supabase } from './supabase';

export interface RegionalStatistics {
  totalCommunities: number;
  totalMembers: number;
  averagePreparedness: number;
  activeHelpRequests: number;
  sharedResources: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'community_created' | 'resource_shared' | 'help_request' | 'member_joined';
  timestamp: string;
  description: string;
  communityName?: string;
  details?: any;
}

export interface CommunityOverview {
  id: string;
  name: string;
  memberCount: number;
  location: string;
  postalCode: string;
  createdAt: string;
  sharedResourcesCount: number;
  activeRequestsCount: number;
}

/**
 * Get regional statistics for a specific county
 */
export async function getRegionalStatistics(county: string): Promise<RegionalStatistics> {
  try {
    // Fetching statistics for county
    
    // First, let's check ALL communities to see what we have
    const { data: allCommunities } = await supabase
      .from('local_communities')
      .select('id, community_name, county, postal_code, is_public')
      .eq('is_public', true);
    
    // All public communities loaded
    // Communities grouped by county
    
    // Get communities in the county (case-insensitive partial match)
    // This matches both "Kronoberg" and "Kronobergs län"
    const searchPattern = `%${county}%`;
    // Searching with pattern
    
    const { data: communities, error: commError } = await supabase
      .from('local_communities')
      .select('id, member_count, county, postal_code, community_name')
      .ilike('county', searchPattern)
      .eq('is_public', true);

    if (commError) {
      console.error('[RegionalService] Error fetching communities:', commError);
      throw commError;
    }
    
    // Found communities for county
    // Community details loaded

    const totalCommunities = communities?.length || 0;
    const communityIds = communities?.map(c => c.id) || [];

    // Get ACTUAL member count from community_memberships table (not the cached field)
    let totalMembers = 0;
    if (communityIds.length > 0) {
      const { count: memberCount } = await supabase
        .from('community_memberships')
        .select('*', { count: 'exact', head: true })
        .in('community_id', communityIds);
      
      totalMembers = memberCount || 0;
      // Actual member count from memberships table
    }

    // Get help requests count
    // NOTE: resource_requests table doesn't have community_id field yet
    // It's designed for shared resource requests, not community help requests
    // Skip this query for now to avoid 400 errors
    const helpRequestCount = 0;
    // TODO: Implement proper community help requests table or adjust schema

    // Get shared resources count
    let sharedResourcesCount = 0;
    if (communityIds.length > 0) {
      try {
        const { count, error } = await supabase
          .from('resource_sharing')
          .select('*', { count: 'exact', head: true })
          .in('community_id', communityIds)
          .eq('status', 'available');
        
        if (error) {
          // If community_id column doesn't exist, fall back to unfiltered count
          console.warn('Community_id column not found for count, falling back to unfiltered query:', error);
          const { count: fallbackCount } = await supabase
            .from('resource_sharing')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'available');
          sharedResourcesCount = fallbackCount || 0;
        } else {
          sharedResourcesCount = count || 0;
        }
      } catch (err) {
        console.error('Error fetching shared resources count:', err);
        sharedResourcesCount = 0;
      }
    }

    // Get recent activity
    const recentActivity = await getRecentActivity(county, communityIds);

    // Calculate average preparedness (placeholder - would need user_profiles integration)
    const averagePreparedness = totalCommunities > 0 ? 7.5 : 0;

    return {
      totalCommunities,
      totalMembers,
      averagePreparedness,
      activeHelpRequests: helpRequestCount || 0,
      sharedResources: sharedResourcesCount || 0,
      recentActivity
    };
  } catch (error) {
    console.error('Error fetching regional statistics:', error);
    return {
      totalCommunities: 0,
      totalMembers: 0,
      averagePreparedness: 0,
      activeHelpRequests: 0,
      sharedResources: 0,
      recentActivity: []
    };
  }
}

/**
 * Get recent activity in the county
 */
async function getRecentActivity(county: string, communityIds: string[]): Promise<ActivityItem[]> {
  const activities: ActivityItem[] = [];

  try {
    // Get recent community creations (case-insensitive partial match)
    const { data: newCommunities } = await supabase
      .from('local_communities')
      .select('id, community_name, created_at')
      .ilike('county', `%${county}%`)
      .order('created_at', { ascending: false })
      .limit(5);

    if (newCommunities) {
      newCommunities.forEach(comm => {
        activities.push({
          id: `comm-${comm.id}`,
          type: 'community_created',
          timestamp: comm.created_at,
          description: `Nytt samhälle registrerat: ${comm.community_name}`,
          communityName: comm.community_name
        });
      });
    }

    // Get recent resource sharing (if we have communities)
    if (communityIds.length > 0) {
      try {
        // First try with community_id filter
        const { data: recentShares, error: sharesError } = await supabase
          .from('resource_sharing')
          .select(`
            id,
            created_at,
            quantity,
            resource_name,
            community_id
          `)
          .in('community_id', communityIds)
          .order('created_at', { ascending: false })
          .limit(5);

        if (sharesError) {
          // If community_id column doesn't exist, fall back to unfiltered query
          console.warn('Community_id column not found, falling back to unfiltered query:', sharesError);
          const { data: fallbackShares, error: fallbackError } = await supabase
            .from('resource_sharing')
            .select(`
              id,
              created_at,
              quantity,
              resource_name
            `)
            .order('created_at', { ascending: false })
            .limit(5);

          if (!fallbackError && fallbackShares) {
            fallbackShares.forEach(share => {
              const resourceName = share.resource_name || 'resurs';
              activities.push({
                id: `share-${share.id}`,
                type: 'resource_shared',
                timestamp: share.created_at,
                description: `Resurs delad: ${resourceName}`,
                communityName: 'Lokalt samhälle',
                details: { quantity: share.quantity }
              });
            });
          }
        } else if (recentShares) {
          recentShares.forEach(share => {
            const resourceName = share.resource_name || 'resurs';
            // Use a generic community name since we don't have access to communities here
            const communityName = 'Lokalt samhälle';
            activities.push({
              id: `share-${share.id}`,
              type: 'resource_shared',
              timestamp: share.created_at,
              description: `${communityName} delade ${resourceName}`,
              communityName: communityName,
              details: { quantity: share.quantity }
            });
          });
        }
      } catch (err) {
        console.error('Error fetching resource sharing:', err);
      }

      // Get recent community activities (new communities, member joins, etc.)
      try {
        const { data: recentMemberships, error: membershipsError } = await supabase
          .from('community_memberships')
          .select(`
            id,
            joined_at,
            local_communities (community_name)
          `)
          .in('community_id', communityIds)
          .order('joined_at', { ascending: false })
          .limit(3);

        if (!membershipsError && recentMemberships) {
          recentMemberships.forEach(membership => {
            const communityName = (membership.local_communities as any)?.community_name || 'ett samhälle';
            activities.push({
              id: `join-${membership.id}`,
              type: 'member_joined',
              timestamp: membership.joined_at,
              description: `Ny medlem gick med i ${communityName}`,
              communityName: communityName,
              details: {}
            });
          });
        }
      } catch (err) {
        console.error('Error fetching recent memberships:', err);
      }
    }

    // Sort all activities by timestamp and limit to 10
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
}

/**
 * Get detailed list of communities in a county
 */
export async function getCommunitiesInCounty(county: string): Promise<CommunityOverview[]> {
  try {
    const { data: communities, error } = await supabase
      .from('local_communities')
      .select('id, community_name, location, postal_code, member_count, created_at')
      .ilike('county', `%${county}%`)
      .eq('is_public', true)
      .order('member_count', { ascending: false });

    if (error) throw error;
    if (!communities) return [];

    // Get resource and request counts for each community
    const communityOverviews = await Promise.all(
      communities.map(async (comm) => {
        try {
          // Get ACTUAL member count from community_memberships
          const { count: actualMemberCount } = await supabase
            .from('community_memberships')
            .select('*', { count: 'exact', head: true })
            .eq('community_id', comm.id);

          // Get shared resources count (with error handling)
          let sharedCount = 0;
          try {
            const { count } = await supabase
              .from('resource_sharing')
              .select('*', { count: 'exact', head: true })
              .eq('community_id', comm.id)
              .eq('status', 'available');
            sharedCount = count || 0;
          } catch (err) {
            console.error('Error fetching shared resources for community:', comm.id, err);
          }

          // Get request count
          // NOTE: resource_requests table doesn't have community_id field
          // Skip this query to avoid 400 errors
          const requestCount = 0;

          return {
            id: comm.id,
            name: comm.community_name,
            memberCount: actualMemberCount || 0,
            location: comm.location,
            postalCode: comm.postal_code || '',
            createdAt: comm.created_at,
            sharedResourcesCount: sharedCount,
            activeRequestsCount: requestCount
          };
        } catch (err) {
          console.error('Error processing community:', comm.id, err);
          return {
            id: comm.id,
            name: comm.community_name,
            memberCount: 0,
            location: comm.location,
            postalCode: comm.postal_code || '',
            createdAt: comm.created_at,
            sharedResourcesCount: 0,
            activeRequestsCount: 0
          };
        }
      })
    );

    return communityOverviews;
  } catch (error) {
    console.error('Error fetching communities in county:', error);
    return [];
  }
}

/**
 * Get coordination opportunities - communities with surplus vs. needs
 */
export async function getCoordinationOpportunities(county: string) {
  try {
    const { data: communities } = await supabase
      .from('local_communities')
      .select('id, community_name')
      .ilike('county', `%${county}%`)
      .eq('is_public', true);

    if (!communities || communities.length === 0) {
      return { surplus: [], needs: [] };
    }

    const communityIds = communities.map(c => c.id);

    // Communities with surplus resources
    let surplusData = null;
    try {
      const { data, error } = await supabase
        .from('resource_sharing')
        .select(`
          community_id,
          resource_name,
          resource_category
        `)
        .in('community_id', communityIds)
        .eq('status', 'available')
        .limit(20);
      
      if (error) {
        // If community_id column doesn't exist, fall back to unfiltered query
        console.warn('Community_id column not found for surplus, falling back to unfiltered query:', error);
        const { data: fallbackData } = await supabase
          .from('resource_sharing')
          .select(`
            id,
            resource_name,
            resource_category
          `)
          .eq('status', 'available')
          .limit(20);
        surplusData = fallbackData;
      } else {
        surplusData = data;
      }
    } catch (err) {
      console.error('Error fetching surplus resources:', err);
      surplusData = null;
    }

    // Communities with active needs
    const { data: needsData } = await supabase
      .from('resource_requests')
      .select(`
        community_id,
        resource_needed,
        urgency,
        local_communities (community_name)
      `)
      .in('community_id', communityIds)
      .in('status', ['pending', 'approved'])
      .limit(20);

    return {
      surplus: surplusData || [],
      needs: needsData || []
    };
  } catch (error) {
    console.error('Error fetching coordination opportunities:', error);
    return { surplus: [], needs: [] };
  }
}

