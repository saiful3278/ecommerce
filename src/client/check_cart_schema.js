
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xqeqkkkwjjjhzhakvatc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxZXFra2t3ampqaHpoYWt2YXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTMxMTEsImV4cCI6MjA4NTY4OTExMX0.2oYJvuMYT33lEemHE-id4qmsHRsYBIpjd2CaRjiuJxY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCartColumns() {
  console.log('Checking cart_items columns...');
  // Try to insert a dummy record to see the error or success which might reveal columns,
  // OR try to select standard columns.
  
  // Let's try to select just cart_id and variant_id which we know should exist
  const { data, error } = await supabase
    .from("cart_items")
    .select("cart_id, variant_id, quantity") // Intentionally excluding 'id'
    .limit(1);

  if (error) {
    console.error('Error selecting specific columns:', error);
  } else {
    console.log('Successfully selected cart_id, variant_id, quantity. Data:', data);
  }
}

checkCartColumns();
