import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service_role key
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Verify the user's JWT to ensure they are authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized: No Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if the authenticated user is an admin.
    const { data: adminProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || adminProfile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: Only admin users can access this resource' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Fetch all profiles from public.profiles
    const { data: profilesData, error: fetchProfilesError } = await supabaseClient
      .from('profiles')
      .select('id, first_name, last_name, role, created_at, updated_at, last_login');

    if (fetchProfilesError) {
      console.error('Supabase profiles fetch error:', fetchProfilesError);
      return new Response(JSON.stringify({ error: fetchProfilesError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!profilesData || profilesData.length === 0) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Extract all user IDs
    const userIds = profilesData.map(p => p.id);

    // 3. Fetch corresponding emails from auth.users using the service_role_key
    // Explicitly specify the 'auth' schema for the 'users' table
    const { data: authUsersData, error: fetchAuthUsersError } = await supabaseClient
      .from('users', { schema: 'auth' }) // Corrected: specify schema directly in from()
      .select('id, email')
      .in('id', userIds);

    if (fetchAuthUsersError) {
      console.error('Supabase auth.users fetch error:', fetchAuthUsersError);
      return new Response(JSON.stringify({ error: fetchAuthUsersError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const emailMap = new Map(authUsersData?.map(u => [u.id, u.email]));

    // 4. Combine the data
    const formattedProfiles = profilesData.map(profile => ({
      ...profile,
      email: emailMap.get(profile.id) || null,
    }));

    return new Response(JSON.stringify(formattedProfiles), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});