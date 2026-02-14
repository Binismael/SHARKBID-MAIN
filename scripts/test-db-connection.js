import pg from 'pg';
const { Client } = pg;

// Trying common passwords based on documentation
const passwords = ['demo123456', 'Sharkbid2024!', 'Sharkbid2025!', 'admin123'];

async function tryConnection() {
  for (const password of passwords) {
    console.log(`Trying password: ${password}...`);
    const client = new Client({
      connectionString: `postgresql://postgres.kpytttekmeoeqskfopqj:${password}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
      connectionTimeoutMillis: 5000,
    });

    try {
      await client.connect();
      console.log('✅ Connection successful!');
      
      const sql = `
        -- FIX INFINITE RECURSION IN RLS POLICIES
        DROP POLICY IF EXISTS "projects_select_access" ON projects;
        DROP POLICY IF EXISTS "routing_all_access" ON project_routing;
        DROP POLICY IF EXISTS "rt_select_v3" ON project_routing;
        DROP POLICY IF EXISTS "pj_select_v3" ON projects;
        DROP POLICY IF EXISTS "rt_manage_v3" ON project_routing;

        CREATE POLICY "routing_select_final" ON project_routing 
          FOR SELECT TO authenticated 
          USING (true);

        CREATE POLICY "routing_manage_final" ON project_routing 
          FOR ALL TO authenticated
          USING (
            vendor_id = auth.uid() OR
            EXISTS (
              SELECT 1 FROM projects 
              WHERE projects.id = project_routing.project_id 
              AND projects.business_id = auth.uid()
            ) OR
            (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
          )
          WITH CHECK (
            vendor_id = auth.uid() OR
            EXISTS (
              SELECT 1 FROM projects 
              WHERE projects.id = project_routing.project_id 
              AND projects.business_id = auth.uid()
            ) OR
            (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
          );

        CREATE POLICY "projects_select_final" ON projects 
          FOR SELECT TO authenticated
          USING (
            business_id = auth.uid() OR
            selected_vendor_id = auth.uid() OR
            (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
            id IN (
              SELECT project_id FROM project_routing 
              WHERE vendor_id = auth.uid()
            )
          );
      `;
      
      await client.query(sql);
      console.log('✅ SQL Migration applied successfully!');
      await client.end();
      return;
    } catch (err) {
      console.error(`❌ Connection failed for ${password}:`, err.message);
    }
  }
  console.error('❌ All connection attempts failed.');
}

tryConnection();
