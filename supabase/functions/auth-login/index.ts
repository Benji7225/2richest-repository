import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface LoginRequest {
  email: string;
  password: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { email, password }: LoginRequest = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email et mot de passe requis" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Email ou mot de passe incorrect" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return new Response(
        JSON.stringify({ error: "Email ou mot de passe incorrect" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .insert({
        user_id: user.id,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (sessionError) {
      throw sessionError;
    }

    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          pseudo: user.pseudo,
          avatar: user.avatar,
          phrase: user.phrase,
        },
        session: {
          token: session.token,
          expires_at: session.expires_at,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Login error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erreur lors de la connexion" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});