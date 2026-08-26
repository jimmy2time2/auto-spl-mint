import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "protocol_stats",
  title: "Protocol stats",
  description:
    "Aggregate public protocol stats: total tokens launched, combined 24h volume, liquidity and holder count.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async () => {
    const supabase = supabaseAnon();
    const { data, error } = await supabase
      .from("tokens")
      .select("volume_24h, liquidity, holders, created_at");
    if (error) throw new ToolError(error.message);

    const tokens = data ?? [];
    const sum = (pick: (t: (typeof tokens)[number]) => number) =>
      tokens.reduce((acc, t) => acc + Number(pick(t) || 0), 0);

    const sortedDates = tokens.map((t) => String(t.created_at)).sort();
    const latest = sortedDates.length ? sortedDates[sortedDates.length - 1] : undefined;


    const stats = {
      total_tokens: tokens.length,
      total_volume_24h: sum((t) => t.volume_24h as number),
      total_liquidity: sum((t) => t.liquidity as number),
      total_holders: sum((t) => t.holders as number),
      last_launch_at: latest ?? null,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(stats, null, 2) }],
      structuredContent: stats,
    };
  },
});
