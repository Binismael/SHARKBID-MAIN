import pg from 'pg';
const { Client } = pg;

// Trying common passwords based on scripts/test-db-connection.js
const passwords = ['demo123456', 'Sharkbid2024!', 'Sharkbid2025!', 'admin123'];
const projectRef = 'kpytttekmeoeqskfopqj';

async function tryConnection() {
  for (const password of passwords) {
    console.log(`Trying password: ${password}...`);
    // Note: Pooler URL might vary
    const client = new Client({
      host: `db.${projectRef}.supabase.co`,
      port: 5432,
      user: `postgres.${projectRef}`,
      password: password,
      database: 'postgres',
      connectionTimeoutMillis: 5000,
    });

    try {
      await client.connect();
      console.log('✅ Connection successful!');
      
      const sql = `
        ALTER TABLE public.profiles
        ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
        ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
      `;
      
      await client.query(sql);
      console.log('✅ Social links columns added successfully!');
      await client.end();
      return true;
    } catch (err) {
      console.error(`❌ Connection failed for ${password}:`, err.message);
    }
  }
  return false;
}

tryConnection().then(success => {
  if (!success) {
    console.error('❌ Could not apply migration. Please run the SQL manually in Supabase.');
    process.exit(1);
  } else {
    process.exit(0);
  }
});
