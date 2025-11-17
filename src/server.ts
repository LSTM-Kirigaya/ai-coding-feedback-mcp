import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
import { z } from 'zod';
import { checkBackendApi } from './checker';

const server = new McpServer({
    name: 'ai-coding-feedback-mcp',
    version: '1.0.0'
});

server.registerTool(
    'check_nextjs_backend_api',
    {
        title: 'Check Nextjs Backend Api',
        description: '检查 nextjs 后端 api 是否符合规范',
        inputSchema: {
            folderPath: z.string().describe('需要检查的功能模块的目录，它一般包含 route.ts 文件'),
            tsConfigFilePath: z.string().describe('tsconfig.json 文件的路径'),
        }
    },
    async ({ folderPath, tsConfigFilePath }) => {
        const issues = checkBackendApi(folderPath, tsConfigFilePath);

        return {
            content: [{ type: 'text', text: JSON.stringify(issues) }],
        };
    }
);

server.connect(new StdioServerTransport());