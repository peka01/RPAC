import { createClient } from '@supabase/supabase-js'
import { config } from './config'

export const supabase = createClient(config.supabase.url, config.supabase.anonKey)

// Database types
export interface Resource {
  id: string
  user_id: string
  name: string
  category: 'food' | 'water' | 'medicine' | 'energy' | 'tools' | 'machinery' | 'other'
  quantity: number
  unit: string
  days_remaining: number
  is_msb_recommended?: boolean
  msb_priority?: 'high' | 'medium' | 'low'
  is_filled?: boolean
  photo_url?: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  name: string
  location: string
  created_at: string
  updated_at: string
}

export interface PlantDiagnosis {
  id: string
  user_id: string
  plant_name: string
  health_status: 'healthy' | 'disease' | 'pest' | 'nutrient'
  confidence: number
  description: string
  recommendations: string[]
  severity: 'low' | 'medium' | 'high'
  image_url: string
  created_at: string
}

export interface LocalCommunity {
  id: string
  community_name: string
  description?: string
  location: string
  postal_code?: string
  county?: string
  is_public?: boolean
  access_type?: 'öppet' | 'stängt'
  auto_approve_members?: boolean
  max_members?: number
  member_count?: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface ResourceSharing {
  id: string
  user_id: string
  resource_id: string
  shared_quantity: number
  available_until?: string
  status: 'available' | 'requested' | 'taken'
  created_at: string
  updated_at: string
}

export interface HelpRequest {
  id: string
  user_id: string
  title: string
  description: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  location?: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  image_url?: string
  created_at: string
  updated_at: string
}

// Database functions
export const resourceService = {
  async getResources(userId: string): Promise<Resource[]> {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('user_id', userId)
      .order('is_msb_recommended', { ascending: false })
      .order('msb_priority', { ascending: true })
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async initializeMsbResources(userId: string): Promise<void> {
    // Check if MSB resources already exist for this user
    const { data: existingMsbResources } = await supabase
      .from('resources')
      .select('id')
      .eq('user_id', userId)
      .eq('is_msb_recommended', true)
    
    if (existingMsbResources && existingMsbResources.length > 0) {
      return // MSB resources already initialized
    }

    // MSB recommended items to auto-create
    const msbItems = [
      // Food
      { name: 'Konserver och burkar', category: 'food', unit: 'burkar', msb_priority: 'high' },
      { name: 'Knäckebröd eller hårt bröd', category: 'food', unit: 'paket', msb_priority: 'high' },
      { name: 'Kött- eller fiskkonserver', category: 'food', unit: 'burkar', msb_priority: 'high' },
      { name: 'Frukt och nötter', category: 'food', unit: 'kg', msb_priority: 'medium' },
      
      // Water
      { name: 'Dricksvatten', category: 'water', unit: 'liter', msb_priority: 'high' },
      { name: 'Vattenreningstavletter', category: 'water', unit: 'förpackningar', msb_priority: 'medium' },
      { name: 'Extra vattenbehållare', category: 'water', unit: 'stycken', msb_priority: 'medium' },
      
      // Medicine
      { name: 'Receptbelagda mediciner', category: 'medicine', unit: 'dagars förbrukning', msb_priority: 'high' },
      { name: 'Första hjälpen-kit', category: 'medicine', unit: 'kit', msb_priority: 'high' },
      { name: 'Smärtstillande', category: 'medicine', unit: 'förpackningar', msb_priority: 'medium' },
      { name: 'Termometer', category: 'medicine', unit: 'stycken', msb_priority: 'medium' },
      
      // Energy
      { name: 'Batterier (olika storlekar)', category: 'energy', unit: 'förpackningar', msb_priority: 'high' },
      { name: 'Ficklampor', category: 'energy', unit: 'stycken', msb_priority: 'high' },
      { name: 'Batteridriven radio', category: 'energy', unit: 'stycken', msb_priority: 'high' },
      { name: 'Ljus och tändstickor', category: 'energy', unit: 'förpackningar', msb_priority: 'medium' },
      
      // Tools
      { name: 'Viktiga papper (vattentätt)', category: 'tools', unit: 'mapp', msb_priority: 'high' },
      { name: 'Kontanter', category: 'tools', unit: 'mindre mängder', msb_priority: 'high' },
      { name: 'Varma filtar', category: 'tools', unit: 'stycken', msb_priority: 'medium' },
      { name: 'Multiverktyg eller kniv', category: 'tools', unit: 'stycken', msb_priority: 'medium' },
    ]

    const resourcesToInsert = msbItems.map(item => ({
      user_id: userId,
      name: item.name,
      category: item.category as Resource['category'],
      quantity: 0, // Start as empty
      unit: item.unit,
      days_remaining: 0, // Empty = 0 days
      is_msb_recommended: true,
      msb_priority: item.msb_priority as 'high' | 'medium' | 'low',
      is_filled: false
    }))

    const { error } = await supabase
      .from('resources')
      .insert(resourcesToInsert)
    
    if (error) throw error
  },

  async addResource(resource: Omit<Resource, 'id' | 'created_at' | 'updated_at'>): Promise<Resource> {
    const { data, error } = await supabase
      .from('resources')
      .insert(resource)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateResource(id: string, updates: Partial<Resource>): Promise<Resource> {
    const { data, error } = await supabase
      .from('resources')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteResource(id: string): Promise<void> {
    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

export const plantDiagnosisService = {
  async getDiagnoses(userId: string): Promise<PlantDiagnosis[]> {
    const { data, error } = await supabase
      .from('plant_diagnoses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async addDiagnosis(diagnosis: Omit<PlantDiagnosis, 'id' | 'created_at'>): Promise<PlantDiagnosis> {
    const { data, error } = await supabase
      .from('plant_diagnoses')
      .insert([diagnosis])
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

export const communityService = {
  async getCommunities(): Promise<LocalCommunity[]> {
    const { data, error } = await supabase
      .from('local_communities')
      .select('id, community_name, description, location, postal_code, county, is_public, access_type, auto_approve_members, max_members, member_count, created_by, created_at, updated_at')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getCommunityById(communityId: string): Promise<LocalCommunity | null> {
    const { data, error } = await supabase
      .from('local_communities')
      .select('*')
      .eq('id', communityId)
      .single()
    
    if (error) {
      console.error('Error fetching community:', error)
      return null
    }
    return data
  },

  async createCommunity(community: Omit<LocalCommunity, 'id' | 'created_at' | 'updated_at'>): Promise<LocalCommunity> {
    const { data, error } = await supabase
      .from('local_communities')
      .insert(community)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateCommunity(id: string, updates: Partial<LocalCommunity>): Promise<LocalCommunity> {
    const { data, error } = await supabase
      .from('local_communities')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteCommunity(id: string): Promise<void> {
    const { error } = await supabase
      .from('local_communities')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async joinCommunity(communityId: string, userId: string): Promise<void> {
    // Try inserting with status first
    let { error } = await supabase
      .from('community_memberships')
      .insert({
        community_id: communityId,
        user_id: userId,
        role: 'member',
        status: 'approved'  // Explicitly set as approved for open communities
      });
    
    // If status column doesn't exist, retry without it
    if (error && error.message?.includes('status')) {
      console.log('Status column not found, joining without status...');
      const result = await supabase
        .from('community_memberships')
        .insert({
          community_id: communityId,
          user_id: userId,
          role: 'member'
        });
      error = result.error;
    }
    
    if (error) throw error;

    // Increment member count
    const { error: updateError } = await supabase.rpc('increment_community_members', {
      community_id: communityId
    });
    
    if (updateError) console.error('Error updating member count:', updateError);
  },

  async leaveCommunity(communityId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('community_memberships')
      .delete()
      .eq('community_id', communityId)
      .eq('user_id', userId)
    
    if (error) throw error

    // Decrement member count
    const { error: updateError } = await supabase.rpc('decrement_community_members', {
      community_id: communityId
    })
    
    if (updateError) console.error('Error updating member count:', updateError)
  },

  async getUserMemberships(userId: string): Promise<string[]> {
    // Try with status filter first
    const { data, error } = await supabase
      .from('community_memberships')
      .select('community_id, status')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching memberships:', error);
      throw error;
    }
    
    // Filter by approved status if column exists, otherwise return all
    if (data && data.length > 0) {
      // Check if status field exists and has values
      const hasStatusColumn = data[0].status !== undefined;
      
      if (hasStatusColumn) {
        // Filter for approved memberships
        return data
          .filter(m => m.status === 'approved' || m.status === null)
          .map(m => m.community_id) || [];
      } else {
        // Status column doesn't exist, return all memberships (backwards compatible)
        return data.map(m => m.community_id) || [];
      }
    }
    
    return [];
  },


  async getPendingMemberships(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('community_memberships')
      .select('community_id, status')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching pending memberships:', error);
      return []; // Return empty array instead of throwing
    }
    
    // Only return pending if status column exists
    if (data && data.length > 0 && data[0].status !== undefined) {
      return data.filter(m => m.status === 'pending').map(m => m.community_id) || [];
    }
    
    return [];
  },

  async getPendingRequestCount(communityId: string): Promise<number> {
    const { count, error } = await supabase
      .from('community_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('community_id', communityId)
      .eq('status', 'pending')
    
    if (error) {
      console.error('Error getting pending request count:', error);
      return 0;
    }
    return count || 0;
  },

  async getUserRole(communityId: string, userId: string): Promise<'admin' | 'moderator' | 'member' | null> {
    const { data, error } = await supabase
      .from('community_memberships')
      .select('role')
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .maybeSingle()
    
    if (error) {
      console.error('Error getting user role:', error)
      return null
    }
    
    // If no membership found, return null
    if (!data) {
      return null
    }
    
    return data.role || 'member'
  },

  async isUserAdmin(communityId: string, userId: string): Promise<boolean> {
    // First check if user is the creator
    const { data: community, error: communityError } = await supabase
      .from('local_communities')
      .select('created_by')
      .eq('id', communityId)
      .single();
    
    if (!communityError && community?.created_by === userId) {
      return true;
    }
    
    // Then check membership role
    const role = await this.getUserRole(communityId, userId)
    return role === 'admin' || role === 'moderator'
  }
}

export const resourceSharingService = {
  async getSharedResources(): Promise<ResourceSharing[]> {
    const { data, error } = await supabase
      .from('resource_sharing')
      .select('*')
      .eq('is_available', true)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async shareResource(sharing: Omit<ResourceSharing, 'id' | 'created_at' | 'updated_at'>): Promise<ResourceSharing> {
    const { data, error } = await supabase
      .from('resource_sharing')
      .insert([sharing])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateSharingStatus(id: string, status: ResourceSharing['status']): Promise<ResourceSharing> {
    const { data, error } = await supabase
      .from('resource_sharing')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

export const helpRequestService = {
  async getHelpRequests(): Promise<HelpRequest[]> {
    const { data, error } = await supabase
      .from('help_requests')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async createHelpRequest(request: Omit<HelpRequest, 'id' | 'created_at' | 'updated_at'>): Promise<HelpRequest> {
    const { data, error } = await supabase
      .from('help_requests')
      .insert([request])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateHelpRequest(id: string, updates: Partial<HelpRequest>): Promise<HelpRequest> {
    const { data, error } = await supabase
      .from('help_requests')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

export const authService = {
  async signUp(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        }
      }
    })
    
    if (error) throw error
    return data
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  async createUserProfile(userId: string, profile: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert([{ id: userId, ...profile }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getUserProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      throw error
    }
    return data
  },

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// Export messaging and geographic services
export { messagingService } from './messaging-service'
export { geographicService } from './geographic-service'
export type { Message, Contact, UserPresence } from './messaging-service'
export type { PostalCodeArea, NearbyArea } from './geographic-service'
