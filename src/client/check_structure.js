
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xqeqkkkwjjjhzhakvatc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxZXFra2t3ampqaHpoYWt2YXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTMxMTEsImV4cCI6MjA4NTY4OTExMX0.2oYJvuMYT33lEemHE-id4qmsHRsYBIpjd2CaRjiuJxY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStructure() {
  console.log('Checking tables...');
  
  // Check cart_items columns
  const { data: cartItems, error: error1 } = await supabase
    .from("cart_items")
    .select("*")
    .limit(1);
    
  if (error1) console.error('Error fetching cart_items:', error1);
  else console.log('cart_items sample:', cartItems);

  // Check product_variants columns
  const { data: variants, error: error2 } = await supabase
    .from("product_variants")
    .select("*")
    .limit(1);

  if (error2) console.error('Error fetching product_variants:', error2);
  else console.log('product_variants sample:', variants);
}

checkStructure();
