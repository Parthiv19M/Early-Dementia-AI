import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analysisRouter from "./analysis";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analysisRouter);
router.use(reportsRouter);

export default router;
