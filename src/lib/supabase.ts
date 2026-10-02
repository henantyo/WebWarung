import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.error(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum diisi. ' +
    'Isi file .env.local lalu restart dev server.'
  )
}

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-anon-key'
)

export type Dish = {
  id: string
  name: string
  description: string
  price: number
  category: string
  time: string
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
