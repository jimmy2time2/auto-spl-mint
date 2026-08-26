import { defineMcp } from "@lovable.dev/mcp-js";
import listTokensTool from "./tools/list-tokens";
import getTokenTool from "./tools/get-token";
import recentActivityTool from "./tools/recent-activity";
import protocolStatsTool from "./tools/protocol-stats";

export default defineMcp({
  name: "auto-spl-mint",
  title: "auto-spl-mint",
  version: "0.1.0",
  instructions:
    "Read-only tools for the autonomous SPL token launcher. Use `list_tokens` to browse launched tokens, `get_token` for one token's details, `recent_activity` for the protocol event stream, and `protocol_stats` for aggregate metrics. All data is public.",
  tools: [listTokensTool, getTokenTool, recentActivityTool, protocolStatsTool],
});
