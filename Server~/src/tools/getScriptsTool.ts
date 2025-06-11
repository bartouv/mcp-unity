import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpUnity } from '../unity/mcpUnity.js';
import { McpUnityError, ErrorType } from '../utils/errors.js';
import * as z from 'zod';
import { Logger } from '../utils/logger.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

// Constants for the tool
const toolName = 'get_scripts';
const toolDescription = 'Retrieves and searches C# script files in the Unity project';

// Parameter schema for the tool
const paramsSchema = z.object({
  searchPattern: z.string().optional().describe('Optional pattern to filter scripts (e.g., *Player*.cs)'),
  includeContent: z.boolean().optional().default(false).describe('Whether to include the actual script content or just metadata'),
  maxFileSizeBytes: z.number().optional().default(50000).describe('Size limit for script content returned (in bytes)')
});

/**
 * Creates and registers the GetScripts tool with the MCP server
 * Provides a way for AI assistants to access and search C# scripts in the project
 * 
 * @param server The MCP server to register the tool with
 * @param mcpUnity The McpUnity instance to communicate with Unity
 * @param logger The logger instance for diagnostic information
 */
export function registerGetScriptsTool(server: McpServer, mcpUnity: McpUnity, logger: Logger) {
  logger.info(`Registering tool: ${toolName}`);
  
  // Register this tool with the MCP server
  server.tool(
    toolName,
    toolDescription,
    paramsSchema.shape,
    async (params: any) => {
      try {
        logger.info(`Executing tool: ${toolName}`, params);
        const result = await toolHandler(mcpUnity, params, logger);
        logger.info(`Tool execution successful: ${toolName}`);
        return result;
      } catch (error) {
        logger.error(`Tool execution failed: ${toolName}`, error);
        throw error;
      }
    }
  );
}

/**
 * Handles requests for the get_scripts tool
 * 
 * @param mcpUnity The McpUnity instance to communicate with Unity
 * @param parameters The parameters passed to the tool
 * @param logger The logger instance
 * @returns A promise resolving to the tool response
 */
async function toolHandler(mcpUnity: McpUnity, parameters: z.infer<typeof paramsSchema>, logger: Logger) {
  logger.info(`Executing ${toolName} with parameters:`, parameters);

  const response = await mcpUnity.sendRequest({
    method: 'get_scripts',
    params: {
      searchPattern: parameters.searchPattern || null,
      includeContent: parameters.includeContent || false,
      maxFileSizeBytes: parameters.maxFileSizeBytes || 50000
    }
  });

  if (!response.success) {
    throw new McpUnityError(
      ErrorType.TOOL_EXECUTION,
      `Failed to retrieve scripts: ${response.message || 'Unknown error'}`
    );
  }

  // Return with properly typed content array for the MCP SDK
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          success: true,
          message: 'Scripts retrieved successfully',
          scripts: response.scripts
        })
      }
    ]
  };
}
