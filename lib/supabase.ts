import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvb2tseS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNzgyNzIwMCwiZXhwIjoyMDQzNDAzMjAwfQ.eD_U4DDW6kxwt-y_0yQX6mV_gQQY_m1FEkkMuwD4CbM";

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseKey);
}
