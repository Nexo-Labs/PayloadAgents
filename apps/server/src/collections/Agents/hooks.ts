import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { Client } from 'typesense'

/**
 * Re-sync agent with Typesense after changes
 */
export const afterChangeHook: CollectionAfterChangeHook = async ({ doc, req, operation }) => {
  // Only sync if it's an update or create operation on an active agent
  if (!doc.isActive) {
    console.log(`[Agents] Skipping sync for inactive agent: ${doc.slug}`)
    return doc
  }

  try {
    console.log(`[Agents] Re-syncing agent "${doc.slug}" with Typesense after ${operation}...`)

    // Get Typesense config from environment
    const typesenseConfig = {
      nodes: [
        {
          host: process.env.TYPESENSE_HOST || 'localhost',
          port: parseInt(process.env.TYPESENSE_PORT || '8108'),
          protocol: (process.env.TYPESENSE_PROTOCOL || 'http') as 'http' | 'https',
        },
      ],
      apiKey: process.env.TYPESENSE_API_KEY || '',
    }

    const client = new Client(typesenseConfig)

    // Build model config for Typesense
    const modelConfig = {
      id: doc.slug,
      model_name: doc.llmModel,
      system_prompt: doc.systemPrompt,
      api_key: doc.apiKey,
      history_collection: `conversation_history_${doc.slug}`,
      max_bytes: doc.maxContextBytes || 65536,
      ttl: doc.ttl || 86400,
      k_results: doc.kResults || 5,
      max_tokens: 16000, // Default
      temperature: 0.7,
      top_p: 0.95,
    }

    // Try to update, fall back to create if doesn't exist
    const baseUrl = `${typesenseConfig.nodes[0].protocol}://${typesenseConfig.nodes[0].host}:${typesenseConfig.nodes[0].port}`

    try {
      const updateResponse = await fetch(`${baseUrl}/conversations/models/${doc.slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-TYPESENSE-API-KEY': typesenseConfig.apiKey,
        },
        body: JSON.stringify(modelConfig),
      })

      if (updateResponse.ok) {
        console.log(`[Agents] ✓ Agent "${doc.slug}" updated in Typesense`)
      } else if (updateResponse.status === 404) {
        // Model doesn't exist, create it
        const createResponse = await fetch(`${baseUrl}/conversations/models`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-TYPESENSE-API-KEY': typesenseConfig.apiKey,
          },
          body: JSON.stringify(modelConfig),
        })

        if (createResponse.ok) {
          console.log(`[Agents] ✓ Agent "${doc.slug}" created in Typesense`)
        } else {
          const errorText = await createResponse.text()
          console.error(`[Agents] ✗ Failed to create agent in Typesense:`, errorText)
        }
      } else {
        const errorText = await updateResponse.text()
        console.error(`[Agents] ✗ Failed to update agent in Typesense:`, errorText)
      }
    } catch (error) {
      console.error(`[Agents] ✗ Error syncing agent with Typesense:`, error)
    }
  } catch (error) {
    console.error(`[Agents] Error in afterChange hook:`, error)
  }

  return doc
}

/**
 * Delete agent from Typesense after deletion from PayloadCMS
 */
export const afterDeleteHook: CollectionAfterDeleteHook = async ({ doc }) => {
  try {
    console.log(`[Agents] Deleting agent "${doc.slug}" from Typesense...`)

    const typesenseConfig = {
      nodes: [
        {
          host: process.env.TYPESENSE_HOST || 'localhost',
          port: parseInt(process.env.TYPESENSE_PORT || '8108'),
          protocol: (process.env.TYPESENSE_PROTOCOL || 'http') as 'http' | 'https',
        },
      ],
      apiKey: process.env.TYPESENSE_API_KEY || '',
    }

    const baseUrl = `${typesenseConfig.nodes[0].protocol}://${typesenseConfig.nodes[0].host}:${typesenseConfig.nodes[0].port}`

    const deleteResponse = await fetch(`${baseUrl}/conversations/models/${doc.slug}`, {
      method: 'DELETE',
      headers: {
        'X-TYPESENSE-API-KEY': typesenseConfig.apiKey,
      },
    })

    if (deleteResponse.ok) {
      console.log(`[Agents] ✓ Agent "${doc.slug}" deleted from Typesense`)
    } else {
      const errorText = await deleteResponse.text()
      console.error(`[Agents] ✗ Failed to delete agent from Typesense:`, errorText)
    }
  } catch (error) {
    console.error(`[Agents] Error in afterDelete hook:`, error)
  }

  return doc
}
