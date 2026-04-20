import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSearch() {
  const search = 'Sondang Sitorus'
  console.log(`\n--- Searching for: "${search}" ---`)
  
  // Test 1: No quotes
  const { data: d1, error: e1 } = await supabase
    .from('users')
    .select('nama')
    .or(`nama.ilike.%${search}%,username.ilike.%${search}%`)
  
  console.log('Test 1 (No quotes) result:', d1?.length, e1?.message || '')

  // Test 2: Quoted internally
  const pattern = `"%${search}%"`
  const { data: d2, error: e2 } = await supabase
    .from('users')
    .select('nama')
    .or(`nama.ilike.${pattern},username.ilike.${pattern}`)
  
  console.log('Test 2 (Quoted) result:', d2?.length, e2?.message || '')
}

testSearch()
