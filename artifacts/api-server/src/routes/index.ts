import { Router, type IRouter } from "express";
import healthRouter from "./health";
import playersRouter from "./players";
import runsRouter from "./runs";
import leaderboardRouter from "./leaderboard";
import spoofRouter from "./spoof";
import adminRouter from "./admin";
import questionsRouter from "./questions";

const router: IRouter = Router();

router.use(healthRouter);
router.use(playersRouter);
router.use(runsRouter);
router.use(leaderboardRouter);
router.use(spoofRouter);
router.use(adminRouter);
router.use(questionsRouter);

export default router;
