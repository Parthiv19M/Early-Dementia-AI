import { Router, type IRouter } from "express";
import multer from "multer";
import { analyzeText as analyzeTextFn } from "../lib/speechAnalysis.js";

const router: IRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});

router.post(
  "/analysis/transcribe",
  upload.single("audio"),
  async (req, res): Promise<void> => {
    const language = req.body.language === "te" ? "te" : "en";
    const audioFile = req.file;

    if (!audioFile) {
      res.status(400).json({ error: "audio file is required" });
      return;
    }

    try {
      const { ensureCompatibleFormat, speechToText } = await import(
        "@workspace/integrations-openai-ai-server/audio"
      );
      const { buffer, format } = await ensureCompatibleFormat(audioFile.buffer);
      const transcript = await speechToText(buffer, format);
      const result = analyzeTextFn(transcript.trim(), language);

      res.json(result);
    } catch (error) {
      console.error("Audio transcription failed:", error);
      res.status(503).json({
        error:
          "Audio transcription is unavailable. Check the OpenAI audio integration configuration and try again.",
      });
    }
  },
);

/**
 * New endpoint as specified in the hackathon requirements.
 * POST http://localhost:3000/api/analyze
 * Request: { text: string }
 * Response: { score: number, risk: "Low" | "Medium" | "High", observations: string[] }
 */
router.post("/analyze", async (req, res): Promise<void> => {
  const { text } = req.body;

  if (!text || typeof text !== "string" || !text.trim()) {
    res.status(400).json({ error: "text is required" });
    return;
  }

  // Use the local analysis function
  const result = analyzeTextFn(text.trim(), "en");

  // Map the local results to the format requested by the user
  const riskMap: Record<string, "Low" | "Medium" | "High"> = {
    "Normal": "Low",
    "Mild Cognitive Impairment": "Medium",
    "High Risk": "High",
  };

  res.json({
    score: result.riskScore,
    risk: riskMap[result.riskLevel] || "Low",
    observations: result.problematicPatterns,
  });
});

// Original endpoint (modified to avoid openai dependency if possible)
router.post("/analysis/text", async (req, res): Promise<void> => {
  const { text, language = "en" } = req.body;

  if (!text || typeof text !== "string" || !text.trim()) {
    res.status(400).json({ error: "text is required" });
    return;
  }

  const result = analyzeTextFn(text.trim(), language);
  res.json(result);
});

export default router;
