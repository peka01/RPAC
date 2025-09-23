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
  }
}
