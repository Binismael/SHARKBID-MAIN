import { supabaseAdmin } from '../server/lib/supabase.ts';

async function debugVendors() {
  console.log('🔍 Fetching all vendor profiles...');
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, user_id, company_name, role, is_approved, created_at')
    .eq('role', 'vendor');

  if (error) {
    console.error('❌ Error fetching profiles:', error);
    return;
  }

  console.log(`✅ Found ${data.length} vendors:`);
  data.forEach((v, i) => {
    console.log(`${i + 1}. [${v.is_approved ? 'APPROVED' : 'PENDING'}] ${v.company_name} (ID: ${v.id}, UserID: ${v.user_id})`);
  });
}

debugVendors();
