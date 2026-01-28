import { importExportPlugin as _importExportPlugin } from '@payloadcms/plugin-import-export'

export const importExportPlugin =   _importExportPlugin({
    collections: [
      { slug: "agents" },
      { slug: "taxonomy" },
      { slug: "pages" },
    ],
    overrideExportCollection: ({ collection }) => {
      collection.admin = collection.admin || {}
      collection.admin.group = 'System'
      return collection
    },
    overrideImportCollection: ({ collection }) => {
      collection.admin = collection.admin || {}
      collection.admin.group = 'System'
      return collection
    }
  })

