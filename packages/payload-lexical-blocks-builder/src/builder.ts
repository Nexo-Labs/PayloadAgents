import {
  BlocksFeature,
  FeatureProviderServer,
  lexicalEditor,
} from "@payloadcms/richtext-lexical";
import { Block, Config } from "payload";

export type LexicalBuilder = (blocks: () => Block[]) => Config["editor"];

export function buildLexicalByFeatures(
  features: () => FeatureProviderServer<any, any, any>[]
): LexicalBuilder {
  return (blocks: () => Block[]) =>
    lexicalEditor({
      features: () => {
        return [...features(), BlocksFeature({ blocks: blocks() })];
      },
    });
}

export function filterBlocksAtLexicalBuilder <T extends string>(builder: LexicalBuilder, blocks: () => Block[], slugs: T[]): Config["editor"] {
    return builder(() => blocks().filter((block) => !slugs.includes(block.slug as T)))
}
