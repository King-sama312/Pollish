import * as controller from "./polls.controller.js"
import { Router } from "express"
import validate from "../../common/middleware/validate.middleware.js"
import PollDto from "./dto/createPoll.dto.js"
import { authenticate } from "../auth/auth.middlewares.js"
import { optionalAuthenticate, validatePollForVoting, validateVoter, checkDuplicateVote } from "./polls.middleware.js"

const router = Router()

router.post("/create", authenticate, controller.createPoll)
router.get("/my-polls", authenticate, controller.getPolls)
router.get("/get/:pollId", optionalAuthenticate, controller.getPollById)
router.delete("/delete/:pollId", authenticate, controller.deletePoll)
router.patch("/:pollId/publish", authenticate, controller.publishPoll)
router.post("/:pollId/vote", optionalAuthenticate, validatePollForVoting, validateVoter, checkDuplicateVote, controller.votePoll)
router.get("/captcha/generate", controller.getCaptcha)

export default router