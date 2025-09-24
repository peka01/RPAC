import { createClient } from '@supabase/supabase-js'
import { config } from './config'

export const supabase = createClient(config.supabase.url, config.supabase.anonKey)

// Database types
export interface Resource {
  id: string
  user_id: string
  name: string
  category: 'food' | 'water' | 'medicine' | 'energy' | 'tools'
  quantity: number
  unit: string
  days_remaining: number
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
  user_id: string
  community_name: string
  location: string
  description?: string
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
  category: 'food' | 'water' | 'medicine' | 'energy' | 'tools' | 'other'
  urgency: 'low' | 'medium' | 'high' | 'critical'
  location?: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
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
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async addResource(resource: Omit<Resource, 'id' | 'created_at' | 'updated_at'>): Promise<Resource> {
    const { data, error } = await supabase
      .from('resources')
      .insert([resource])
    
    if (error) throw error
    if (!data) throw new Error('No data returned from insert')
    return data as Resource
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
      .from('local_community')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async createCommunity(community: Omit<LocalCommunity, 'id' | 'created_at' | 'updated_at'>): Promise<LocalCommunity> {
    const { data, error } = await supabase
      .from('local_community')
      .insert([community])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateCommunity(id: string, updates: Partial<LocalCommunity>): Promise<LocalCommunity> {
    const { data, error } = await supabase
      .from('local_community')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
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
