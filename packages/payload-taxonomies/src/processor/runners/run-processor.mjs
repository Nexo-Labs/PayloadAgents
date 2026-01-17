import { processTaxonomyWeights } from "../processor.mjs";

// Este runner ejecuta la función principal con la configuración por defecto.
// Puedes modificar el objeto de configuración pasado a processTaxonomyWeights
// si necesitas cambiar rutas, topN, umbrales, etc.

async function run() {
  console.log("--- Ejecutando Procesador de Pesos ---");
  try {
    await processTaxonomyWeights({
      // Ejemplo: para cambiar el número de top tags
      // topN: 5,
      // Ejemplo: para cambiar los umbrales
      // minWeightThresholds: { "historia": 0.9 }
    });
    console.log("\n--- Procesador de Pesos completado ---");
  } catch (error) {
    console.error("\n--- Error durante el procesamiento de pesos ---", error);
    process.exit(1);
  }
}

run();
