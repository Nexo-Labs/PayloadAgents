import { CollectionConfig } from "payload";
import { taxonomyRelationship } from "./taxonomiesRelationshipFields.js";

export const buildTaxonomizedCollection: (
  config: CollectionConfig
) => CollectionConfig = config => {
  const protoConfigCollection = {
    ...config,
    fields: [taxonomyRelationship, ...config.fields],
  };
  return protoConfigCollection;
};
