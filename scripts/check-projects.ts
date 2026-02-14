import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProjects() {
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, title, status, business_id");

  if (error) {
    console.error("Error fetching projects:", error);
    return;
  }

  console.log("Projects found:");
  console.log(JSON.stringify(projects, null, 2));
}

checkProjects();
