import { supabase } from './supabase';
import { communityActivityService } from './community-activity-service';

export interface CommunityResource {
  id: string;
  community_id: string;
  resource_name: string;
  resource_type: 'equipment' | 'facility' | 'skill' | 'information';
  category: 'food' | 'water' | 'medicine' | 'energy' | 'tools' | 'other';
  quantity: number;
  unit?: string;
  status: 'available' | 'in_use' | 'maintenance' | 'broken';
  location?: string;
  responsible_user_id?: string;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  usage_instructions?: string;
  booking_required: boolean;
  notes?: string;
  photo_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  responsible_user_name?: string;
  created_by_name?: string;
}

export interface ResourceBooking {
  id: string;
  community_resource_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  purpose?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  // Joined data
  user_name?: string;
  resource_name?: string;
}

export const communityResourceService = {
  /**
   * Get all community-owned resources for a community
   */
  async getCommunityResources(communityId: string): Promise<CommunityResource[]> {
    const { data, error } = await supabase
      .from('community_resources')
      .select('*')
      .eq('community_id', communityId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get user profiles for responsible users and creators
    const userIds = [
      ...new Set(
        (data || [])
          .map(item => [item.responsible_user_id, item.created_by])
          .flat()
          .filter(Boolean)
      )
    ];

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
      const responsibleProfile = profiles.find(p => p.id === item.responsible_user_id);
      const creatorProfile = profiles.find(p => p.id === item.created_by);
      return {
        ...item,
        responsible_user_name: responsibleProfile?.display_name || undefined,
        created_by_name: creatorProfile?.display_name || undefined
      };
    });
  },

  /**
   * Add a new community-owned resource
   */
  async addCommunityResource(params: {
    communityId: string;
    resourceName: string;
    resourceType: CommunityResource['resource_type'];
    category: CommunityResource['category'];
    quantity: number;
    unit?: string;
    location?: string;
    responsibleUserId?: string;
    usageInstructions?: string;
    bookingRequired: boolean;
    notes?: string;
    photoUrl?: string;
    createdBy: string;
  }): Promise<CommunityResource> {
    const { data, error } = await supabase
      .from('community_resources')
      .insert([{
        community_id: params.communityId,
        resource_name: params.resourceName,
        resource_type: params.resourceType,
        category: params.category,
        quantity: params.quantity,
        unit: params.unit,
        location: params.location,
        responsible_user_id: params.responsibleUserId,
        usage_instructions: params.usageInstructions,
        booking_required: params.bookingRequired,
        notes: params.notes,
        photo_url: params.photoUrl,
        created_by: params.createdBy,
        status: 'available'
      }])
      .select()
      .single();

    if (error) throw error;
    
    // Log activity (async, don't wait for it)
    communityActivityService.logResourceAdded({
      communityId: params.communityId,
      resourceName: params.resourceName,
      resourceCategory: params.category,
      addedBy: params.createdBy,
      addedByName: 'Admin' // Will be replaced by trigger with actual name
    }).catch(err => console.error('Failed to log resource activity:', err));
    
    return data as CommunityResource;
  },

  /**
   * Update a community resource
   */
  async updateCommunityResource(
    resourceId: string,
    updates: Partial<CommunityResource>
  ): Promise<void> {
    const { error } = await supabase
      .from('community_resources')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', resourceId);

    if (error) throw error;
  },

  /**
   * Delete a community resource
   */
  async deleteCommunityResource(resourceId: string): Promise<void> {
    const { error } = await supabase
      .from('community_resources')
      .delete()
      .eq('id', resourceId);

    if (error) throw error;
  },

  /**
   * Get bookings for a resource
   */
  async getResourceBookings(resourceId: string): Promise<ResourceBooking[]> {
    const { data, error } = await supabase
      .from('resource_bookings')
      .select('*')
      .eq('community_resource_id', resourceId)
      .neq('status', 'cancelled')
      .order('start_time', { ascending: true });

    if (error) throw error;

    // Get user profiles
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
        user_name: profile?.display_name || 'Medlem'
      };
    });
  },

  /**
   * Create a booking request
   */
  async createBooking(params: {
    resourceId: string;
    userId: string;
    startTime: string;
    endTime: string;
    purpose?: string;
  }): Promise<ResourceBooking> {
    const { data, error } = await supabase
      .from('resource_bookings')
      .insert([{
        community_resource_id: params.resourceId,
        user_id: params.userId,
        start_time: params.startTime,
        end_time: params.endTime,
        purpose: params.purpose,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;
    return data as ResourceBooking;
  },

  /**
   * Update booking status
   */
  async updateBookingStatus(
    bookingId: string,
    status: ResourceBooking['status']
  ): Promise<void> {
    const { error } = await supabase
      .from('resource_bookings')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (error) throw error;
  }
};

