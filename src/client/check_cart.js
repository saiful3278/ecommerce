
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xqeqkkkwjjjhzhakvatc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxZXFra2t3ampqaHpoYWt2YXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTMxMTEsImV4cCI6MjA4NTY4OTExMX0.2oYJvuMYT33lEemHE-id4qmsHRsYBIpjd2CaRjiuJxY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRelationships() {
  console.log('Checking cart_items relationships...');
  // Try to fetch one cart item with variant
  const { data, error } = await supabase
    .from("cart_items")
    .select(`
      id,
      variant:product_variants!cart_items_variant_id_fkey(id)
    `)
    .limit(1);

  if (error) {
    console.error('Error with explicit FK:', error);
    
    // Try without explicit FK
    const { data: data2, error: error2 } = await supabase
        .from("cart_items")
        .select(`
        id,
        product_variants(id)
        `)
        .limit(1);

    if (error2) {
        console.error('Error without explicit FK:', error2);
    } else {
        console.log('Success without explicit FK');
    }

  } else {
    console.log('Success with explicit FK cart_items_variant_id_fkey');
  }
}

checkRelationships();
