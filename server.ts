/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // POST endpoint to analyze performance using Gemini
  app.post("/api/analyze-performance", async (req, res) => {
    const { playerName, levelName, attempts, averageDuration, efficiency } = req.body;

    const efficiencyLabel = efficiency !== undefined ? `${Math.round(efficiency * 100)}%` : "0%";

    // Fallback response generator in case API key is missing or there's an error
    const generateFallback = () => {
      // Analyze strengths and weaknesses locally
      const wrongBySubcat: Record<string, number> = {};
      const correctBySubcat: Record<string, number> = {};
      attempts?.forEach((a: any) => {
        const name = a.subcatName || "Álgebra General";
        if (a.correct) {
          correctBySubcat[name] = (correctBySubcat[name] || 0) + 1;
        } else {
          wrongBySubcat[name] = (wrongBySubcat[name] || 0) + 1;
        }
      });

      let hardestTopic = "Álgebra General (¡Sigue practicando!)";
      let maxWrongs = 0;
      Object.entries(wrongBySubcat).forEach(([name, count]) => {
        if (count > maxWrongs) {
          maxWrongs = count;
          hardestTopic = name;
        }
      });

      let easiestTopic = "Álgebra General (¡Sigue así!)";
      let maxCorrect = 0;
      Object.entries(correctBySubcat).forEach(([name, count]) => {
        if (count > maxCorrect) {
          maxCorrect = count;
          easiestTopic = name;
        }
      });

      return {
        analysis: `¡Excelente esfuerzo de ${playerName || "el alumno"} en el "${levelName || "Templo de Álgebra"}"! Ha completado la sesión con una efectividad general del ${efficiencyLabel} y un tiempo promedio de respuesta de ${averageDuration || 15} segundos por ecuación. Se nota una excelente destreza y rapidez en "${easiestTopic}", lo cual es una gran base. Para el tema de "${hardestTopic}", sugerimos repasar con paciencia paso a paso, reforzando las leyes de signos y la jerarquía de operadores para consolidar el aprendizaje.`,
        strengths: [
          `Fuerte dominio conceptual en: ${easiestTopic}`,
          `Velocidad de respuesta óptima (${averageDuration || 15}s de promedio)`,
          "Muestra excelente concentración y actitud de aprendizaje"
        ],
        recommendations: [
          `Reforzar con calma: ${hardestTopic}`,
          "Anotar el procedimiento en papel antes de responder en pantalla",
          "Realizar sesiones cortas de juego para mantener la atención al máximo"
        ]
      };
    };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.log("GEMINI_API_KEY is not defined. Using local pedagogical fallback analysis.");
      return res.json(generateFallback());
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Eres un psicopedagogo experto en la enseñanza de matemáticas para adolescentes de escuela secundaria (11-15 años).
Analiza el desempeño de este estudiante y genera un reporte constructivo, motivador y claro en español de Latinoamérica, dirigido exclusivamente a los padres de familia.

Datos del estudiante:
- Nombre: ${playerName || "el alumno"}
- Nivel de juego de álgebra: ${levelName || "Nivel General"}
- Efectividad (porcentaje de aciertos): ${efficiencyLabel}
- Tiempo promedio de resolución por pregunta: ${averageDuration || 15} segundos
- Historial de intentos:
${JSON.stringify(attempts, null, 2)}

Por favor, devuelve la respuesta en formato JSON válido con la siguiente estructura exacta:
{
  "analysis": "Un párrafo cálido, descriptivo y alentador dirigido a los padres que explique qué observas del desempeño del alumno, destacando su esfuerzo de manera pedagógica (máximo 125 palabras). Debe mencionar de forma natural e integrada el tema en el que mostró mayor solidez y el tema que le causó más retos.",
  "strengths": [
    "Fortaleza específica 1 (máximo 10 palabras)",
    "Fortaleza específica 2 (máximo 10 palabras)",
    "Fortaleza específica 3 (máximo 10 palabras)"
  ],
  "recommendations": [
    "Consejo de apoyo en casa 1 (máximo 15 palabras)",
    "Consejo de apoyo en casa 2 (máximo 15 palabras)",
    "Consejo de apoyo en casa 3 (máximo 15 palabras)"
  ]
}

No incluyas markdown de bloque de código de JSON (como \`\`\`json ... \`\`\`), devuelve únicamente el texto plano del objeto JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });

      let text = response.text || "";
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      
      const parsed = JSON.parse(text);
      return res.json(parsed);
    } catch (error) {
      console.error("Gemini performance analysis error:", error);
      return res.json(generateFallback());
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
