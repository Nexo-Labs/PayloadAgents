import { convertLexicalToMarkdown, editorConfigFactory } from '@payloadcms/richtext-lexical';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import type { SanitizedConfig } from 'payload';

/**
 * Transforms Lexical editor state to Markdown
 * @param value - The serialized editor state
 * @param config - Optional Payload config. If provided, it will be used to generate the editor config.
 */
export const transformLexicalToMarkdown = async (
  value?: SerializedEditorState | null,
  config?: SanitizedConfig
): Promise<string> => {
  if (!value) {
    return '';
  }
  try {
    const editorConfig = await editorConfigFactory.default({
      config: config as SanitizedConfig
    });

    const result = await convertLexicalToMarkdown({
      data: value,
      editorConfig
    });
    return result;
  } catch (error) {
    console.error('Error transforming lexical to markdown', error);
    return '';
  }
};
