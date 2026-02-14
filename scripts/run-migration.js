import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  const sqlPath = path.resolve('migrations/fix_recursion_final.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('🚀 Attempting to run migration via RPC...');

  // Try calling common SQL execution function names
  const possibleFunctions = ['exec_sql', 'execute_sql', 'run_sql'];
  
  for (const fn of possibleFunctions) {
    console.log(`Trying RPC function: ${fn}...`);
    const { data, error } = await supabase.rpc(fn, { sql_query: sql, query: sql });
    
    if (!error) {
      console.log(`✅ Migration successful using ${fn}!`);
      console.log('Result:', data);
      return;
    }
    
    if (error.code === 'PGRST202') {
      console.log(`❌ Function ${fn} not found.`);
    } else {
      console.error(`❌ Error calling ${fn}:`, error.message);
    }
  }

  console.error('\n❌ Could not find an RPC function to execute SQL.');
  console.log('Please run the SQL manually in the Supabase SQL Editor:');
  console.log('----------------------------------------------------');
  console.log(sql);
  console.log('----------------------------------------------------');
}

runMigration();
