import { DefaultValue, Field, FilterOptions } from "payload";
import { COLLECTION_SLUG_TAXONOMY } from "./taxonomy.js";

export const taxonomyRelationship: Field = {
  name: "categories",
  label: "Categorías",
  type: "relationship",
  relationTo: COLLECTION_SLUG_TAXONOMY,
  defaultValue: [],
  hasMany: true,
  required: false,
};

interface BuildTaxonomyRelationshipFieldProps {
  name?: string
  label?: string
  filterOptions?: FilterOptions
  defaultValue: DefaultValue
  required?: boolean
}

export const buildTaxonomyRelationship: (field: BuildTaxonomyRelationshipFieldProps) => Field = (field) => ({
  name: field?.name ?? "categories",
  label: field?.label ?? "Categorías",
  type: "relationship",
  defaultValue: field?.defaultValue,
  filterOptions: field?.filterOptions,
  required: field?.required ?? false,
  hasMany: true,
  relationTo: COLLECTION_SLUG_TAXONOMY,
});
