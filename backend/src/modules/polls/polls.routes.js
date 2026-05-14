import { Router } from "express";
import * as controller from "./polls.controller.js";
import { authenticate } from "../auth/auth.middlewares.js";
import {
  optionalAuthenticate,
  validatePollForVoting,
  validateVoter,
  checkDuplicateVote,
} from "./polls.middleware.js";
import validate from "../../common/middleware/validate.middleware.js";
import CreatePollDto from "./dto/createPoll.dto.js";
const router = Router();

// ──────────────────────────────────────────────
//  Poll CRUD (auth required)
// ──────────────────────────────────────────────

router.post(
  "/create",
  authenticate,
  validate(CreatePollDto),
  controller.createPoll,
);

router
  .route("/:pollId")
  .get(controller.getPoll)
  .patch(authenticate, controller.updatePoll)
  .delete(authenticate, controller.deletePoll);

// ──────────────────────────────────────────────
//  Captcha (public — no auth needed)
// ──────────────────────────────────────────────

router.get("/captcha/generate", controller.getCaptcha);

// ──────────────────────────────────────────────
//  Voting
// ──────────────────────────────────────────────
//  Middleware chain for voting:
//
//  1. optionalAuthenticate   — sets req.user if cookie valid, else null
//  2. validatePollForVoting  — fetches poll, checks active/not-ended,
//                              rejects unauth on non-anonymous polls
//  3. validateVoter          — IP hashing, fingerprint cookie,
//                              captcha gate for anonymous first-timers
//  4. checkDuplicateVote     — prevents double-voting by fingerprint
//                              and userId
//  5. controller.castVote    — records the vote
// ──────────────────────────────────────────────

router.post(
  "/:pollId/vote",
  optionalAuthenticate,
  validatePollForVoting,
  validateVoter,
  checkDuplicateVote,
  controller.castVote,
);

export default router;
