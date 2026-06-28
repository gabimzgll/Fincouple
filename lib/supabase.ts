import { createClient } from '@supabase/supabase-js'

// A URL e a chave "publishable" do Supabase são públicas por natureza
// (ficam visíveis no bundle do cliente). A proteção dos dados vem das
// políticas RLS no banco, não do sigilo da chave. Ficam fixas aqui para o
// app funcionar sem depender de variáveis de ambiente no Vercel.
const supabaseUrl = 'https://gjfilgcemjzilxyetwsy.supabase.co'
const supabaseKey = 'sb_publishable_Cs8qtjswav13yf50ouJlGg_It1mVPXq'

export const supabase = createClient(supabaseUrl, supabaseKey)
