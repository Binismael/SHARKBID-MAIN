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

async function checkRouting() {
  const projectId = "4b215498-c034-40ac-9abb-c8f3afd3f407";
  const vendorId = "09025d29-3c27-4ddb-8fc3-1553c5617120";

  const { data: routing, error } = await supabase
    .from("project_routing")
    .select("*")
    .eq("project_id", projectId);

  if (error) {
    console.error("Error fetching routing:", error);
    return;
  }

  console.log("Routing for project EXPLORE:");
  console.log(JSON.stringify(routing, null, 2));
}

checkRouting();
