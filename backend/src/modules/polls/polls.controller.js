import * as pollServices from "./polls.services.js";
import ApiResponse from "../../common/utils/api-response.js";

export const createPoll = async (req, res) => {
  const userId = req.user.id;
  const { poll, options } = await pollServices.createPoll({
    ...req.body,
    creatorId: userId,
  });

  ApiResponse.created(res, "Poll created successfully", { poll, options });
};

export const getPolls = async (req, res) => {
    const userId = req.user.id;
    const { polls } = await pollServices.getPolls(userId);
    ApiResponse.ok(res, "Polls fetched", { polls });
};

export const getPollById = async (req, res) => {
    // optionalAuthenticate puts user in req.user, or it's null
    const userId = req.user ? req.user.id : null;
    const { pollId } = req.params;
    const requireResults = req.query.results === 'true';
    const { poll, options, totalVotes } = await pollServices.getPollById(pollId, userId, requireResults);
    ApiResponse.ok(res, "Poll fetched", { poll, options, totalVotes });
};

export const deletePoll = async (req, res) => {
    const userId = req.user.id;
    const { pollId } = req.params;
    await pollServices.deletePoll(pollId, userId);
    ApiResponse.ok(res, "Poll deleted successfully");
};

export const publishPoll = async (req, res) => {
    const userId = req.user.id;
    const { pollId } = req.params;
    const { isPublished } = req.body;
    const poll = await pollServices.publishPoll(pollId, userId, isPublished);
    ApiResponse.ok(res, "Poll publish status updated", { poll });
};

import { getIO } from "../../socket.js";

export const votePoll = async (req, res) => {
  const { pollId } = req.params;
  const { optionIds } = req.body; // Array for compatibility with frontend, but backend enforces single option

  if (!optionIds || !Array.isArray(optionIds) || optionIds.length === 0) {
    return res.status(400).json({ success: false, message: "Option ID is required" });
  }

  // Hackathon requirement: only single option selection
  if (optionIds.length > 1) {
    return res.status(400).json({ success: false, message: "Only single option selection is allowed" });
  }

  const optionId = optionIds[0];
  const { voterFingerprint, ipHash, userId } = req.voterInfo;

  const { vote, totalVotes } = await pollServices.votePoll({
    pollId,
    optionId,
    userId,
    voterFingerPrint: voterFingerprint,
    IPHash: ipHash,
  });

  // Broadcast real-time update
  const io = getIO();
  io.to(`poll_${pollId}`).emit("poll:vote", {
    pollId,
    optionId,
    totalVotes,
  });

  ApiResponse.created(res, "Vote recorded successfully", { vote });
};

import { generateCaptcha } from "./polls.middleware.js";

export const getCaptcha = async (req, res) => {
  const { captchaId, svg } = await generateCaptcha();
  ApiResponse.ok(res, "Captcha generated", { captchaId, svg });
};
