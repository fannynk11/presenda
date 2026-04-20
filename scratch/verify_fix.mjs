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

async function testSearch(search) {
  console.log(`\n--- Testing search: "${search}" ---`)
  
  // This is the EXACT logic now in src/app/api/users/route.ts
  const pattern = `"%${search.trim()}%"`;
  const { data, error } = await supabase
    .from('users')
    .select('nama, username')
    .or(`nama.ilike.${pattern},username.ilike.${pattern}`)
    .limit(5)
  
  if (error) {
    console.error('SEARCH FAILED:', error.message)
  } else {
    console.log(`Search succeeded! Found ${data.length} results.`)
    data.forEach(u => console.log(` - ${u.nama} (${u.username})`))
  }
}

async function run() {
  await testSearch('Sondang Sitorus')
  await testSearch('Admin')
  await testSearch('admin')
}

run()
