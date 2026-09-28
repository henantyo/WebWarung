import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Dish = {
  id: string
  name: string
  description: string
  price: number
  category: string
  image_url: string
  is_bestseller: boolean
  is_available: boolean
  created_at: string
}

export type Settings = {
  id: string
  whatsapp_number: string
  updated_at: string
}
