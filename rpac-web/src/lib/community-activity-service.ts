'use client';

import { supabase } from '@/lib/supabase';

export interface CommunityActivity {
  id: string;
  community_id: string;
  activity_type: 'member_joined' | 'resource_added' | 'resource_shared' | 'help_requested' | 'help_response_added' | 'community_resource_added' | 'community_resource_updated' | 'community_resource_deleted' | 'milestone' | 'custom';
  title: string;
  description: string;
  icon: string;
  user_id?: string;
  user_name?: string;
  resource_name?: string;
  resource_category?: string;
  image_url?: string;
  visible_public: boolean;
  created_at: string;
}

export const communityActivityService = {
  /**
   * Get recent activities for a community
   */
  async getCommunityActivities(
    communityId: string, 
    limit: number = 10
  ): Promise<CommunityActivity[]> {
    try {
      const { data, error } = await supabase
        .from('homespace_activity_log')
        .select('*')
        .eq('community_id', communityId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching community activities:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Get user profiles for activities that have user_id but no user_name
      const userIds = data
        .filter(item => item.user_id && (!item.user_name || item.user_name === 'Anonym användare'))
        .map(item => item.user_id);

      let profiles: Array<{ user_id: string; display_name?: string }> = [];
      if (userIds.length > 0) {
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('user_id, display_name')
          .in('user_id', userIds);
        profiles = profileData || [];
      }

      // Create a map for quick lookup
      const profilesMap = new Map(profiles.map(p => [p.user_id, p]));

      return data.map(item => {
        // If no user_name or it's 'Anonym användare', try to get it from profiles
        let userName = item.user_name;
        if ((!userName || userName === 'Anonym användare') && item.user_id) {
          const profile = profilesMap.get(item.user_id);
          userName = profile?.display_name || 'Ny medlem';
        }

        return {
          id: item.id,
          community_id: item.community_id,
          activity_type: item.activity_type,
          title: item.title,
          description: item.description,
          icon: item.icon,
          user_id: item.user_id || null,
          user_name: userName || 'Ny medlem',
          resource_name: item.resource_name || null,
          resource_category: item.resource_category || null,
          image_url: item.image_url || null,
          visible_public: item.visible_public,
          created_at: item.created_at
        };
      });
    } catch (error) {
      console.error('Failed to load activities:', error);
      return [];
    }
  },

  /**
   * Log a new community resource addition
   */
  async logResourceAdded(params: {
    communityId: string;
    resourceName: string;
    resourceCategory: string;
    addedBy: string;
    addedByName: string;
  }): Promise<void> {
    const { error } = await supabase
      .from('homespace_activity_log')
      .insert([{
        community_id: params.communityId,
        activity_type: 'resource_added',
        title: 'Ny samhällsresurs tillagd',
        description: `${params.addedByName} lade till "${params.resourceName}" i ${params.resourceCategory}-kategorin`,
        icon: '🏛️',
        user_id: params.addedBy,
        resource_name: params.resourceName,
        resource_category: params.resourceCategory,
        visible_public: true
      }]);

    if (error) throw error;
  },

  /**
   * Log a new individual resource shared
   */
  async logResourceShared(params: {
    communityId: string;
    resourceName: string;
    resourceCategory: string;
    sharedBy: string;
    sharedByName: string;
    quantity: number;
    imageUrl?: string;
  }): Promise<void> {
    const { error } = await supabase
      .from('homespace_activity_log')
      .insert([{
        community_id: params.communityId,
        activity_type: 'resource_shared',
        title: 'Resurs delad med samhället',
        description: `${params.sharedByName} delade "${params.resourceName}" (${params.quantity} st) i ${params.resourceCategory}-kategorin`,
        icon: '🤝',
        user_id: params.sharedBy,
        resource_name: params.resourceName,
        resource_category: params.resourceCategory,
        image_url: params.imageUrl || null,
        visible_public: true
      }]);

    if (error) throw error;
  },

  /**
   * Log a new member joining
   */
  async logMemberJoined(params: {
    communityId: string;
    memberName: string;
    memberId: string;
  }): Promise<void> {
    const { error } = await supabase
      .from('homespace_activity_log')
      .insert([{
        community_id: params.communityId,
        activity_type: 'member_joined',
        title: 'Ny medlem välkommen',
        description: `${params.memberName} gick med i samhället`,
        icon: '👥',
        user_id: params.memberId,
        visible_public: true
      }]);

    if (error) throw error;
  },

  /**
   * Log a help request
   */
  async logHelpRequested(params: {
    communityId: string;
    requestTitle: string;
    requestedBy: string;
    requestedByName: string;
    category: string;
  }): Promise<void> {
    const { error } = await supabase
      .from('homespace_activity_log')
      .insert([{
        community_id: params.communityId,
        activity_type: 'help_requested',
        title: 'Hjälpförfrågan skapad',
        description: `${params.requestedByName} begärde hjälp: "${params.requestTitle}"`,
        icon: '🆘',
        user_id: params.requestedBy,
        resource_name: params.requestTitle,
        resource_category: params.category,
        visible_public: true
      }]);

    if (error) {
      console.error('Error inserting help_requested activity:', error);
      throw error;
    }
  },

  /**
   * Log a custom milestone or achievement
   */
  async logMilestone(params: {
    communityId: string;
    title: string;
    description: string;
    icon: string;
    createdBy: string;
  }): Promise<void> {
    const { error } = await supabase
      .from('homespace_activity_log')
      .insert([{
        community_id: params.communityId,
        activity_type: 'milestone',
        title: params.title,
        description: params.description,
        icon: params.icon,
        user_id: params.createdBy,
        visible_public: true
      }]);

    if (error) throw error;
  },

  /**
   * Log a help response
   */
  async logHelpResponseAdded(params: {
    communityId: string;
    requestTitle: string;
    responderName: string;
    responderId: string;
  }): Promise<void> {
    const { error } = await supabase
      .from('homespace_activity_log')
      .insert([{
        community_id: params.communityId,
        activity_type: 'help_response_added',
        title: 'Hjälp erbjuden',
        description: `${params.responderName} erbjöd hjälp med: "${params.requestTitle}"`,
        icon: '🤲',
        user_id: params.responderId,
        resource_name: params.requestTitle,
        visible_public: true
      }]);

    if (error) throw error;
  },

  /**
   * Log a community resource addition
   */
  async logCommunityResourceAdded(params: {
    communityId: string;
    resourceName: string;
    resourceType: string;
    addedBy: string;
    addedByName: string;
  }): Promise<void> {
    const { error } = await supabase
      .from('homespace_activity_log')
      .insert([{
        community_id: params.communityId,
        activity_type: 'community_resource_added',
        title: 'Gemensam resurs tillagd',
        description: `${params.addedByName} lade till gemensam resurs: "${params.resourceName}"`,
        icon: '🏛️',
        user_id: params.addedBy,
        resource_name: params.resourceName,
        resource_category: params.resourceType,
        visible_public: true
      }]);

    if (error) {
      console.error('Error inserting community_resource_added activity:', error);
      throw error;
    }
  },

  /**
   * Log a community resource update
   */
  async logCommunityResourceUpdated(params: {
    communityId: string;
    resourceName: string;
    updatedBy: string;
    updatedByName: string;
  }): Promise<void> {
    const { error } = await supabase
      .from('homespace_activity_log')
      .insert([{
        community_id: params.communityId,
        activity_type: 'community_resource_updated',
        title: 'Gemensam resurs uppdaterad',
        description: `${params.updatedByName} uppdaterade: "${params.resourceName}"`,
        icon: '🔄',
        user_id: params.updatedBy,
        resource_name: params.resourceName,
        visible_public: true
      }]);

    if (error) throw error;
  },

  /**
   * Log a community resource deletion
   */
  async logCommunityResourceDeleted(params: {
    communityId: string;
    resourceName: string;
    deletedBy: string;
    deletedByName: string;
  }): Promise<void> {
    const { error } = await supabase
      .from('homespace_activity_log')
      .insert([{
        community_id: params.communityId,
        activity_type: 'community_resource_deleted',
        title: 'Gemensam resurs borttagen',
        description: `${params.deletedByName} tog bort: "${params.resourceName}"`,
        icon: '🗑️',
        user_id: params.deletedBy,
        resource_name: params.resourceName,
        visible_public: true
      }]);

    if (error) throw error;
  }
};
