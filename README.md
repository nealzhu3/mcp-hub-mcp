<p align="center">
  <img src="https://imgur.com/DgWxkmv.png" width="200" height="200">
</p>

# MCP-Hub-MCP Server

A hub server that connects to and manages other MCP (Model Context Protocol) servers.

## Overview

This project builds an MCP hub server that can connect to other MCP servers, list their tools, and execute them.
It is especially useful for bypassing Cursor's 40-tool MCP limit.
Even outside of Cursor, it helps reduce AI mistakes by hiding infrequently used tools.

## Key Features

- Automatic connection to other MCP servers via configuration file
- List available tools on connected servers
- Call tools on connected servers and return results
- Filter tools by name using include/exclude patterns

## Configuration

Add this to your `mcp.json`:

#### Using npx

```json
{
  "mcpServers": {
    "other-tools": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-hub-mcp",
        "--config-path",
        "/Users/username/mcp.json"
      ]
    }
  }
}
```

### System Prompt (or Cursor Rules)

```
Before processing a user's request, you must use the "list_all_tools" command to identify which tools are available.
```

This ensures that the AI assistant will always check available tools before attempting to use them.

## Installation and Running

### Requirements

- Node.js 18.0.0 or higher
- npm, yarn, or pnpm

### Installation

```bash
# Clone repository
git clone <repository-url>
cd mcp-hub-mcp

# Install dependencies
npm install
# or
yarn install
# or
pnpm install
```

### Build

```bash
npm run build
# or
yarn build
# or
pnpm build
```

### Run

```bash
npm start
# or
yarn start
# or
pnpm start
```

### Development Mode

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

## Configuration File

The MCP-Hub-MCP server uses a Claude Desktop format configuration file to automatically connect to other MCP servers.
You can specify the configuration file in the following ways:

1. Environment variable: Set the `MCP_CONFIG_PATH` environment variable to the configuration file path
2. Command line argument: Use the `--config-path` option to specify the configuration file path
3. Default path: Use `mcp-config.json` file in the current directory

Configuration file format:

```json
{
  "mcpServers": {
    "serverName1": {
      "command": "command",
      "args": ["arg1", "arg2", ...],
      "env": { "ENV_VAR1": "value1", ... },
      "filters": {
        "include": ["tool1", "tool*"],
        "exclude": ["dangerous*"]
      }
    },
    "serverName2": {
      "command": "anotherCommand",
      "args": ["arg1", "arg2", ...]
    }
  },
  "globalFilters": {
    "include": ["useful*"],
    "exclude": ["experimental*"]
  }
}
```

Example:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/username/Desktop",
        "/Users/username/Downloads"
      ],
      "filters": {
        "include": ["read*", "write*", "list*"]
      }
    },
    "other-server": {
      "command": "node",
      "args": ["path/to/other-mcp-server.js"],
      "filters": {
        "exclude": ["dangerous*", "experimental*"]
      }
    }
  },
  "globalFilters": {
    "exclude": ["deprecated*"]
  }
}
```

## Tool Filtering

The MCP-Hub-MCP server supports filtering tools by name using include/exclude patterns. You can configure filters in the following ways:

### Command Line Arguments

```bash
# Include only tools matching specific patterns (comma-separated)
npx mcp-hub-mcp --include-tools="read*,write*,list*"

# Exclude tools matching specific patterns (comma-separated)
npx mcp-hub-mcp --exclude-tools="dangerous*,experimental*"

# Combine include and exclude filters
npx mcp-hub-mcp --include-tools="read*,write*" --exclude-tools="*sensitive*"
```

### Configuration File

You can configure filters per server or globally in the configuration file:

```json
{
  "mcpServers": {
    "serverName": {
      "command": "command",
      "args": ["arg1", "arg2"],
      "filters": {
        "include": ["pattern1", "pattern2"],
        "exclude": ["pattern3"]
      }
    }
  },
  "globalFilters": {
    "include": ["pattern4"],
    "exclude": ["pattern5", "pattern6"]
  }
}
```

Filter patterns support glob-style wildcards:
- `*` - Matches any number of characters
- `?` - Matches a single character

Special pattern formats:
- `prefix.` - A pattern ending with a dot will match any tool name that starts with that prefix (namespace filtering)
- `exact` - An exact string will match only tools with that exact name

Examples:
- `jira.` - Matches all tools that start with "jira." (like "jira.create_issue", "jira.search")
- `read*` - Matches all tools that start with "read" (like "readFile", "readDirectory")
- `*sensitive*` - Matches any tool with "sensitive" in the name

### Filter Precedence

Filters are applied in the following order:
1. Server-specific filters are applied first
2. Global filters are applied to the remaining tools

This allows for fine-grained control over which tools are available from each server.

## Usage

The MCP-Hub-MCP server provides the following tools:

### 1. `list-all-tools`

Returns a list of tools from all connected servers.

```json
{
  "name": "list-all-tools",
  "arguments": {}
}
```

### 2. `call-tool`

Calls a tool on a specific server.

- `serverName`: Name of the MCP server to call the tool from
- `toolName`: Name of the tool to call
- `toolArgs`: Arguments to pass to the tool

```json
{
  "name": "call-tool",
  "arguments": {
    "serverName": "filesystem",
    "toolName": "readFile",
    "toolArgs": {
      "path": "/Users/username/Desktop/example.txt"
    }
  }
}
```

## Commit Message Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/) for automatic versioning and CHANGELOG generation.

Format: `<type>(<scope>): <description>`

Examples:

- `feat: add new hub connection feature`
- `fix: resolve issue with server timeout`
- `docs: update API documentation`
- `chore: update dependencies`

Types:

- `feat`: New feature (MINOR version bump)
- `fix`: Bug fix (PATCH version bump)
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

Breaking Changes:
Add `BREAKING CHANGE:` in the commit footer to trigger a MAJOR version bump.

## Tech Stack

- Node.js
- TypeScript
- @modelcontextprotocol/sdk (version: ^1.9.0)
- zod (version: ^3.22.4)

## License

MIT
