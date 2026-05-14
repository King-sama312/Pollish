import * as pollServices from "./polls.services.js";
import * as pollMiddleware from "./polls.middleware.js";
import ApiResponse from "../../common/utils/api-response.js";

// ──────────────────────────────────────────────
//  POLL CRUD
// ──────────────────────────────────────────────

export const createPoll = async (req, res) => {
  try {
    const poll = await pollServices.createPoll({
      ...req.body,
      creatorId: req.user.id,
    });
    ApiResponse.created(res, "Poll created successfully", poll);
  } catch (error) {
    console.log("Create poll error", error);
    ApiResponse.error(res, error);
  }
};

export const getPoll = async (req, res) => {
  try {
    const result = await pollServices.getPollWithResults(req.params.pollId);
    ApiResponse.success(res, "Poll fetched successfully", result);
  } catch (error) {
    console.log("Get poll error", error);
    ApiResponse.error(res, error);
  }
};

export const updatePoll = async (req, res) => {
  try {
    const updated = await pollServices.updatePoll(req.params.pollId, req.body);
    ApiResponse.success(res, "Poll updated successfully", updated);
  } catch (error) {
    console.log("Update poll error", error);
    ApiResponse.error(res, error);
  }
};

export const deletePoll = async (req, res) => {
  try {
    await pollServices.deletePoll(req.params.pollId);
    ApiResponse.success(res, "Poll deleted successfully");
  } catch (error) {
    console.log("Delete poll error", error);
    ApiResponse.error(res, error);
  }
};

// ──────────────────────────────────────────────
//  VOTING
// ──────────────────────────────────────────────

export const castVote = async (req, res) => {
  try {
    const { optionIds, optionId } = req.body;
    const poll = req.poll; // attached by validatePollForVoting
    const { voterFingerprint, ipHash, userId } = req.voterInfo; // attached by validateVoter

    const insertedVotes = await pollServices.castVote({
      pollId: poll.id,
      optionIds: optionIds || optionId, // accept either format
      voterFingerprint,
      ipHash,
      userId,
      allowMultipleChoices: poll.allowMultipleChoices,
    });

    ApiResponse.created(res, "Vote cast successfully", insertedVotes);
  } catch (error) {
    console.log("Cast vote error", error);
    ApiResponse.error(res, error);
  }
};

// ──────────────────────────────────────────────
//  CAPTCHA
// ──────────────────────────────────────────────

export const getCaptcha = (req, res) => {
  try {
    const { captchaId, svg } = pollMiddleware.generateCaptcha();
    ApiResponse.success(res, "Captcha generated", { captchaId, svg });
  } catch (error) {
    console.log("Generate captcha error", error);
    ApiResponse.error(res, error);
  }
};
