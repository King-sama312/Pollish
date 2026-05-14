import ApiError from "../../common/utils/api-error.js";
import { eq, and, inArray, sql } from "drizzle-orm";
import { db } from "../../../src/db/index.js";
import { polls, pollOptions, votes } from "../../../src/db/schema.js";

// ──────────────────────────────────────────────
//  POLL CRUD
// ──────────────────────────────────────────────

export const createPoll = async ({
  creatorId,
  question,
  description,
  isAnonymous,
  allowMultipleChoices,
  endAt,
  options,
}) => {
  try {
    const [poll] = await db.insert(polls).values({
      creatorId,
      question,
      description,
      isAnonymous,
      allowMultipleChoices,
      endsAt: endAt ? new Date(endAt) : null,
    }).returning();

    if (options && options.length > 0) {
      await db.insert(pollOptions).values(
        options.map((option, index) => ({
          pollId: poll.id,
          text: option.text,
          displayOrder: option.displayOrder ?? index,
        }))
      );
    }

    // Return the full poll with its options
    const createdOptions = await db
      .select()
      .from(pollOptions)
      .where(eq(pollOptions.pollId, poll.id));

    return { ...poll, options: createdOptions };
  } catch (error) {
    console.log("Create poll error", error);
    throw ApiError.badRequest("Failed to create poll");
  }
};

export const getPollById = async (pollId) => {
  try {
    const [poll] = await db.select().from(polls).where(eq(polls.id, pollId));
    if (!poll) throw ApiError.notFound("Poll not found");
    return poll;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.log("Get poll error", error);
    throw ApiError.badRequest("Failed to get poll");
  }
};

export const getPollOptions = async (pollId) => {
  try {
    // NOTE: renamed local variable to avoid shadowing the imported `pollOptions` table
    const options = await db
      .select()
      .from(pollOptions)
      .where(eq(pollOptions.pollId, pollId));
    return options;
  } catch (error) {
    console.log("Get poll options error", error);
    throw ApiError.badRequest("Failed to get poll options");
  }
};

export const addPollOptions = async (pollId, options) => {
  try {
    const insertedOptions = await db
      .insert(pollOptions)
      .values(options.map((option, index) => ({ pollId, ...option, displayOrder: option.displayOrder ?? index })))
      .returning();
    return insertedOptions;
  } catch (error) {
    console.log("Add poll options error", error);
    throw ApiError.badRequest("Failed to add poll options");
  }
};

export const deletePollOption = async (optionId) => {
  try {
    await db.delete(pollOptions).where(eq(pollOptions.id, optionId));
  } catch (error) {
    console.log("Delete poll option error", error);
    throw ApiError.badRequest("Failed to delete poll option");
  }
};

export const updatePoll = async (pollId, updateData) => {
  try {
    const [updated] = await db
      .update(polls)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(polls.id, pollId))
      .returning();
    if (!updated) throw ApiError.notFound("Poll not found");
    return updated;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.log("Update poll error", error);
    throw ApiError.badRequest("Failed to update poll");
  }
};

export const deletePoll = async (pollId) => {
  try {
    const [deleted] = await db
      .delete(polls)
      .where(eq(polls.id, pollId))
      .returning();
    if (!deleted) throw ApiError.notFound("Poll not found");
    return deleted;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.log("Delete poll error", error);
    throw ApiError.badRequest("Failed to delete poll");
  }
};

// ──────────────────────────────────────────────
//  VOTING
// ──────────────────────────────────────────────

/**
 * Cast a vote on a poll.
 *
 * @param {Object} params
 * @param {string} params.pollId       - The poll being voted on
 * @param {string|string[]} params.optionIds - One optionId or an array (for multiple-choice polls)
 * @param {string} params.voterFingerprint - Browser fingerprint UUID from middleware
 * @param {string} params.ipHash        - HMAC-SHA256 of voter IP from middleware
 * @param {string|null} params.userId   - Authenticated user ID or null for anonymous
 * @param {boolean} params.allowMultipleChoices - From the poll record
 *
 * For single-choice polls: `optionIds` must contain exactly one ID.
 * For multiple-choice polls: `optionIds` may contain 1+ IDs.
 */
export const castVote = async ({
  pollId,
  optionIds,
  voterFingerprint,
  ipHash,
  userId,
  allowMultipleChoices,
}) => {
  try {
    // Normalise to array
    const ids = Array.isArray(optionIds) ? optionIds : [optionIds];

    if (ids.length === 0) {
      throw ApiError.badRequest("At least one option must be selected");
    }

    if (!allowMultipleChoices && ids.length > 1) {
      throw ApiError.badRequest("This poll only allows a single choice");
    }

    // Verify that all optionIds belong to this poll
    const validOptions = await db
      .select()
      .from(pollOptions)
      .where(and(eq(pollOptions.pollId, pollId), inArray(pollOptions.id, ids)));

    if (validOptions.length !== ids.length) {
      throw ApiError.badRequest(
        "One or more selected options do not belong to this poll"
      );
    }

    // Insert vote rows (one per chosen option)
    const voteRows = ids.map((optionId) => ({
      pollId,
      optionId,
      voterFingerPrint: voterFingerprint,
      IPHash: ipHash,
      userId: userId || null,
    }));

    const insertedVotes = await db.insert(votes).values(voteRows).returning();

    return insertedVotes;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.log("Cast vote error", error);
    throw ApiError.badRequest("Failed to cast vote");
  }
};

// ──────────────────────────────────────────────
//  POLL RESULTS
// ──────────────────────────────────────────────

/**
 * Get a poll with its options and aggregated vote counts.
 * For anonymous polls, voter identities are stripped.
 *
 * Returns:
 *   {
 *     poll: { ...pollData },
 *     options: [
 *       { id, text, displayOrder, voteCount },
 *       ...
 *     ],
 *     totalVotes: number,
 *   }
 */
export const getPollWithResults = async (pollId) => {
  try {
    const poll = await getPollById(pollId);
    const options = await getPollOptions(pollId);

    // Aggregate vote counts per option
    const optionIds = options.map((o) => o.id);

    let voteCountsMap = {};
    if (optionIds.length > 0) {
      const voteCounts = await db
        .select({
          optionId: votes.optionId,
          count: sql`COUNT(*)`.as("count"),
        })
        .from(votes)
        .where(inArray(votes.optionId, optionIds))
        .groupBy(votes.optionId);

      voteCountsMap = voteCounts.reduce((acc, row) => {
        acc[row.optionId] = row.count;
        return acc;
      }, {});
    }

    const totalVotes = Object.values(voteCountsMap).reduce(
      (sum, count) => sum + Number(count),
      0
    );

    const optionsWithCounts = options.map((option) => ({
      ...option,
      voteCount: Number(voteCountsMap[option.id] || 0),
    }));

    return {
      poll,
      options: optionsWithCounts,
      totalVotes,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.log("Get poll results error", error);
    throw ApiError.badRequest("Failed to get poll results");
  }
};
