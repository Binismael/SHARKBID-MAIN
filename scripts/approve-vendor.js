import { supabaseAdmin } from '../server/lib/supabase.ts';

async function approveVendor() {
  const vendorId = '7d662b68-639f-43df-93b0-dc3a6a0bcc97'; // binismel
  console.log(`🚀 Approving vendor ID: ${vendorId}...`);
  
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ is_approved: true })
    .eq('id', vendorId)
    .select();

  if (error) {
    console.error('❌ Error approving vendor:', error);
    return;
  }

  console.log('✅ Vendor approved successfully:', data[0].company_name);
}

approveVendor();
