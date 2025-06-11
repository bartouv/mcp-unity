import { McpUnity } from '../unity/mcpUnity.js';
import { Logger } from '../utils/logger.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpUnityError, ErrorType } from '../utils/errors.js';
import { ReadResourceResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Constants for the resource
const resourceName = 'get_scripts';
const resourceUri = 'unity://scripts';
const resourceMimeType = 'application/json';

// Schema for query parameters
const querySchema = z.object({
  searchPattern: z.string().optional(),
  includeContent: z.boolean().optional().default(false),
  maxFileSizeBytes: z.number().optional().default(50000)
}).optional();

/**
 * Creates and registers the Scripts resource with the MCP server
 * This resource provides access to C# script files in the Unity project
 * 
 * @param server The MCP server instance to register with
 * @param mcpUnity The McpUnity instance to communicate with Unity
 * @param logger The logger instance for diagnostic information
 */
export function registerGetScriptsResource(server: McpServer, mcpUnity: McpUnity, logger: Logger) {
  logger.info(`Registering resource: ${resourceName}`);
      
  // Register this resource with the MCP server
  server.resource(
    resourceName,
    resourceUri,
    {
      description: 'Retrieves all C# script files (.cs) in the project with optional filters',
      mimeType: resourceMimeType
    },
    async (params: any) => {
      try {
        const queryParams = params.query ? {
          searchPattern: params.query.searchPattern,
          includeContent: params.query.includeContent === true,
          maxFileSizeBytes: Number(params.query.maxFileSizeBytes) || 50000
        } : undefined;
          
        return await resourceHandler(mcpUnity, queryParams);
      } catch (error) {
        logger.error(`Error handling resource ${resourceName}: ${error}`);
        throw error;
      }
    }
  );
}

/**
 * Handles requests for the get_scripts resource
 * 
 * @param mcpUnity The McpUnity instance to communicate with Unity
 * @param queryParams Optional query parameters to filter scripts
 * @returns A promise resolving to the resource response
 */
async function resourceHandler(
  mcpUnity: McpUnity, 
  queryParams?: { searchPattern?: string, includeContent?: boolean, maxFileSizeBytes?: number }
): Promise<ReadResourceResult> {
  const unityParams = {
    searchPattern: queryParams?.searchPattern || null,
    includeContent: queryParams?.includeContent || false,
    maxFileSizeBytes: queryParams?.maxFileSizeBytes || 50000
  };

  const response = await mcpUnity.sendRequest({
    method: resourceName,
    params: unityParams
  });

  if (!response.success) {
    throw new McpUnityError(
      ErrorType.RESOURCE_FETCH,
      `Failed to retrieve scripts: ${response.message || 'Unknown error'}`
    );
  }

  return {
    contents: [
      {
        text: JSON.stringify(response),
        uri: resourceUri,
        mimeType: resourceMimeType
      }
    ]
  };
}
