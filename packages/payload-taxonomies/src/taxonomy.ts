import { JSONSchema4 } from "json-schema";
import type { CollectionConfig } from "payload";

export const COLLECTION_SLUG_TAXONOMY = "taxonomy" as const;
type TaxonomyTypescriptSchema = {
  payloadTypescriptSchema?: Array<
    (args: { jsonSchema: JSONSchema4 }) => JSONSchema4
  >;
};

export const taxonomiesCollection: (
  config: Partial<CollectionConfig> & TaxonomyTypescriptSchema
) => CollectionConfig = ({ payloadTypescriptSchema, ...config }) => ({
  ...config,
  slug: COLLECTION_SLUG_TAXONOMY,
  labels: {
    singular: "Taxonomia",
    plural: "Taxonomias",
    ...config.labels,
  },
  admin: {
    useAsTitle: "singular_name",
    group: "Contenido",
    ...config.admin,
  },
  fields: [
    {
      name: "singular_name",
      label: "Nombre",
      type: "text",
      localized: true,
      required: true,
    },
    {
      name: "payload",
      label: "Payload Adicional",
      type: "json",
      required: false,
      typescriptSchema: payloadTypescriptSchema,
    },
    ...(config.fields ?? []),
  ],
});
