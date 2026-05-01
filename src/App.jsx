import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    const { data: condominio } = await supabase
      .from("condomini")
      .select("nome")
      .eq("id", payload.condominio_id)
      .single();

    const nomeCondominio = condominio?.nome || "Condominio";

    const { data: tuttiCondomini, error: utentiError } = await supabase
      .from("utenti_condomini")
      .select("email")
      .eq("condominio_id", payload.condominio_id);

    if (utentiError) throw utentiError;

    const { data: voti, error: votiError } = await supabase
      .from("preventivo_voti")
      .select("email")
      .eq("segnalazione_id", payload.id);

    if (votiError) throw votiError;

    const emailsVotanti = new Set(
      (voti || []).map((v) => String(v.email || "").trim().toLowerCase())
    );

    const emailsNonVotanti = [
      ...new Set(
        (tuttiCondomini || [])
          .map((u) => String(u.email || "").trim().toLowerCase())
          .filter(Boolean)
          .filter((email) => !emailsVotanti.has(email))
      ),
    ];

    if (!emailsNonVotanti.length) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Tutti i condomini hanno già votato.",
          emails: [],
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const importo = Number(payload.importo_preventivo || 0).toLocaleString("it-IT");

    const emailBody = `
Promemoria voto consultivo.

Condominio: ${nomeCondominio}
Pratica: ${payload.titolo}
Importo preventivo: € ${importo}

Il preventivo è stato condiviso dall’amministratore ed è in attesa del tuo parere consultivo.

Accedi alla piattaforma e indica il tuo orientamento:
https://condominio-senza-pensieri-app-s84v.vercel.app

Condominio Senza Pensieri
Gestione intelligente delle pratiche condominiali
`;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Condominio Senza Pensieri <notifiche@condominiosenzapensieri.it>",
        to: emailsNonVotanti,
        subject: `Promemoria voto preventivo - ${nomeCondominio}`,
        text: emailBody,
      }),
    });

    const resendData = await resendResponse.json();

    return new Response(
      JSON.stringify({
        success: resendResponse.ok,
        emails: emailsNonVotanti,
        resendStatus: resendResponse.status,
        resendData,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Errore reminder-voto-condomini:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: String(error),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
