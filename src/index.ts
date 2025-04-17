#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpServerManager } from "./server-manager.js";
import { CallToolParamsSchema, ToolFilterConfig } from "./types.js";

// Parse command line arguments for filters
function parseFilterArgs(): ToolFilterConfig | undefined {
  const includeIdx = process.argv.indexOf('--include-tools');
  const excludeIdx = process.argv.indexOf('--exclude-tools');
  
  const filters: ToolFilterConfig = {};
  
  if (includeIdx !== -1 && includeIdx < process.argv.length - 1) {
    filters.include = process.argv[includeIdx + 1].split(',');
  }
  
  if (excludeIdx !== -1 && excludeIdx < process.argv.length - 1) {
    filters.exclude = process.argv[excludeIdx + 1].split(',');
  }
  
  return (filters.include || filters.exclude) ? filters : undefined;
}

// Get global filters from command line arguments
const globalFilters = parseFilterArgs();

// Create MCP server manager instance with global filters
const serverManager = new McpServerManager({
  autoLoad: true,
  globalFilters
});

// Create MCP server
const server = new McpServer({
  name: "MCP-Hub-Server",
  version: "1.0.0",
  description:
    "MCP Hub server that connects to and manages other MCP servers. If you want to call a tool from another server, you can use this hub.",
});

// Tool to return tools list from all servers
server.tool(
  "list-all-tools",
  "List all available tools from all connected servers. Before starting any task based on the user's request, always begin by using this tool to get a list of any additional tools that may be available for use.",
  {}, // Use empty object when there are no parameters
  async (args, extra) => {
    try {
      const servers = serverManager.getConnectedServers();
      if (servers.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No connected servers.",
            },
          ],
        };
      }

      const allTools: Record<string, any> = {};

      // Get tools list from each server
      for (const serverName of servers) {
        try {
          const toolsResponse =
            await serverManager.listTools(serverName);
          allTools[serverName] = toolsResponse;
        } catch (error) {
          allTools[serverName] = {
            error: `Failed to get tools list: ${
              (error as Error).message
            }`,
          };
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(allTools, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to get tools list from all servers: ${
              (error as Error).message
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool to call a specific tool from a specific server
server.tool(
  "call-tool",
  "Call a specific tool from a specific server",
  {
    serverName: CallToolParamsSchema.shape.serverName,
    toolName: CallToolParamsSchema.shape.toolName,
    toolArgs: CallToolParamsSchema.shape.toolArgs,
  },
  async (args, extra) => {
    try {
      const { serverName, toolName, toolArgs } = args;
      const result = await serverManager.callTool(
        serverName,
        toolName,
        toolArgs
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Tool call failed: ${
              (error as Error).message
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Start server
async function startServer() {
  try {
    // Communication through standard input/output
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log("MCP-Hub-MCP server is running...");

    // Disconnect all connections on process termination
    process.on("SIGINT", async () => {
      console.log("Shutting down server...");
      await serverManager.disconnectAll();
      process.exit(0);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
