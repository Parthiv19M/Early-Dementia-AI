import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, reportsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/reports", async (req, res): Promise<void> => {
  const userId = req.query.userId as string | undefined;

  const query = db.select().from(reportsTable).orderBy(desc(reportsTable.createdAt));

  if (userId) {
    const reports = await db.select().from(reportsTable)
      .where(eq(reportsTable.userId, userId))
      .orderBy(desc(reportsTable.createdAt));
    res.json(reports);
    return;
  }

  const reports = await query;
  res.json(reports);
});

router.get("/reports/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [report] = await db.select().from(reportsTable).where(eq(reportsTable.id, id));
  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  res.json(report);
});

router.post("/reports", async (req, res): Promise<void> => {
  const { userId, transcript, riskLevel, riskScore, confidence, features, problematicPatterns, recommendations, language } = req.body;

  if (!userId || !transcript || !riskLevel || riskScore == null || confidence == null || !features) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const [report] = await db.insert(reportsTable).values({
    userId,
    transcript,
    riskLevel,
    riskScore,
    confidence,
    features,
    problematicPatterns: problematicPatterns || [],
    recommendations: recommendations || [],
    language: language || "en",
  }).returning();

  res.status(201).json(report);
});

router.delete("/reports/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [report] = await db.delete(reportsTable).where(eq(reportsTable.id, id)).returning();
  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
