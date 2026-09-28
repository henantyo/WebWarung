import { supabase } from './supabase'

export async function setupDatabase() {
  try {
    // Test koneksi
    const { data, error } = await supabase.from('dishes').select('count()', { count: 'exact', head: true })
    
    if (error) {
      console.log('Database belum setup. SQL queries akan diberikan.')
      return false
    }
    
    console.log('Database sudah siap!')
    return true
  } catch (err) {
    console.error('Error testing database:', err)
    return false
  }
}

export async function fetchDishes() {
  const { data, error } = await supabase
    .from('dishes')
    .select('*')
    .eq('is_available', true)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching dishes:', error)
    return []
  }
  
  return data || []
}

export async function fetchSettings() {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .single()
  
  if (error) {
    console.error('Error fetching settings:', error)
    return null
  }
  
  return data
}

export async function updateDish(id: string, updates: any) {
  const { error } = await supabase
    .from('dishes')
    .update(updates)
    .eq('id', id)
  
  if (error) {
    console.error('Error updating dish:', error)
    throw error
  }
}

export async function createDish(dish: any) {
  const { error } = await supabase
    .from('dishes')
    .insert([dish])
  
  if (error) {
    console.error('Error creating dish:', error)
    throw error
  }
}

export async function deleteDish(id: string) {
  const { error } = await supabase
    .from('dishes')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting dish:', error)
    throw error
  }
}

export async function updateSettings(whatsappNumber: string) {
  const { error } = await supabase
    .from('settings')
    .update({ whatsapp_number: whatsappNumber })
    .eq('id', '1')
  
  if (error) {
    console.error('Error updating settings:', error)
    throw error
  }
}

export async function uploadDishImage(file: File, dishId: string) {
  const fileName = `${dishId}-${Date.now()}-${file.name}`
  const { error, data } = await supabase
    .storage
    .from('dishes')
    .upload(fileName, file)
  
  if (error) {
    console.error('Error uploading image:', error)
    throw error
  }
  
  // Guard: ensure upload returned a valid data object before accessing path
  if (!data) {
    const msg = 'Upload succeeded but no data returned.'
    console.error(msg)
    throw new Error(msg)
  }
  
  const { data: { publicUrl } } = supabase
    .storage
    .from('dishes')
    .getPublicUrl(data.path)
  
  return publicUrl
}
