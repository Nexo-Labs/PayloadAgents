import { taxonomizeArticles } from "../taxonomizer.mjs";

// Este runner ejecuta la función principal con la configuración por defecto.
// Puedes modificar el objeto de configuración pasado a taxonomizeArticles
// si necesitas cambiar rutas, modelo, delays, etc.

async function run() {
  console.log("--- Ejecutando Taxonomizador ---");
  try {
    await taxonomizeArticles({
      // Ejemplo: para cambiar el archivo de entrada
      // articlesInputFile: path.resolve(__dirname, '../../../otro/directorio/articles.json')
      // modelName: "gemini-1.5-pro"
    });
    console.log("\n--- Taxonomizador completado ---");
  } catch (error) {
    console.error("\n--- Error durante la taxonomización ---", error);
    process.exit(1);
  }
}

run();
