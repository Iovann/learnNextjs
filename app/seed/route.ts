import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { invoices, customers, revenue, users } from '../lib/placeholder-data';

// Création du client Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedUsers() {
  // Vérifier si l'extension uuid-ossp est installée (déjà fait automatiquement par Supabase)
  
  // Création de la table users si elle n'existe pas déjà
  // Note: avec Supabase, il est préférable de créer les tables via l'interface ou les migrations
  // plutôt que programmatiquement, mais cela fonctionne pour le développement
  const { error: createTableError } = await supabase.rpc('create_table_if_not_exists', {
    table_name: 'users',
    table_definition: `
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    `
  });
  
  if (createTableError) {
    // Alternative si la fonction RPC n'est pas configurée
    await supabase.from('users').select('id').limit(1); // Essaie d'utiliser la table
    
    // Si la table n'existe pas, créez-la via SQL brut
    // Notez que cela nécessite des permissions élevées
    if (createTableError.message.includes('relation "users" does not exist')) {
      await supabase.rpc('execute_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS users (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
          );
        `
      });
    }
  }

  // Insérer les utilisateurs
  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    
    const { error } = await supabase
      .from('users')
      .upsert(
        { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          password: hashedPassword 
        },
        { onConflict: 'id' }
      );
      
    if (error) {
      console.error('Error inserting user:', error);
    }
  }

  return { success: true };
}

async function seedInvoices() {
  // Création de la table invoices
  const { error: createTableError } = await supabase.rpc('create_table_if_not_exists', {
    table_name: 'invoices',
    table_definition: `
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL
    `
  });
  
  if (createTableError) {
    // Alternative si la fonction RPC n'est pas configurée
    await supabase.from('invoices').select('id').limit(1);
    
    if (createTableError.message.includes('relation "invoices" does not exist')) {
      await supabase.rpc('execute_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS invoices (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            customer_id UUID NOT NULL,
            amount INT NOT NULL,
            status VARCHAR(255) NOT NULL,
            date DATE NOT NULL
          );
        `
      });
    }
  }

  // Insérer les factures
  const { error } = await supabase
    .from('invoices')
    .upsert(
      invoices.map(invoice => ({
        customer_id: invoice.customer_id,
        amount: invoice.amount,
        status: invoice.status,
        date: invoice.date
      })),
      { onConflict: 'id' }
    );
    
  if (error) {
    console.error('Error inserting invoices:', error);
  }

  return { success: true };
}

async function seedCustomers() {
  // Création de la table customers
  const { error: createTableError } = await supabase.rpc('create_table_if_not_exists', {
    table_name: 'customers',
    table_definition: `
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    `
  });
  
  if (createTableError) {
    // Alternative si la fonction RPC n'est pas configurée
    await supabase.from('customers').select('id').limit(1);
    
    if (createTableError.message.includes('relation "customers" does not exist')) {
      await supabase.rpc('execute_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS customers (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            image_url VARCHAR(255) NOT NULL
          );
        `
      });
    }
  }

  // Insérer les clients
  const { error } = await supabase
    .from('customers')
    .upsert(
      customers.map(customer => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        image_url: customer.image_url
      })),
      { onConflict: 'id' }
    );
    
  if (error) {
    console.error('Error inserting customers:', error);
  }

  return { success: true };
}

async function seedRevenue() {
  // Création de la table revenue
  const { error: createTableError } = await supabase.rpc('create_table_if_not_exists', {
    table_name: 'revenue',
    table_definition: `
      month VARCHAR(4) NOT NULL UNIQUE,
      revenue INT NOT NULL
    `
  });
  
  if (createTableError) {
    // Alternative si la fonction RPC n'est pas configurée
    await supabase.from('revenue').select('month').limit(1);
    
    if (createTableError.message.includes('relation "revenue" does not exist')) {
      await supabase.rpc('execute_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS revenue (
            month VARCHAR(4) NOT NULL UNIQUE,
            revenue INT NOT NULL
          );
        `
      });
    }
  }

  // Insérer les données de revenus
  const { error } = await supabase
    .from('revenue')
    .upsert(
      revenue.map(rev => ({
        month: rev.month,
        revenue: rev.revenue
      })),
      { onConflict: 'month' }
    );
    
  if (error) {
    console.error('Error inserting revenue:', error);
  }

  return { success: true };
}

export async function GET() {
  try {
    // Exécuter toutes les fonctions de seeding
    await seedUsers();
    await seedCustomers();
    await seedInvoices();
    await seedRevenue();

    return Response.json({ message: 'Database seeded successfully' });
  } catch (error:any) {
    console.error('Seeding error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}