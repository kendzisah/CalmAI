import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const REVENUECAT_WEBHOOK_SECRET = Deno.env.get('REVENUECAT_WEBHOOK_SECRET') || '';

serve(async (req) => {
  try {
    // Validate webhook signature
    const authHeader = req.headers.get('Authorization');
    if (REVENUECAT_WEBHOOK_SECRET && authHeader !== `Bearer ${REVENUECAT_WEBHOOK_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const event = body.event;
    if (!event) return new Response('No event', { status: 400 });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const appUserId = event.app_user_id;
    const eventType = event.type; // INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION
    const productId = event.product_id;
    const expiresAt = event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null;

    // Record event for audit trail
    await supabase.from('subscription_events').insert({
      user_id: appUserId,
      event_type: eventType,
      product_id: productId,
      expires_at: expiresAt,
      raw_payload: body,
    });

    // Update user subscription tier
    const activePurchase = ['INITIAL_PURCHASE', 'RENEWAL', 'PRODUCT_CHANGE'].includes(eventType);
    const tier = activePurchase ? 'pro' : 'free';

    await supabase
      .from('users')
      .update({
        subscription_tier: tier,
        subscription_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', appUserId);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), { status: 500 });
  }
});
