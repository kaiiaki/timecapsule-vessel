import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { capsule_id } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: capsule, error } = await supabase
      .from("capsules")
      .select("*")
      .eq("id", capsule_id)
      .single();

    if (error || !capsule) throw new Error("Capsule not found");

    const deliveryDate = new Date(capsule.deliver_at).toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric"
    });

    const { data: signedUrl } = await supabase.storage
      .from("videos")
      .createSignedUrl(capsule.video_path, 60 * 60 * 24 * 365);

    const previewUrl = signedUrl?.signedUrl || "";

    const resendKey = Deno.env.get("RESEND_API_KEY")!;

    const emailHtml = `
      <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 40px 24px; background: #0e1520; color: #e8e0d4;">
        <p style="font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; color: #7a9e8a; margin-bottom: 32px;">Time Capsule Vessel</p>
        <h1 style="font-size: 28px; font-weight: 400; color: #f0e8dc; line-height: 1.3; margin-bottom: 12px;">
          Your capsule is <em style="font-style: italic; color: #a8c4b0;">sealed.</em>
        </h1>
        <p style="font-size: 15px; color: #8a9090; line-height: 1.7; margin-bottom: 32px;">
          We've saved your message safely. It will be delivered on <strong style="color: #a8c4b0;">${deliveryDate}</strong>.
          Until then, here's your 15-second preview.
        </p>
        <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 20px; margin-bottom: 32px;">
          <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #5a6868; margin-bottom: 12px;">Your 15-second preview</p>
          <a href="${previewUrl}" style="display: inline-block; background: #7a9e8a; color: #0e1520; padding: 12px 24px; border-radius: 50px; text-decoration: none; font-size: 14px; font-weight: 500;">
            ▶ Watch preview
          </a>
          <p style="font-size: 12px; color: #4a5858; margin-top: 12px; line-height: 1.5;">
            This preview link is valid for one year. The full video is sealed until ${deliveryDate}.
          </p>
        </div>
        <p style="font-size: 13px; color: #4a5858; line-height: 1.6;">
          You'll receive another email on ${deliveryDate} with your full message.
        </p>
      </div>
    `;

    const recipientEmail = capsule.mode === "other" ? capsule.sender_email : capsule.recipient_email;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Time Capsule Vessel <noreply@resend.dev>",
        to: recipientEmail,
        subject: "Your capsule is sealed & waiting ✦",
        html: emailHtml,
      }),
    });

    if (!resendRes.ok) {
      const err = await resendRes.text();
      throw new Error(`Resend error: ${err}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
