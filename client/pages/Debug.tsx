import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';

interface TableInfo {
  name: string;
  columns?: string[];
  error?: string;
}

export default function DebugPage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkDatabase = async () => {
      try {
        // Try to query the projects table to see its structure
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .limit(1);

        const tableInfo: TableInfo[] = [];

        if (projectError) {
          tableInfo.push({
            name: 'projects',
            error: projectError.message,
          });
        } else {
          tableInfo.push({
            name: 'projects',
            columns: projectData && projectData.length > 0 ? Object.keys(projectData[0]) : ['(unable to fetch columns)'],
          });
        }

        // Try other tables
        const otherTables = [
          'profiles',
          'service_categories',
          'vendor_responses',
          'project_activity',
        ];

        for (const tableName of otherTables) {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

          if (error) {
            tableInfo.push({
              name: tableName,
              error: error.message,
            });
          } else {
            tableInfo.push({
              name: tableName,
              columns: data && data.length > 0 ? Object.keys(data[0]) : [],
            });
          }
        }

        setTables(tableInfo);
      } catch (error) {
        console.error('Debug error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkDatabase();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-8">Database Debug Info</h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-4">
          {tables.map((table) => (
            <Card key={table.name} className="p-6">
              <h2 className="text-xl font-semibold mb-4">{table.name}</h2>
              {table.error ? (
                <div className="bg-red-50 border border-red-200 rounded p-4">
                  <p className="text-red-700 font-mono text-sm">{table.error}</p>
                </div>
              ) : table.columns && table.columns.length > 0 ? (
                <div className="bg-green-50 border border-green-200 rounded p-4">
                  <p className="text-green-700 font-semibold mb-2">Columns:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {table.columns.map((col) => (
                      <li key={col} className="text-green-700 font-mono text-sm">
                        {col}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-gray-600">Table exists but is empty</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
