import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSearch() {
  const searchValues = ['Admin', 'Admin Test', 'admin']
  
  for (const search of searchValues) {
    console.log(`\n--- Testing search: "${search}" ---`)
    
    // Test 1: Simple pattern
    const { data: d1, error: e1 } = await supabase
      .from('users')
      .select('id_user, nama, username')
      .or(`nama.ilike.%${search}%,username.ilike.%${search}%`)
      .limit(3)
    
    console.log('Test 1 (No quotes) result count:', d1?.length, e1?.message || '')

    // Test 2: Quoted pattern
    const pattern = `"%${search}%"`
    const { data: d2, error: e2 } = await supabase
      .from('users')
      .select('id_user, nama, username')
      .or(`nama.ilike.${pattern},username.ilike.${pattern}`)
      .limit(3)
    
    console.log('Test 2 (Quoted) result count:', d2?.length, e2?.message || '')
  }
}

testSearch()
