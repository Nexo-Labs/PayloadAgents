import path from "path";
import { fileURLToPath } from "url";
import { generateRelationshipDiagram } from "../diagram-generator.mjs"; // Importar la función exportada

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Este runner ejecuta la función principal con la configuración por defecto.\n// Puedes modificar el objeto de configuración pasado a generateRelationshipDiagram\n// si necesitas cambiar las rutas de entrada/salida.\n\nasync function run() {\n  console.log("--- Ejecutando Generador de Diagrama ---");\n  try {\n    // Llamar a la función importada\n    await generateRelationshipDiagram({\n      // Ejemplo: para cambiar el archivo de salida\n      // mermaidOutputFile: path.resolve(__dirname, '../../../output/taxonomies/otro-diagrama.md')\n    });\n    console.log("\\n--- Generador de Diagrama completado ---");\n  } catch (error) {\n    console.error("\\n--- Error durante la generación del diagrama ---", error);\n    process.exit(1);\n  }\n}\n\nrun();
async function run() {
    console.log("--- Ejecutando Procesador de Pesos ---");
    try {
      await generateRelationshipDiagram({
        
      });
      console.log("\n--- Procesador de Pesos completado ---");
    } catch (error) {
      console.error("\n--- Error durante el procesamiento de pesos ---", error);
      process.exit(1);
    }
  }
  
  run();
  