import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "list_tokens",
  title: "List tokens",
  description:
    "List the SPL tokens launched by the autonomous AI mind, newest first or ranked by 24h volume.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).default(10).describe("How many tokens to return."),
    sort: z
      .enum(["newest", "volume"])
      .default("newest")
      .describe("Order results by launch time or by 24h volume."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, sort }) => {
    const supabase = supabaseAnon();
    const { data, error } = await supabase
      .from("tokens")
      .select("id, name, symbol, price, supply, holders, liquidity, volume_24h, mint_address, launch_timestamp, created_at")
      .order(sort === "volume" ? "volume_24h" : "created_at", { ascending: false })
      .limit(limit ?? 10);

    if (error) throw new ToolError(error.message);

    const tokens = data ?? [];
    return {
      content: [
        {
          type: "text",
          text: tokens.length
            ? tokens
                .map(
                  (t) =>
                    `${t.symbol} — ${t.name} | price ${t.price} | 24h vol ${t.volume_24h} | holders ${t.holders} | launched ${t.launch_timestamp}`,
                )
                .join("\n")
            : "No tokens have been launched yet.",
        },
      ],
      structuredContent: { tokens },
    };
  },
});
