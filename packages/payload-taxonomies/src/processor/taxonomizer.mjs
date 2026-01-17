import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MONOREPO_ROOT = path.resolve(__dirname, "../../../"); 

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
    throw error;
  }
}

async function readFile(filePath, optional = false) {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    if (optional && error.code === "ENOENT") {
      console.log(
        `Archivo opcional ${path.relative(MONOREPO_ROOT, filePath)} no encontrado, continuando...`
      );
      return null;
    }
    console.error(`Error leyendo o parseando el archivo ${filePath}:`, error);
    throw error;
  }
}

function getTaxonomies() {
  // Mantenemos la lista aquí por ahora, podría moverse a config
  return [
    "libertad-responsabilidad",
    "mercado-capitalismo",
    "politica-sociedad",
    "filosofia",
    "drogas-medicina",
    "religion-mitologia-sectas",
    "historia",
    "democracia",
    "ciencia-tecnologia",
    "psicologia-emociones",
    "marxismo-socialismo",
    "cultura-arte",
  ];
}

function createPrompt(articleTitle, articleContent, taxonomySlugs) {
  const content = articleContent.es ?? articleContent.en;
  if (!content) return null;

  const topicsListString = taxonomySlugs.map(slug => `- ${slug}`).join("\n");
  const exampleJsonEntries = taxonomySlugs.map((slug, index) => {
    const exampleWeight = (index % 3) * 0.4 + 0.1;
    return `  \"${slug}\": ${exampleWeight.toFixed(2)}`;
  });
  const exampleJsonString = `{\n${exampleJsonEntries.join(",\n")}\n}`;

  return `
<role>
Eres un analista experto en contenido especializado en la asignación de taxonomías. Tu tarea es evaluar un artículo basándote en su título y contenido y asignar pesos de relevancia a una lista predefinida de taxonomías.
</role>

<task_description>
Analiza el título y el contenido del artículo proporcionado. Para CADA taxonomía de la lista <taxonomies_to_evaluate>, asigna un peso numérico entre 0.0 y 1.0 (inclusive) que represente su relevancia para los temas principales del artículo.
- Un peso de 1.0 significa que la taxonomía es muy relevante y un tema central.
- Un peso de 0.0 significa que la taxonomía no es relevante en absoluto.
- Asigna los pesos basándote en las ideas centrales y el contexto, no solo en coincidencias de palabras clave.
</task_description>

<input_data>
<article_title>
${articleTitle}
</article_title>
<article_content>
${JSON.stringify(content)}
</article_content>
<taxonomies_to_evaluate>
${topicsListString}
</taxonomies_to_evaluate>
</input_data>

<output_format_specification>
Tu respuesta DEBE ser un único objeto JSON válido.
- El objeto JSON DEBE contener exactamente una clave por CADA taxonomía listada en <taxonomies_to_evaluate>.
- El valor para cada clave DEBE ser un número de punto flotante entre 0.0 y 1.0 (inclusive).
- NO incluyas NINGÚN texto antes o después del objeto JSON.
- NO uses formato markdown (como \`\`\`json).
<example_output>
${exampleJsonString}
</example_output>
</output_format_specification>

<response>
{JSON object only}
</response>
`;
}

// --- Lógica Principal Refactorizada ---
export async function taxonomizeArticles(config = {}) {
  const {
    // Rutas relativas a la raíz del monorepo por defecto
    articlesInputFile = path.resolve(MONOREPO_ROOT, "apps/server/src/seed/articles.json"), // Asume que el original sigue en scripts
    taxonomiesOutputFile = path.resolve(
      MONOREPO_ROOT,
      "output/taxonomies/articles-taxonomized.json"
    ),
    modelName = "gemini-1.5-flash",
    delaySeconds = 5,
    delaySecondsOnError = 5,
  } = config;

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    console.error(
      "Error: La variable de entorno GEMINI_API_KEY no está definida."
    );
    process.exit(1);
  }

  console.log("Iniciando proceso de taxonomización incremental...");

  console.log("Cargando archivos JSON...");
  const articles = await readFile(articlesInputFile);
  const existingResults = await readFile(taxonomiesOutputFile, true); // Opcional

  if (!articles) {
    console.error(
      `Error: No se pudo leer el archivo de artículos en ${articlesInputFile}`
    );
    return;
  }

  const existingResultsMap = new Map();
  if (existingResults) {
    console.log(
      `Se encontraron ${existingResults.length} resultados existentes.`
    );
    existingResults.forEach(item => {
      if (item && typeof item.id !== "undefined") {
        existingResultsMap.set(item.id, item);
      }
    });
  } else {
    console.log(
      "No se encontraron resultados existentes. Se procesarán todos los artículos."
    );
  }

  const taxonomySlugs = getTaxonomies();
  const validSlugsSet = new Set(taxonomySlugs);

  console.log("Identificando artículos a procesar...");
  const idsToProcess = new Set();
  articles.forEach(article => {
    if (!article || typeof article.id === "undefined") return;
    const existing = existingResultsMap.get(article.id);
    // Procesar si no existe, tiene error, o no tiene pesos (o pesos es null)
    if (!existing || existing.error || !existing.taxonomyWeights) {
      idsToProcess.add(article.id);
    }
  });

  if (idsToProcess.size === 0) {
    console.log(
      "No hay artículos nuevos o con errores que necesiten ser procesados."
    );
    return; // No es necesario guardar si no se procesó nada nuevo
  }

  console.log(
    `Se procesarán ${idsToProcess.size} artículos (nuevos, con errores o sin pesos).`
  );

  console.log("Inicializando cliente de Gemini API...");
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: modelName });

  console.log(`Procesando artículos...`);
  let processedCount = 0;
  const totalToProcess = idsToProcess.size;
  let newlyProcessedCount = 0;

  for (const article of articles) {
    // Asegurarse de que todos los artículos estén en el mapa al final
    if (
      !existingResultsMap.has(article.id) &&
      article &&
      typeof article.id !== "undefined"
    ) {
      existingResultsMap.set(article.id, {
        id: article.id,
        taxonomyWeights: null,
      });
    }

    if (idsToProcess.has(article.id)) {
      newlyProcessedCount++;
      console.log(
        `Procesando artículo ${newlyProcessedCount}/${totalToProcess} (ID: ${article.id})...`
      );

      let resultObject;
      const currentArticleId = article.id || "unknown"; // Usar ID o "unknown"

      if (
        !article.id ||
        !article.title ||
        typeof article.content !== "object" ||
        article.content === null
      ) {
        console.warn(
          `  -> Artículo con ID ${currentArticleId} omitido por formato inválido.`
        );
        resultObject = {
          id: currentArticleId,
          taxonomyWeights: null,
          error:
            "Formato de artículo inválido (faltan campos o content no es objeto).",
        };
        existingResultsMap.set(currentArticleId, resultObject);
        await writeFileEnsuringDir(
          taxonomiesOutputFile,
          Array.from(existingResultsMap.values())
        );
        continue;
      }

      const prompt = createPrompt(
        article.title,
        article.content,
        taxonomySlugs
      );
      if (!prompt) {
        console.warn(
          `  -> Artículo con ID ${article.id} omitido por falta de contenido.`
        );
        resultObject = {
          id: article.id,
          taxonomyWeights: null,
          error: "Contenido del artículo vacío o inválido.",
        };
        existingResultsMap.set(article.id, resultObject);
        await writeFileEnsuringDir(
          taxonomiesOutputFile,
          Array.from(existingResultsMap.values())
        );
        continue;
      }

      try {
        const generationConfig = {
          temperature: 0.2,
          responseMimeType: "application/json",
        };
        const result = await model.generateContent(prompt, generationConfig);
        const response = await result.response;
        const text = response.text();
        console.log(`  -> Respuesta LLM (raw): ${text}`);

        let taxonomyWeights = null;
        let parseError = null;

        try {
          let jsonString = text.trim();
          if (jsonString.startsWith("```json")) {
            jsonString = jsonString.substring(7);
            if (jsonString.endsWith("```")) {
              jsonString = jsonString.substring(0, jsonString.length - 3);
            }
            jsonString = jsonString.trim();
          }

          taxonomyWeights = JSON.parse(jsonString);

          if (typeof taxonomyWeights !== "object" || taxonomyWeights === null) {
            throw new Error("La respuesta no es un objeto JSON.");
          }
          let validationError = null;
          for (const slug of taxonomySlugs) {
            if (!(slug in taxonomyWeights)) {
              validationError = `Falta la clave de taxonomía: ${slug}`;
              break;
            }
            const weight = taxonomyWeights[slug];
            if (typeof weight !== "number" || weight < 0 || weight > 1) {
              validationError = `Peso inválido para ${slug}: ${weight} (debe ser número entre 0 y 1)`;
              break;
            }
          }
          const receivedKeys = Object.keys(taxonomyWeights);
          if (
            !validationError &&
            receivedKeys.length !== taxonomySlugs.length
          ) {
            const extraKeys = receivedKeys.filter(k => !validSlugsSet.has(k));
            if (extraKeys.length > 0) {
              validationError = `Claves extra no esperadas en la respuesta: ${extraKeys.join(", ")}`;
            }
          }

          if (validationError) {
            throw new Error(validationError);
          }
        } catch (e) {
          parseError = `Error parseando/validando JSON: ${e.message}`;
          console.error(`  -> ${parseError}`);
          taxonomyWeights = null;
        }

        resultObject = {
          id: article.id,
          taxonomyWeights: taxonomyWeights,
          ...(parseError && { error: parseError }),
        };
        existingResultsMap.set(article.id, resultObject);

        console.log(`  -> Guardando resultado para ID ${article.id}...`);
        await writeFileEnsuringDir(
          taxonomiesOutputFile,
          Array.from(existingResultsMap.values())
        );

        console.log(
          `  -> Esperando ${delaySeconds} segundos antes del siguiente artículo...`
        );
        await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
      } catch (error) {
        console.error(
          `  -> Error procesando artículo ID ${article.id} (API Error):`,
          error.message || error
        );
        resultObject = {
          id: article.id,
          taxonomyWeights: null,
          error: `Error en API: ${error.message || error}`,
        };
        existingResultsMap.set(article.id, resultObject);

        console.log(
          `  -> Guardando estado de error (API) para ID ${article.id}...`
        );
        await writeFileEnsuringDir(
          taxonomiesOutputFile,
          Array.from(existingResultsMap.values())
        );

        console.log(
          `  -> Esperando ${delaySecondsOnError} segundos después del error...`
        );
        await new Promise(resolve =>
          setTimeout(resolve, delaySecondsOnError * 1000)
        );
      }
    }
  }

  // Guardado final (opcional, ya que se guarda incrementalmente, pero asegura estado final)
  console.log(
    `Proceso incremental completado. Guardando estado final en ${path.relative(MONOREPO_ROOT, taxonomiesOutputFile)}.`
  );
  await writeFileEnsuringDir(
    taxonomiesOutputFile,
    Array.from(existingResultsMap.values())
  );
}
