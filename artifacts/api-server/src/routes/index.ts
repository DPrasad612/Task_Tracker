import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import tasksRouter from "./tasks";
import preferencesRouter from "./preferences";
import progressRouter from "./progress";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(tasksRouter);
router.use(preferencesRouter);
router.use(progressRouter);
router.use(analyticsRouter);

export default router;
