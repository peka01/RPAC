/**
 * Resource Sharing Service
 * Service for managing resource sharing and help requests in communities
 */

import { supabase } from './supabase';
import { notificationService } from './notification-service';

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
  community_name?: string;
  // Request status for current user
  has_user_requested?: boolean;
  // Request counts for resource owner
  pending_requests_count?: number;
}

export interface ResourceRequest {
  id: string;
  shared_resource_id: string;
  requester_id: string;
  requested_quantity: number;
  status: 'pending' | 'approved' | 'denied' | 'completed' | 'cancelled';
  message?: string;
  response_message?: string;
  requested_at: string;
  responded_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  requester_name?: string;
  requester_email?: string;
  resource_name?: string;
  resource_category?: string;
  resource_unit?: string;
  sharer_name?: string;
  sharer_email?: string;
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
  async getCommunityResources(communityId: string, currentUserId?: string): Promise<SharedResource[]> {
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

    // Get user's requests for these resources if currentUserId is provided
    let userRequests: string[] = [];
    if (currentUserId && data && data.length > 0) {
      const resourceIds = data.map(item => item.id);
      console.log('Checking requests for user:', currentUserId, 'resources:', resourceIds);
      const { data: requestData, error: requestError } = await supabase
        .from('resource_requests')
        .select('shared_resource_id')
        .eq('requester_id', currentUserId)
        .in('shared_resource_id', resourceIds)
        .in('status', ['pending', 'approved']);
      
      if (requestError) {
        console.error('Error fetching user requests:', requestError);
      } else {
        console.log('Found user requests:', requestData);
      }
      
      userRequests = (requestData || []).map(req => req.shared_resource_id);
    }

    // Get pending requests count for each resource (for resource owners)
    let pendingRequestsCount: Record<string, number> = {};
    if (data && data.length > 0) {
      const resourceIds = data.map(item => item.id);
      try {
        const { data: pendingData } = await supabase
          .from('resource_requests')
          .select('shared_resource_id')
          .in('shared_resource_id', resourceIds)
          .eq('status', 'pending');
        
        if (pendingData) {
          pendingRequestsCount = pendingData.reduce((acc, req) => {
            acc[req.shared_resource_id] = (acc[req.shared_resource_id] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          console.log('Pending requests count:', pendingRequestsCount);
        }
      } catch (error) {
        console.warn('Could not fetch pending requests count:', error);
      }
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
        sharer_name: profile?.display_name || 'Medlem',
        // Check if current user has requested this resource
        has_user_requested: userRequests.includes(item.id),
        // Pending requests count for resource owners
        pending_requests_count: pendingRequestsCount[item.id] || 0
      };
    }).map(item => {
      console.log(`Resource ${item.id} (${item.resource_name}): has_user_requested = ${item.has_user_requested}, pending_requests_count = ${item.pending_requests_count}`);
      return item;
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

    // Get community names separately if community_id exists
    const communityIds = [...new Set((data || []).map(item => item.community_id).filter(Boolean))];
    let communityNames: Record<string, string> = {};
    
    if (communityIds.length > 0) {
      try {
        const { data: communityData } = await supabase
          .from('local_communities')
          .select('id, community_name')
          .in('id', communityIds);
        
        if (communityData) {
          communityNames = communityData.reduce((acc, community) => {
            acc[community.id] = community.community_name;
            return acc;
          }, {} as Record<string, string>);
        }
      } catch (communityError) {
        console.warn('Could not fetch community names:', communityError);
      }
    }

    // Get pending requests count for each resource
    let pendingRequestsCount: Record<string, number> = {};
    if (data && data.length > 0) {
      const resourceIds = data.map(item => item.id);
      try {
        const { data: pendingData } = await supabase
          .from('resource_requests')
          .select('shared_resource_id')
          .in('shared_resource_id', resourceIds)
          .eq('status', 'pending');
        
        if (pendingData) {
          pendingRequestsCount = pendingData.reduce((acc, req) => {
            acc[req.shared_resource_id] = (acc[req.shared_resource_id] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
        }
      } catch (error) {
        console.warn('Could not fetch pending requests count for user resources:', error);
      }
    }

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
      resource_unit: item.resources?.unit,
      community_name: item.community_id ? communityNames[item.community_id] : undefined,
      pending_requests_count: pendingRequestsCount[item.id] || 0
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
  },

  /**
   * Request a shared resource
   */
  async requestSharedResource(params: {
    sharedResourceId: string;
    requesterId: string;
    requestedQuantity: number;
    message?: string;
  }): Promise<ResourceRequest> {
    const { data, error } = await supabase
      .from('resource_requests')
      .insert({
        shared_resource_id: params.sharedResourceId,
        requester_id: params.requesterId,
        requested_quantity: params.requestedQuantity,
        message: params.message
      })
      .select()
      .single();

    if (error) throw error;

    // Create notification for resource owner
    try {
      // Get the shared resource details to find the owner
      const { data: sharedResource, error: resourceError } = await supabase
        .from('resource_sharing')
        .select(`
          user_id,
          community_id,
          resources!inner(name)
        `)
        .eq('id', params.sharedResourceId)
        .single();

      if (resourceError) {
        console.error('Error getting shared resource details:', resourceError);
      } else if (sharedResource) {
        // Get requester name
        const { data: requesterProfile } = await supabase
          .from('user_profiles')
          .select('display_name')
          .eq('user_id', params.requesterId)
          .single();

        const requesterName = requesterProfile?.display_name || 'En användare';
        const resourceName = sharedResource.resources?.name || 'resurs';

        await notificationService.createResourceRequestNotification({
          recipientId: sharedResource.user_id,
          requesterName: requesterName,
          resourceName: resourceName,
          resourceId: params.sharedResourceId,
          communityId: sharedResource.community_id
        });
      }
    } catch (notificationError) {
      console.error('Error creating resource request notification:', notificationError);
      // Don't fail the request if notification creation fails
    }

    // Don't update the shared resource status immediately
    // The resource should remain 'available' until the owner approves the request
    // The request status will be tracked separately in the resource_requests table

    return data;
  },

  /**
   * Get requests for a shared resource
   */
  async getSharedResourceRequests(sharedResourceId: string): Promise<ResourceRequest[]> {
    try {
      // First, get the requests without joins
      const { data: requests, error: requestsError } = await supabase
        .from('resource_requests')
        .select('*')
        .eq('shared_resource_id', sharedResourceId)
        .order('created_at', { ascending: false });

      if (requestsError) {
        // If table doesn't exist, return empty array instead of throwing
        if (requestsError.code === 'PGRST116' || requestsError.message?.includes('relation "resource_requests" does not exist')) {
          console.log('Resource requests table not found, returning empty array');
          return [];
        }
        throw requestsError;
      }

      if (!requests || requests.length === 0) {
        return [];
      }

      // Get user profiles for the requesters
      const requesterIds = [...new Set(requests.map(r => r.requester_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, email')
        .in('user_id', requesterIds);

      if (profilesError) {
        console.log('Error fetching user profiles:', profilesError);
        // Return requests without profile data
        return requests.map(req => ({
          ...req,
          requester_name: 'Okänd',
          requester_email: ''
        }));
      }

      // Combine the data
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      return requests.map(req => ({
        ...req,
        requester_name: profileMap.get(req.requester_id)?.display_name || 'Okänd',
        requester_email: profileMap.get(req.requester_id)?.email || ''
      }));
    } catch (err) {
      console.log('Error fetching resource requests:', err);
      return [];
    }
  },

  /**
   * Get user's resource requests
   */
  async getUserResourceRequests(userId: string): Promise<ResourceRequest[]> {
    try {
      // First, get the requests
      const { data: requests, error: requestsError } = await supabase
        .from('resource_requests')
        .select('*')
        .eq('requester_id', userId)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;
      
      if (!requests || requests.length === 0) {
        return [];
      }

      // Get the shared resource IDs
      const sharedResourceIds = requests.map(req => req.shared_resource_id);
      
      // Get the shared resources with their details
      const { data: sharedResources, error: sharedError } = await supabase
        .from('resource_sharing')
        .select(`
          id,
          resources!inner(name, category, unit),
          user_id
        `)
        .in('id', sharedResourceIds);

      if (sharedError) throw sharedError;

      // Get user profiles for the sharers
      const sharerIds = [...new Set(sharedResources?.map(sr => sr.user_id) || [])];
      let userProfiles: any[] = [];
      
      if (sharerIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('user_id, display_name')
          .in('user_id', sharerIds);
        
        if (profilesError) {
          console.warn('Could not fetch user profiles:', profilesError);
        } else {
          userProfiles = profiles || [];
        }
      }

      // Create a map for quick lookup
      const sharedResourceMap = new Map();
      sharedResources?.forEach(sr => {
        sharedResourceMap.set(sr.id, sr);
      });

      const userProfileMap = new Map();
      userProfiles.forEach(profile => {
        userProfileMap.set(profile.user_id, profile);
      });

      // Transform the data to include resource details and sharer name
      const transformedData = requests.map(request => {
        const sharedResource = sharedResourceMap.get(request.shared_resource_id);
        const sharerProfile = sharedResource ? userProfileMap.get(sharedResource.user_id) : null;
        
        return {
          ...request,
          resource_name: sharedResource?.resources?.name,
          resource_category: sharedResource?.resources?.category,
          resource_unit: sharedResource?.resources?.unit,
          sharer_name: sharerProfile?.display_name || 'Okänd'
        };
      });
      
      return transformedData;
    } catch (err) {
      console.log('Error fetching user resource requests:', err);
      return [];
    }
  },

  /**
   * Get requests for user's shared resources
   */
  async getRequestsForUserResources(userId: string): Promise<ResourceRequest[]> {
    try {
      // First get the shared resources for this user
      const { data: sharedResources, error: sharedError } = await supabase
        .from('resource_sharing')
        .select('id')
        .eq('user_id', userId);

      if (sharedError) throw sharedError;
      if (!sharedResources || sharedResources.length === 0) return [];

      const sharedResourceIds = sharedResources.map(r => r.id);
      
      // Then get requests for those resources
      const { data, error } = await supabase
        .from('resource_requests')
        .select('*')
        .in('shared_resource_id', sharedResourceIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.log('Error fetching requests for user resources:', err);
      return [];
    }
  },

  /**
   * Approve a resource request
   */
  async approveResourceRequest(requestId: string, responseMessage?: string): Promise<void> {
    // Update the request status
    const { error: requestError } = await supabase
      .from('resource_requests')
      .update({
        status: 'approved',
        response_message: responseMessage,
        responded_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (requestError) throw requestError;

    // Get the shared resource ID to update its status
    const { data: requestData, error: fetchError } = await supabase
      .from('resource_requests')
      .select('shared_resource_id')
      .eq('id', requestId)
      .single();

    if (fetchError) throw fetchError;

    // Update the shared resource status to 'taken' when approved
    const { error: resourceError } = await supabase
      .from('resource_sharing')
      .update({
        status: 'taken',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestData.shared_resource_id);

    if (resourceError) throw resourceError;

    // Create notification for requester
    try {
      const { data: requestDetails } = await supabase
        .from('resource_requests')
        .select(`
          requester_id,
          resource_sharing!inner(
            user_id,
            resources!inner(name)
          )
        `)
        .eq('id', requestId)
        .single();

      if (requestDetails) {
        // Get resource owner name
        const { data: ownerProfile } = await supabase
          .from('user_profiles')
          .select('display_name')
          .eq('user_id', requestDetails.resource_sharing.user_id)
          .single();

        const ownerName = ownerProfile?.display_name || 'Resursägaren';
        const resourceName = requestDetails.resource_sharing.resources?.name || 'resurs';

        await notificationService.createSystemNotification({
          userId: requestDetails.requester_id,
          title: `📦 Resursförfrågan godkänd`,
          content: `${ownerName} har godkänt din förfrågan om ${resourceName}`,
          actionUrl: `/local?tab=resources`
        });
      }
    } catch (notificationError) {
      console.error('Error creating approval notification:', notificationError);
      // Don't fail the approval if notification creation fails
    }
  },

  /**
   * Deny a resource request
   */
  async denyResourceRequest(requestId: string, responseMessage?: string): Promise<void> {
    // Update the request status
    const { error: requestError } = await supabase
      .from('resource_requests')
      .update({
        status: 'denied',
        response_message: responseMessage,
        responded_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (requestError) throw requestError;

    // Get the shared resource ID to reset its status
    const { data: requestData, error: fetchError } = await supabase
      .from('resource_requests')
      .select('shared_resource_id')
      .eq('id', requestId)
      .single();

    if (fetchError) throw fetchError;

    // Reset the shared resource status to 'available' when denying
    // This allows others to request it again
    const { error: resourceError } = await supabase
      .from('resource_sharing')
      .update({
        status: 'available',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestData.shared_resource_id);

    if (resourceError) throw resourceError;

    // Create notification for requester
    try {
      const { data: requestDetails } = await supabase
        .from('resource_requests')
        .select(`
          requester_id,
          resource_sharing!inner(
            user_id,
            resources!inner(name)
          )
        `)
        .eq('id', requestId)
        .single();

      if (requestDetails) {
        // Get resource owner name
        const { data: ownerProfile } = await supabase
          .from('user_profiles')
          .select('display_name')
          .eq('user_id', requestDetails.resource_sharing.user_id)
          .single();

        const ownerName = ownerProfile?.display_name || 'Resursägaren';
        const resourceName = requestDetails.resource_sharing.resources?.name || 'resurs';

        await notificationService.createSystemNotification({
          userId: requestDetails.requester_id,
          title: `📦 Resursförfrågan nekad`,
          content: `${ownerName} har nekat din förfrågan om ${resourceName}`,
          actionUrl: `/local?tab=resources`
        });
      }
    } catch (notificationError) {
      console.error('Error creating denial notification:', notificationError);
      // Don't fail the denial if notification creation fails
    }
  },

  /**
   * Mark a resource request as completed
   */
  async completeResourceRequest(requestId: string): Promise<void> {
    // First, get the shared resource ID to update its status
    const { data: requestData, error: fetchError } = await supabase
      .from('resource_requests')
      .select('shared_resource_id')
      .eq('id', requestId)
      .single();

    if (fetchError) throw fetchError;

    // Update the request status to completed
    const { error: requestError } = await supabase
      .from('resource_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (requestError) throw requestError;

    // Set the shared resource status back to 'available' so it can be borrowed again
    const { error: resourceError } = await supabase
      .from('resource_sharing')
      .update({
        status: 'available',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestData.shared_resource_id);

    if (resourceError) throw resourceError;
  },

  /**
   * Cancel a resource request
   */
  async cancelResourceRequest(sharedResourceId: string, userId: string): Promise<void> {
    // First find the request ID for this user and resource
    const { data: request, error: findError } = await supabase
      .from('resource_requests')
      .select('id')
      .eq('shared_resource_id', sharedResourceId)
      .eq('requester_id', userId)
      .in('status', ['pending', 'approved'])
      .single();

    if (findError) {
      console.error('Error finding request to cancel:', findError);
      throw findError;
    }

    if (!request) {
      throw new Error('No active request found to cancel');
    }

    // Cancel the request
    const { error } = await supabase
      .from('resource_requests')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', request.id);

    if (error) throw error;
  },

  /**
   * Update shared resource status
   */
  async updateSharedResourceStatus(sharedResourceId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('resource_sharing')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', sharedResourceId);

    if (error) throw error;
  }
};

