import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    console.log('Creating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const adminEmail = 'admin@boiscompost.fr';
    const adminPassword = 'boiscompost2025';

    console.log('Checking if user already exists...');
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find(u => u.email === adminEmail);

    if (existingUser) {
      console.log('User already exists, deleting...');
      await supabase.auth.admin.deleteUser(existingUser.id);
      await supabase.from('profiles').delete().eq('id', existingUser.id);
    }

    console.log('Creating new admin user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Administrateur BOISCOMPOST',
        role: 'super_admin'
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      throw authError;
    }

    console.log('User created, ID:', authData.user.id);

    console.log('Creating profile...');
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      email: adminEmail,
      full_name: 'Administrateur BOISCOMPOST',
      role: 'super_admin',
      is_active: true
    });

    if (profileError) {
      console.error('Profile error:', profileError);
      throw profileError;
    }

    console.log('Admin created successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Admin créé avec succès',
        email: adminEmail,
        userId: authData.user.id
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (err: any) {
    console.error('Error:', err);
    return new Response(
      JSON.stringify({
        error: err.message,
        details: err.toString()
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});