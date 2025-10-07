/**
 * Resource Sharing Service
 * Service for managing resource sharing and help requests in communities
 */

import { supabase } from './supabase';

export interface SharedResource {
  id: string;
  user_id: string;
  resource_id: string;
  community_id?: string;
  shared_quantity: number;
  available_until?: string;
  status: 'available' | 'requested' | 'reserved' | 'taken';
  location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  resource_name?: string;
  resource_category?: string;
  resource_unit?: string;
  sharer_name?: string;
}

export interface HelpRequest {
  id: string;
  user_id: string;
  community_id: string;
  title: string;
  description: string;
  category: 'food' | 'water' | 'medicine' | 'energy' | 'tools' | 'shelter' | 'transport' | 'skills' | 'other';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  location?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: number;
  created_at: string;
  updated_at: string;
  // Joined data
  requester_name?: string;
  response_count?: number;
}

export interface HelpResponse {
  id: string;
  help_request_id: string;
  responder_id: string;
  message: string;
  can_help: boolean;
  created_at: string;
  // Joined data
  responder_name?: string;
}

export const resourceSharingService = {
  /**
   * Get available shared resources in a community
   */
  async getCommunityResources(communityId: string): Promise<SharedResource[]> {
    // Fetch resource_sharing with denormalized fields (no join needed)
    // Show all resources except 'taken' ones
    const { data, error } = await supabase
      .from('resource_sharing')
      .select('*')
      .eq('community_id', communityId)
      .neq('status', 'taken')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get user profiles for the sharers
    const userIds = [...new Set((data || []).map(item => item.user_id))];
    let profiles: Array<{ id: string; display_name?: string; avatar_url?: string }> = [];
    if (userIds.length > 0) {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('user_id, display_name')
        .in('user_id', userIds);
      profiles = (profileData || []).map(profile => ({
        id: profile.user_id,
        display_name: profile.display_name,
        avatar_url: undefined
      }));
    }

    return (data || []).map(item => {
      const profile = profiles.find(p => p.id === item.user_id);
      return {
        id: item.id,
        user_id: item.user_id,
        resource_id: item.resource_id,
        community_id: item.community_id,
        shared_quantity: item.shared_quantity,
        available_until: item.available_until,
        status: item.status,
        location: item.location,
        notes: item.notes,
        created_at: item.created_at,
        updated_at: item.updated_at,
        // Use denormalized fields directly from resource_sharing
        resource_name: item.resource_name,
        resource_category: item.resource_category || item.category,
        resource_unit: item.resource_unit || item.unit,
        sharer_name: profile?.display_name || 'Medlem'
      };
    });
  },

  /**
   * Share a resource with the community
   */
  async shareResource(params: {
    userId: string;
    resourceId: string;
    communityId: string;
    sharedQuantity: number;
    availableUntil?: string;
    location?: string;
    notes?: string;
  }): Promise<SharedResource> {
    const { data, error } = await supabase
      .from('resource_sharing')
      .insert([{
        user_id: params.userId,
        resource_id: params.resourceId,
        community_id: params.communityId,
        shared_quantity: params.sharedQuantity,
        available_until: params.availableUntil,
        location: params.location,
        notes: params.notes,
        status: 'available'
      }])
      .select()
      .single();

    if (error) throw error;
    return data as SharedResource;
  },

  /**
   * Request a shared resource
   */
  async requestResource(resourceId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('resource_sharing')
      .update({ 
        status: 'requested',
        updated_at: new Date().toISOString()
      })
      .eq('id', resourceId);

    if (error) throw error;
  },

  /**
   * Mark resource as taken
   */
  async markResourceTaken(resourceId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('resource_sharing')
      .update({ 
        status: 'taken',
        updated_at: new Date().toISOString()
      })
      .eq('id', resourceId)
      .eq('user_id', userId); // Only owner can mark as taken

    if (error) throw error;
  },

  /**
   * Update shared resource (simple version for modal)
   */
  async updateSharedResourceSimple(resourceId: string, updates: Partial<SharedResource>): Promise<void> {
    const { error } = await supabase
      .from('resource_sharing')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', resourceId);

    if (error) throw error;
  },

  /**
   * Delete shared resource
   */
  async deleteSharedResource(resourceId: string): Promise<void> {
    const { error} = await supabase
      .from('resource_sharing')
      .delete()
      .eq('id', resourceId);

    if (error) throw error;
  },

  /**
   * Update shared resource
   */
  async updateSharedResource(params: {
    resourceId: string;
    userId: string;
    resource_name?: string;
    category?: string;
    unit?: string;
    quantity?: number;
    shared_quantity?: number;
    available_until?: string | null;
    location?: string | null;
    notes?: string | null;
  }): Promise<SharedResource> {
    const { resourceId, userId, ...updateFields } = params;
    
    const { data, error } = await supabase
      .from('resource_sharing')
      .update({
        ...updateFields,
        // Update duplicate fields if they exist
        resource_category: updateFields.category,
        resource_unit: updateFields.unit,
        updated_at: new Date().toISOString()
      })
      .eq('id', resourceId)
      .eq('user_id', userId) // Only owner can update
      .select()
      .single();

    if (error) throw error;
    return data as SharedResource;
  },

  /**
   * Remove shared resource
   */
  async removeSharedResource(resourceId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('resource_sharing')
      .delete()
      .eq('id', resourceId)
      .eq('user_id', userId); // Only owner can delete

    if (error) throw error;
  },

  /**
   * Get help requests for a community
   */
  async getCommunityHelpRequests(communityId: string): Promise<HelpRequest[]> {
    const { data, error } = await supabase
      .from('help_requests')
      .select('*')
      .eq('community_id', communityId)
      .in('status', ['open', 'in_progress'])
      .order('urgency', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get user profiles for the requesters
    const userIds = [...new Set((data || []).map(item => item.user_id))];
    let profiles: Array<{ id: string; display_name?: string; avatar_url?: string }> = [];
    if (userIds.length > 0) {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('user_id, display_name')
        .in('user_id', userIds);
      profiles = (profileData || []).map(profile => ({
        id: profile.user_id,
        display_name: profile.display_name,
        avatar_url: undefined
      }));
    }

    return (data || []).map(item => {
      const profile = profiles.find(p => p.id === item.user_id);
      return {
        ...item,
        requester_name: profile?.display_name || 'Medlem',
        response_count: 0 // TODO: Count responses when we add help_responses table
      };
    }) as HelpRequest[];
  },

  /**
   * Create a help request
   */
  async createHelpRequest(params: {
    userId: string;
    communityId: string;
    title: string;
    description: string;
    category: HelpRequest['category'];
    urgency: HelpRequest['urgency'];
    location?: string;
  }): Promise<HelpRequest> {
    // Calculate priority based on urgency
    const priorityMap = { low: 1, medium: 2, high: 3, critical: 4 };
    const priority = priorityMap[params.urgency];

    const { data, error } = await supabase
      .from('help_requests')
      .insert([{
        user_id: params.userId,
        community_id: params.communityId,
        title: params.title,
        description: params.description,
        category: params.category,
        urgency: params.urgency,
        location: params.location,
        priority,
        status: 'open'
      }])
      .select()
      .single();

    if (error) throw error;
    return data as HelpRequest;
  },

  /**
   * Update help request status
   */
  async updateHelpRequestStatus(
    requestId: string, 
    userId: string, 
    status: HelpRequest['status']
  ): Promise<void> {
    const { error } = await supabase
      .from('help_requests')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .eq('user_id', userId); // Only requester can update

    if (error) throw error;
  },

  /**
   * Delete help request
   */
  async deleteHelpRequest(requestId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('help_requests')
      .delete()
      .eq('id', requestId)
      .eq('user_id', userId); // Only requester can delete

    if (error) throw error;
  },

  /**
   * Get user's shared resources
   */
  async getUserSharedResources(userId: string): Promise<SharedResource[]> {
    const { data, error } = await supabase
      .from('resource_sharing')
      .select(`
        *,
        resources!inner(name, category, unit)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(item => ({
      id: item.id,
      user_id: item.user_id,
      resource_id: item.resource_id,
      community_id: item.community_id,
      shared_quantity: item.shared_quantity,
      available_until: item.available_until,
      status: item.status,
      location: item.location,
      notes: item.notes,
      created_at: item.created_at,
      updated_at: item.updated_at,
      resource_name: item.resources?.name,
      resource_category: item.resources?.category,
      resource_unit: item.resources?.unit
    }));
  },

  /**
   * Get user's help requests
   */
  async getUserHelpRequests(userId: string): Promise<HelpRequest[]> {
    const { data, error } = await supabase
      .from('help_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as HelpRequest[];
  }
};

