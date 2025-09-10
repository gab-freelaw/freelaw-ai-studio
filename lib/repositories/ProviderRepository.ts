import { SupabaseClient } from '@supabase/supabase-js'

export interface Provider {
  id?: string
  full_name: string
  email: string
  phone: string
  oab_number: string
  state: string
  experience_level: string
  specialties: string[]
  bio?: string
  availability: string
  workload: string
  motivation: string
  status: string
  registration_step: number
  created_at?: string
  updated_at?: string
}

export class ProviderRepository {
  constructor(private supabase: SupabaseClient) {}

  async checkExistingProvider(email: string, oabNumber: string) {
    const { data, error } = await this.supabase
      .from('providers')
      .select('id, email, oab_number, status')
      .or(`email.eq.${email},oab_number.eq.${oabNumber}`)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return data
  }

  async createProvider(providerData: Omit<Provider, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await this.supabase
      .from('providers')
      .insert({
        full_name: providerData.full_name,
        email: providerData.email,
        phone: providerData.phone,
        oab_number: providerData.oab_number,
        state: providerData.state,
        experience_level: providerData.experience_level,
        specialties: providerData.specialties,
        bio: providerData.bio,
        availability: providerData.availability,
        workload: providerData.workload,
        motivation: providerData.motivation,
        status: providerData.status,
        registration_step: providerData.registration_step
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  }

  async getProviderByEmail(email: string) {
    const { data, error } = await this.supabase
      .from('providers')
      .select('*')
      .eq('email', email)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return data
  }

  async updateProvider(id: string, updates: Partial<Provider>) {
    const { data, error } = await this.supabase
      .from('providers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  }
}





