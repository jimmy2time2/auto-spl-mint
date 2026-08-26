import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "recent_activity",
  title: "Recent protocol activity",
  description:
    "Read the most recent public protocol activity events (mints, trades, AI decisions, lottery draws).",
  inputSchema: {
    limit: z.number().int().min(1).max(50).default(20).describe("How many events to return."),
    activity_type: z
      .string()
      .trim()
      .min(1)
      .optional()
      .describe("Optional filter on the activity type, e.g. ai_mind_analysis."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, activity_type }) => {
    const supabase = supabaseAnon();
    let query = supabase
      .from("protocol_activity")
      .select("id, activity_type, description, token_id, timestamp")
      .order("timestamp", { ascending: false })
      .limit(limit ?? 20);
    if (activity_type) query = query.eq("activity_type", activity_type);

    const { data, error } = await query;
    if (error) throw new ToolError(error.message);

    const events = data ?? [];
    return {
      content: [
        {
          type: "text",
          text: events.length
            ? events.map((e) => `[${e.timestamp}] ${e.activity_type}: ${e.description}`).join("\n")
            : "No protocol activity recorded yet.",
        },
      ],
      structuredContent: { events },
    };
  },
});
