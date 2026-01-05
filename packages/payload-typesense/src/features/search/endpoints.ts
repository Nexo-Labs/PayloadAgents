import type { Client } from "typesense";

import type { ModularPluginConfig } from "../../core/config/types.js";
import {
  createCollectionsHandler,
  createSearchHandler,
} from "./endpoints/handlers/index.js";


export const createSearchEndpoints = (
  typesenseClient: Client,
  pluginOptions: ModularPluginConfig
) => {
  return [
    {
      handler: createCollectionsHandler(pluginOptions),
      method: "get" as const,
      path: "/search/collections",
    },
    {
      handler: createSearchHandler(typesenseClient, pluginOptions),
      method: "get" as const,
      path: "/search/:collectionName",
    },
    {
      handler: createSearchHandler(typesenseClient, pluginOptions),
      method: "get" as const,
      path: "/search",
    },
  ];
};
