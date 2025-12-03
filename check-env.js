// Quick script to check environment variables
console.log('=== Environment Variables Check ===')
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing')
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')

if (process.env.VITE_SUPABASE_URL) {
  console.log('URL length:', process.env.VITE_SUPABASE_URL.length)
  console.log('URL starts with https:', process.env.VITE_SUPABASE_URL.startsWith('https://'))
}

if (process.env.VITE_SUPABASE_ANON_KEY) {
  console.log('Key length:', process.env.VITE_SUPABASE_ANON_KEY.length)
  console.log('Key starts with eyJ:', process.env.VITE_SUPABASE_ANON_KEY.startsWith('eyJ'))
}

