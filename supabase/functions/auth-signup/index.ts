import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SignupRequest {
  email: string;
  password: string;
  pseudo: string;
  avatar?: string;
  phrase?: string;
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

    const { email, password, pseudo, avatar, phrase }: SignupRequest = await req.json();

    if (!email || !password || !pseudo) {
      return new Response(
        JSON.stringify({ error: "Email, mot de passe et pseudo requis" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Le mot de passe doit contenir au moins 6 caractères" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "Cet email est déjà utilisé" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const passwordHash = await bcrypt.hash(password);

    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        email,
        password_hash: passwordHash,
        pseudo,
        avatar: avatar || "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150",
        phrase: phrase || "",
      })
      .select()
      .single();

    if (userError) {
      throw userError;
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
    console.error("Signup error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erreur lors de l'inscription" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});