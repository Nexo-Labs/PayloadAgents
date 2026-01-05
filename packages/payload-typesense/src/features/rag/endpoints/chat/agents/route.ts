import type { PayloadRequest } from 'payload';
import { RAGFeatureConfig } from '../../../../../shared/types/plugin-types.js';
import { jsonResponse } from '../validators/index.js';

export type AgentsEndpointConfig = {
    ragConfig: RAGFeatureConfig;
    checkPermissions: (req: PayloadRequest) => Promise<boolean>;
};

export function createAgentsGETHandler(config: AgentsEndpointConfig) {
  return async function GET() {
    try {
        const agents = config.ragConfig?.agents || [];
        
        // Map to PublicAgentInfo
        const publicAgents = agents.map(agent => ({
            slug: agent.slug,
            name: agent.name || agent.slug
        }));

        return jsonResponse({ agents: publicAgents }, { status: 200 });
    } catch (error) {
        return jsonResponse({ error: 'Internal Server Error' }, { status: 500 });
    }
  };
}
