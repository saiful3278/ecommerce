
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xqeqkkkwjjjhzhakvatc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxZXFra2t3ampqaHpoYWt2YXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTMxMTEsImV4cCI6MjA4NTY4OTExMX0.2oYJvuMYT33lEemHE-id4qmsHRsYBIpjd2CaRjiuJxY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRelationships() {
  console.log('Checking relationships for product_id...');

  // Check link to products
  const { error: errorProducts } = await supabase
    .from("cart_items")
    .select("product_id, products!inner(id)")
    .limit(1);

  if (errorProducts) {
    console.log('Link to products failed:', errorProducts.message);
  } else {
    console.log('Link to products SUCCESS!');
  }

  // Check link to product_variants
  // Note: we need to guess the relationship name or just try standard join if the FK exists
  const { error: errorVariants } = await supabase
    .from("cart_items")
    .select("product_id, product_variants!inner(id)")
    .limit(1);

  if (errorVariants) {
    console.log('Link to product_variants failed:', errorVariants.message);
  } else {
    console.log('Link to product_variants SUCCESS!');
  }
}

checkRelationships();
