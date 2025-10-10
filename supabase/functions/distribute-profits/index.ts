import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  fetchUnprocessedProfitEvents,
  distributeProfits,
  logDistribution,
  retryFailedDistributions,
} from "../_shared/profit-distributor.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request
    const { retry_failed = false, limit = 50 } = await req.json().catch(() => ({}));

    console.log('💰 Profit Distribution Service starting...');

    let results = [];
    let retriedCount = 0;

    // Step 1: Retry failed distributions if requested
    if (retry_failed) {
      console.log('Retrying failed distributions...');
      retriedCount = await retryFailedDistributions(supabase, 5);
      console.log(`Retried ${retriedCount} failed distributions`);
    }

    // Step 2: Fetch unprocessed profit events
    console.log('Fetching unprocessed profit events...');
    const events = await fetchUnprocessedProfitEvents(supabase, limit);
    console.log(`Found ${events.length} unprocessed profit events`);

    if (events.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No unprocessed profit events found',
          processed_count: 0,
          retried_count: retriedCount,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 3: Process each event
    for (const event of events) {
      console.log(`\n--- Processing profit event ${event.id} ---`);
      console.log(`Sale amount: ${event.sale_amount} SOL`);

      try {
        const result = await distributeProfits(supabase, event);
        await logDistribution(supabase, result);
        results.push(result);

        console.log(`✅ Event ${event.id} processed successfully`);
      } catch (error) {
        console.error(`❌ Failed to process event ${event.id}:`, error);
        const errorResult = {
          success: false,
          profit_event_id: event.id,
          splits: { ai_amount: 0, dao_amount: 0, lucky_amount: 0, creator_amount: 0, total_amount: 0 },
          transactions: [],
          total_distributed: 0,
          error: error instanceof Error ? error.message : String(error),
        };
        results.push(errorResult);
      }

      // Small delay between processing to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Step 4: Summary
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.length - successCount;

    console.log('\n📊 Distribution Summary:');
    console.log(`Total processed: ${results.length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${failureCount}`);
    console.log(`Retried: ${retriedCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        processed_count: results.length,
        successful_count: successCount,
        failed_count: failureCount,
        retried_count: retriedCount,
        results: results.map((r) => ({
          profit_event_id: r.profit_event_id,
          success: r.success,
          total_distributed: r.total_distributed || 0,
          failed_transactions: r.transactions?.filter((t: any) => t.error) || [],
        })),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in distribute-profits:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        details: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
