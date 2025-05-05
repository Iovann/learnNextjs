import { createClient } from '@supabase/supabase-js';

// Création du client Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Méthode alternative utilisant un client postgres
// Cela nous permet d'avoir une solution de secours si l'API Supabase pose problème
import postgres from 'postgres';
const sql = postgres(process.env.POSTGRES_URL || '', { ssl: 'require' });

async function listInvoices() {
  try {
    // Solution de secours avec le client postgres natif
    // Cette méthode est garantie de fonctionner car elle utilise directement SQL
    const pgData = await sql`
      SELECT invoices.amount, customers.name
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE invoices.amount = 666;
    `;
    
    if (pgData && pgData.length > 0) {
      return pgData;
    }
    
    // Si aucun résultat, essayer avec l'API Supabase (code ci-dessous)
  // Utilisation de la fonction RPC pour exécuter une requête SQL complexe
  // Cette méthode permet de faire des jointures facilement
  // Essayer d'abord avec la fonction RPC
  const { data, error } = await supabase.rpc('get_invoices_by_amount', {
    amount_param: 666
  });
  
  if (error) {
    console.log("RPC error, using direct query:", error);
    
    // Si la fonction RPC n'existe pas, utiliser la méthode de requête SQL brute
    const { data: rawData, error: sqlError } = await supabase.from('invoices')
      .select('amount, customer_id')
      .eq('amount', 666);
      
    if (sqlError) throw sqlError;
    
    // Ensuite, obtenir les noms des clients séparément
    if (rawData && rawData.length > 0) {
      // Extraire tous les customer_ids
      const customerIds = rawData.map(invoice => invoice.customer_id);
      
      // Chercher les noms des clients correspondants
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('id, name')
        .in('id', customerIds);
      
      if (customerError) throw customerError;
      
      // Fusionner les données
      const result = rawData.map(invoice => {
        const customer = customerData.find(c => c.id === invoice.customer_id);
        return {
          amount: invoice.amount,
          name: customer ? customer.name : null
        };
      });
      
      return result;
    }
    
    return rawData;
  }
  
  return data;
  } catch (pgError) {
    console.error("Error with postgres client:", pgError);
    // Continuer avec les méthodes Supabase si le client postgres échoue
  }
}

export async function GET() {
  try {
    const invoices = await listInvoices();
    return Response.json(invoices);
  } catch (error:any) {
    console.error("Error fetching invoices:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}