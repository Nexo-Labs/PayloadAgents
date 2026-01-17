import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Helper para obtener la raíz del monorepo (asumiendo estructura packages/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MONOREPO_ROOT = path.resolve(__dirname, "../../../"); // Corregido: 3 niveles arriba

// Función auxiliar para asegurar que el directorio existe y escribir archivo
async function writeFileEnsuringDir(filePath, data) {
  try {
    const dirPath = path.dirname(filePath);
    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
    console.log(
      `Archivo guardado exitosamente en: ${path.relative(MONOREPO_ROOT, filePath)}`
    );
  } catch (error) {
    console.error(`Error guardando el archivo ${filePath}:`, error);
    throw error; // Relanzar para que el proceso principal falle si es necesario
  }
}

async function readFile(filePath) {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      // Permitir que el archivo de resultados no exista inicialmente
      console.log(
        `Archivo opcional ${path.relative(MONOREPO_ROOT, filePath)} no encontrado, continuando...`
      );
      return null;
    }
    console.error(`Error leyendo o parseando el archivo ${filePath}:`, error);
    throw error; // Propagar otros errores
  }
}

// --- Lógica Principal Refactorizada ---
export async function processTaxonomyWeights(config = {}) {
  const {
    inputFile = path.resolve(
      MONOREPO_ROOT,
      "output/taxonomies/articles-taxonomized.json"
    ),
    outputProcessedFile = path.resolve(
      MONOREPO_ROOT,
      "output/taxonomies/articles-processed.json"
    ),
    outputSummaryFile = path.resolve(
      MONOREPO_ROOT,
      "output/taxonomies/summary-processed.json"
    ),
    topN = 3,
    excludedTags = ["politica-sociedad"],
    minWeightThresholds = {
      "libertad-responsabilidad": 0.8,
      "politica-sociedad": 1,
      democracia: 0.8,
      "drogas-medicina": 0.8,
      historia: 0.8,
      filosofia: 0.8,
      "psicologia-emociones": 0.8,
      "cultura-arte": 0.8,
    },
  } = config;

  const excludedTagsSet = new Set(excludedTags);

  console.log(
    `Leyendo archivo de pesos: ${path.relative(MONOREPO_ROOT, inputFile)}`
  );
  const weightedArticles = await readFile(inputFile);

  if (!weightedArticles) {
    console.error(
      "No se encontró el archivo de entrada con pesos. Ejecuta el taxonomizador primero."
    );
    return;
  }

  const processedArticles = [];
  const tagCounts = {};
  const siblingCounts = {};

  console.log(
    `Procesando ${weightedArticles.length} artículos para obtener los top ${topN} tags...`
  );
  console.log(` - Excluyendo siempre: ${excludedTags.join(", ") || "Ninguno"}`);
  console.log(
    ` - Excluyendo por umbral: ${
      Object.entries(minWeightThresholds)
        .map(([tag, thr]) => `${tag} (< ${thr})`)
        .join(", ") || "Ninguno"
    }`
  );

  for (const article of weightedArticles) {
    let finalTaxonomies = [];
    if (
      article.error ||
      !article.taxonomyWeights ||
      typeof article.taxonomyWeights !== "object"
    ) {
      processedArticles.push({
        id: article.id,
        taxonomies: [],
        ...(article.error && { error: article.error }),
      });
    } else {
      const weights = article.taxonomyWeights;
      finalTaxonomies = Object.entries(weights)
        .filter(([slug, weight]) => {
          if (excludedTagsSet.has(slug)) return false;
          if (slug in minWeightThresholds) {
            return weight >= minWeightThresholds[slug];
          }
          return true;
        })
        .sort(([, weightA], [, weightB]) => weightB - weightA)
        .slice(0, topN)
        .map(([slug]) => slug);

      processedArticles.push({
        id: article.id,
        taxonomies: finalTaxonomies,
      });

      // --- Actualizar cuentas para el resumen ---
      for (const slug of finalTaxonomies) {
        tagCounts[slug] = (tagCounts[slug] || 0) + 1;
        if (!siblingCounts[slug]) {
          siblingCounts[slug] = {};
        }
      }
      for (let i = 0; i < finalTaxonomies.length; i++) {
        for (let j = i + 1; j < finalTaxonomies.length; j++) {
          const slugA = finalTaxonomies[i];
          const slugB = finalTaxonomies[j];
          siblingCounts[slugA][slugB] = (siblingCounts[slugA][slugB] || 0) + 1;
          siblingCounts[slugB][slugA] = (siblingCounts[slugB][slugA] || 0) + 1;
        }
      }
      // --- Fin Actualizar cuentas ---
    }
  }

  // Guardar el archivo procesado
  await writeFileEnsuringDir(outputProcessedFile, processedArticles);
  console.log("\nProcesamiento para articles-processed.json completado.");

  // Procesar y guardar el resumen
  console.log("\nGenerando resumen de taxonomías procesadas...");
  const finalSummary = {
    tagTotals: tagCounts,
    commonSiblings: {},
  };

  for (const tag in siblingCounts) {
    const siblings = siblingCounts[tag];
    const sortedSiblings = Object.entries(siblings)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 2) // Top 2 siblings
      .map(([siblingTag, count]) => ({ tag: siblingTag, count: count }));
    finalSummary.commonSiblings[tag] = sortedSiblings;
  }

  await writeFileEnsuringDir(outputSummaryFile, finalSummary);
  console.log("Resumen generado y guardado en summary-processed.json.");
}
