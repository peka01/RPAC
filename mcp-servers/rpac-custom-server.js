#!/usr/bin/env node

/**
 * RPAC Custom MCP Server
 * Provides project-specific tools for RPAC development
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';

class RPACCustomServer {
  constructor() {
    this.server = new Server(
      {
        name: 'rpac-custom-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'check_swedish_text',
            description: 'Check for hardcoded Swedish text in components (åäöÅÄÖ)',
            inputSchema: {
              type: 'object',
              properties: {
                filePath: {
                  type: 'string',
                  description: 'Path to the file to check'
                }
              },
              required: ['filePath']
            }
          },
          {
            name: 'validate_olive_colors',
            description: 'Validate that component uses olive green colors instead of blue',
            inputSchema: {
              type: 'object',
              properties: {
                filePath: {
                  type: 'string',
                  description: 'Path to the component file to validate'
                }
              },
              required: ['filePath']
            }
          },
          {
            name: 'check_mobile_optimization',
            description: 'Check if component follows mobile-first design patterns',
            inputSchema: {
              type: 'object',
              properties: {
                filePath: {
                  type: 'string',
                  description: 'Path to the component file to check'
                }
              },
              required: ['filePath']
            }
          },
          {
            name: 'suggest_component_improvements',
            description: 'Analyze component and suggest RPAC-specific improvements',
            inputSchema: {
              type: 'object',
              properties: {
                filePath: {
                  type: 'string',
                  description: 'Path to the component file to analyze'
                }
              },
              required: ['filePath']
            }
          },
          {
            name: 'get_localization_keys',
            description: 'Get all available localization keys from sv.json',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'check_resource_list_usage',
            description: 'Check if component should use ResourceListView instead of custom list',
            inputSchema: {
              type: 'object',
              properties: {
                filePath: {
                  type: 'string',
                  description: 'Path to the component file to check'
                }
              },
              required: ['filePath']
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'check_swedish_text':
          return await this.checkSwedishText(args.filePath);
        
        case 'validate_olive_colors':
          return await this.validateOliveColors(args.filePath);
        
        case 'check_mobile_optimization':
          return await this.checkMobileOptimization(args.filePath);
        
        case 'suggest_component_improvements':
          return await this.suggestComponentImprovements(args.filePath);
        
        case 'get_localization_keys':
          return await this.getLocalizationKeys();
        
        case 'check_resource_list_usage':
          return await this.checkResourceListUsage(args.filePath);
        
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  async checkSwedishText(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const swedishPattern = /[åäöÅÄÖ]/g;
      const matches = content.match(swedishPattern);
      
      if (matches) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ FOUND HARDCODED SWEDISH TEXT in ${filePath}!\n\n` +
                    `Swedish characters found: ${matches.join(', ')}\n\n` +
                    `This violates RPAC rules. All Swedish text must use t() function from sv.json.\n\n` +
                    `Fix: Replace hardcoded text with t('category.key_name') calls.`
            }
          ]
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: `✅ No hardcoded Swedish text found in ${filePath}`
            }
          ]
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error reading file: ${error.message}`
          }
        ]
      };
    }
  }

  async validateOliveColors(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const bluePattern = /(bg-blue-|text-blue-|border-blue-|ring-blue-)/g;
      const matches = content.match(bluePattern);
      
      if (matches) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ FOUND BLUE COLORS in ${filePath}!\n\n` +
                    `Blue classes found: ${matches.join(', ')}\n\n` +
                    `RPAC uses olive green colors, NOT blue!\n\n` +
                    `Replace with olive green equivalents:\n` +
                    `- bg-blue-* → bg-[#3D4A2B] or bg-[#5C6B47]\n` +
                    `- text-blue-* → text-[#3D4A2B] or text-[#707C5F]\n` +
                    `- border-blue-* → border-[#3D4A2B] or border-[#5C6B47]`
            }
          ]
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: `✅ No blue colors found in ${filePath} - using proper olive green palette`
            }
          ]
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error reading file: ${error.message}`
          }
        ]
      };
    }
  }

  async checkMobileOptimization(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const issues = [];
      
      // Check for touch targets
      if (!content.includes('touch-manipulation')) {
        issues.push('Missing touch-manipulation class for mobile optimization');
      }
      
      // Check for responsive breakpoints
      const hasResponsiveClasses = /(sm:|md:|lg:|xl:)/.test(content);
      if (!hasResponsiveClasses) {
        issues.push('Missing responsive breakpoints (sm:, md:, lg:, xl:)');
      }
      
      // Check for mobile-specific patterns
      const hasMobilePattern = /-mobile\.tsx|mobile-|Mobile/.test(filePath);
      
      if (issues.length > 0) {
        return {
          content: [
            {
              type: 'text',
              text: `⚠️ MOBILE OPTIMIZATION ISSUES in ${filePath}:\n\n` +
                    issues.map(issue => `• ${issue}`).join('\n') +
                    `\n\nRecommendations:\n` +
                    `• Add touch-manipulation class to interactive elements\n` +
                    `• Use responsive breakpoints (sm:, md:, lg:, xl:)\n` +
                    `• Ensure minimum 44px touch targets\n` +
                    `• Consider creating -mobile.tsx version if complex`
            }
          ]
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: `✅ Mobile optimization looks good in ${filePath}`
            }
          ]
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error reading file: ${error.message}`
          }
        ]
      };
    }
  }

  async suggestComponentImprovements(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const suggestions = [];
      
      // Check if it's a list component that should use ResourceListView
      if (content.includes('map(') && content.includes('items') && !content.includes('ResourceListView')) {
        suggestions.push('Consider using ResourceListView component for consistent list behavior');
      }
      
      // Check for hardcoded text
      if (/[åäöÅÄÖ]/.test(content)) {
        suggestions.push('Replace hardcoded Swedish text with t() function calls');
      }
      
      // Check for blue colors
      if (/(bg-blue-|text-blue-|border-blue-)/.test(content)) {
        suggestions.push('Replace blue colors with olive green palette (#3D4A2B, #5C6B47, etc.)');
      }
      
      // Check for proper error handling
      if (!content.includes('try') && !content.includes('catch')) {
        suggestions.push('Consider adding error handling for better user experience');
      }
      
      return {
        content: [
          {
            type: 'text',
            text: `🔍 COMPONENT ANALYSIS for ${filePath}:\n\n` +
                  (suggestions.length > 0 
                    ? `Suggestions:\n${suggestions.map(s => `• ${s}`).join('\n')}`
                    : '✅ Component follows RPAC best practices!')
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error reading file: ${error.message}`
          }
        ]
      };
    }
  }

  async getLocalizationKeys() {
    try {
      const svJsonPath = 'rpac-web/src/lib/locales/sv.json';
      const content = await fs.readFile(svJsonPath, 'utf-8');
      const keys = JSON.parse(content);
      
      const flattenKeys = (obj, prefix = '') => {
        let result = [];
        for (const key in obj) {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          if (typeof obj[key] === 'object') {
            result = result.concat(flattenKeys(obj[key], fullKey));
          } else {
            result.push(fullKey);
          }
        }
        return result;
      };
      
      const allKeys = flattenKeys(keys);
      
      return {
        content: [
          {
            type: 'text',
            text: `📚 Available localization keys (${allKeys.length} total):\n\n` +
                  allKeys.slice(0, 50).join('\n') +
                  (allKeys.length > 50 ? `\n... and ${allKeys.length - 50} more keys` : '')
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error reading localization file: ${error.message}`
          }
        ]
      };
    }
  }

  async checkResourceListUsage(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Check if this looks like a list component
      const hasListPatterns = /(\.map\(|items|list|table|grid)/.test(content);
      const usesResourceListView = content.includes('ResourceListView');
      
      if (hasListPatterns && !usesResourceListView) {
        return {
          content: [
            {
              type: 'text',
              text: `💡 SUGGESTION for ${filePath}:\n\n` +
                    `This component appears to display a list of items.\n\n` +
                    `Consider using ResourceListView component instead:\n` +
                    `• Built-in search and filtering\n` +
                    `• Card/table toggle functionality\n` +
                    `• Consistent UX across the app\n` +
                    `• Mobile responsive\n` +
                    `• 75% less code\n\n` +
                    `Import: import { ResourceListView } from '@/components/resource-list-view';`
            }
          ]
        };
      } else if (usesResourceListView) {
        return {
          content: [
            {
              type: 'text',
              text: `✅ ${filePath} correctly uses ResourceListView component`
            }
          ]
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: `✅ ${filePath} doesn't appear to be a list component`
            }
          ]
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error reading file: ${error.message}`
          }
        ]
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('RPAC Custom MCP Server running on stdio');
  }
}

const server = new RPACCustomServer();
server.run().catch(console.error);
