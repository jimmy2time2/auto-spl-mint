import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "get_token",
  title: "Get token details",
  description:
    "Get full public details for one token by ticker symbol or id, including price, supply, holders and bonding-curve data.",
  inputSchema: {
    symbol: z.string().trim().min(1).optional().describe("Ticker symbol, e.g. QM."),
    id: z.string().uuid().optional().describe("Token id (UUID)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ symbol, id }) => {
    if (!symbol && !id) throw new ToolError("Provide either a symbol or an id.");
    const supabase = supabaseAnon();
    let query = supabase.from("tokens").select("*").limit(1);
    query = id ? query.eq("id", id) : query.ilike("symbol", symbol!);

    const { data, error } = await query.maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!data) throw new ToolError(`No token found for ${id ?? symbol}.`);

    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { token: data },
    };
  },
});
