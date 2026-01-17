import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// --- Configuración ---
const SUMMARY_INPUT_FILE_PATH = path.resolve(
  process.cwd(),
  "summary-processed.json"
);
const MERMAID_OUTPUT_FILE_PATH = path.resolve(
  process.cwd(),
  "taxonomy-relationships.md"
);

// Helper para obtener la raíz del monorepo (asumiendo estructura packages/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MONOREPO_ROOT = path.resolve(__dirname, "../../../"); // Corregido: 3 niveles arriba

// --- Funciones Auxiliares ---
async function readFile(filePath) {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error leyendo o parseando el archivo ${filePath}:`, error);
    throw error; // Propagar el error para detener la ejecución
  }
}

async function writeFile(filePath, data) {
  try {
    await fs.writeFile(filePath, data, "utf-8");
    console.log(`Archivo Mermaid guardado exitosamente en: ${filePath}`);
  } catch (error) {
    console.error(`Error guardando el archivo ${filePath}:`, error);
  }
}

// Función para escapar IDs/texto para Mermaid si es necesario
function escapeMermaidId(id) {
  // Reemplazar caracteres no seguros para IDs Mermaid (como -) por _
  // y eliminar otros caracteres potencialmente problemáticos excepto _
  const nodeId = id.replace(/-/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
  // Asegurarse de que no empiece con un número si es posible
  return nodeId;
}

// --- Lógica Principal ---
export async function generateRelationshipDiagram(config = {}) {
  // Incorporar las rutas de archivo como parte de la configuración, con valores por defecto
  const {
    summaryInputFile = path.resolve(
      MONOREPO_ROOT,
      "output/taxonomies/summary-processed.json"
    ),
    mermaidOutputFile = path.resolve(
      MONOREPO_ROOT,
      "output/taxonomies/taxonomy-relationships.md"
    ),
  } = config;

  console.log(
    `Leyendo archivo de resumen: ${path.relative(MONOREPO_ROOT, summaryInputFile)}`
  );
  const summaryData = await readFile(summaryInputFile);

  if (!summaryData || !summaryData.tagTotals || !summaryData.commonSiblings) {
    console.error(
      "El archivo de resumen no tiene el formato esperado (tagTotals, commonSiblings)."
    );
    return;
  }

  console.log("Generando diagrama de relaciones Mermaid...");

  const { tagTotals, commonSiblings } = summaryData;
  const mermaidLines = ["graph TD;"]; // Gráfico Top-Down
  const addedLinks = new Set(); // Para evitar duplicar enlaces A<-->B y B<-->A

  // 1. Añadir nodos explícitamente con su total
  console.log("Definiendo nodos con totales...");
  for (const tag in tagTotals) {
    const count = tagTotals[tag];
    const nodeId = escapeMermaidId(tag);
    // Formato: nodeId["Texto a mostrar (Total: count)"]
    mermaidLines.push(`  ${nodeId}["${tag} (Total: ${count})"];`);
  }
  mermaidLines.push(""); // Línea en blanco para separar nodos de enlaces

  // 2. Añadir enlaces basados en commonSiblings
  console.log("Añadiendo enlaces entre nodos...");
  for (const tagA in commonSiblings) {
    const siblings = commonSiblings[tagA];
    const escapedTagA = escapeMermaidId(tagA);

    for (const siblingInfo of siblings) {
      const tagB = siblingInfo.tag;
      const count = siblingInfo.count;
      const escapedTagB = escapeMermaidId(tagB);

      // Crear una clave única para el par para evitar duplicados
      const pairKey = [tagA, tagB].sort().join("|");

      if (!addedLinks.has(pairKey)) {
        // Añadir enlace con el count como etiqueta
        mermaidLines.push(`  ${escapedTagA} -- ${count} --> ${escapedTagB};`);
        addedLinks.add(pairKey);
      }
    }
  }

  // Crear contenido del archivo Markdown
  const markdownContent = `# Visualización de Relaciones entre Taxonomías

Este diagrama muestra las conexiones más frecuentes entre las taxonomías procesadas.
Los números en los enlaces indican cuántas veces aparecieron juntas esas dos taxonomías en la lista final de los artículos.

\`\`\`mermaid
${mermaidLines.join("\n")}
\`\`\`
`;

  // Guardar el archivo Markdown
  await writeFile(mermaidOutputFile, markdownContent);

  console.log("\nDiagrama Mermaid generado.");
  console.log(
    `Puedes visualizar el archivo ${path.relative(MONOREPO_ROOT, mermaidOutputFile)} con un visor de Markdown compatible con Mermaid.`
  );
}
