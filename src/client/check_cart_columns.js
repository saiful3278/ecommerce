
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xqeqkkkwjjjhzhakvatc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxZXFra2t3ampqaHpoYWt2YXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTMxMTEsImV4cCI6MjA4NTY4OTExMX0.2oYJvuMYT33lEemHE-id4qmsHRsYBIpjd2CaRjiuJxY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  console.log('Checking cart_items columns...');
  const { data, error } = await supabase
    .from("cart_items")
    .select()
    .limit(1);

  if (error) {
    console.error(error);
  } else {
    console.log('Data:', data);
  }
}

checkColumns();
