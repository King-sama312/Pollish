import ApiError from "../../common/utils/api-error.js";
import { eq, desc, sql, and } from "drizzle-orm";
import { db } from "../../db/index.js";
import { users, polls, pollOptions, votes } from "../../db/schema.js";

export const createPoll = async ({
  creatorId,
  question,
  description,
  isAnonymous,
  isActive,
  endsAt,
  options,
}) => {
  if (
    (!creatorId,
    !question,
    !isAnonymous,
    !isActive,
    !options)
  )
    throw ApiError.badRequest("Please provide all the required fields");

  const [poll] = await db
    .insert(polls)
    .values({
      creatorId,
      question,
      description,
      isAnonymous,
      isActive,
      endsAt: endsAt ? new Date(endsAt) : new Date(),
    })
    .returning();

  const variablePollOptions = await Promise.all(
    options.map(async (text, index) => {
      const [option] = await db
        .insert(pollOptions)
        .values({ pollId: poll.id, text, displayOrder: index })
        .returning();
      return option;
    }),
  );

  return { poll, options: variablePollOptions };
};

export const getPolls = async (userId) => {
  // Aggregate vote counts using a subquery or left join
  const result = await db
    .select({
      id: polls.id,
      question: polls.question,
      description: polls.description,
      isAnonymous: polls.isAnonymous,
      isPublished: polls.isPublished,
      isActive: polls.isActive,
      endsAt: polls.endsAt,
      createdAt: polls.createdAt,
      totalVotes: sql`count(${votes.id})::int`,
    })
    .from(polls)
    .leftJoin(votes, eq(polls.id, votes.pollId))
    .where(eq(polls.creatorId, userId))
    .groupBy(polls.id)
    .orderBy(desc(polls.createdAt));

  return { polls: result || [] };
};

export const getPollById = async (pollId, userId, requireResults = false) => {
  const poll = await db.query.polls.findFirst({
    where: eq(polls.id, pollId),
  });

  if (!poll) throw ApiError.notFound("Poll not found");

  const canViewResults = poll.isPublished || poll.creatorId === userId;

  // Only throw forbidden if the client explicitly requests the results and can't view them
  if (requireResults && !canViewResults) {
    throw ApiError.forbidden("This poll's results are not published yet.");
  }

  const optionsData = await db
    .select({
      id: pollOptions.id,
      text: pollOptions.text,
      displayOrder: pollOptions.displayOrder,
      voteCount: sql`count(${votes.id})::int`,
    })
    .from(pollOptions)
    .leftJoin(votes, eq(pollOptions.id, votes.optionId))
    .where(eq(pollOptions.pollId, poll.id))
    .groupBy(pollOptions.id)
    .orderBy(pollOptions.displayOrder);

  const totalVotes = optionsData.reduce((acc, curr) => acc + curr.voteCount, 0);

  if (!canViewResults) {
    const hiddenOptions = optionsData.map(o => ({ ...o, voteCount: 0 }));
    return { poll, options: hiddenOptions, totalVotes: 0 };
  }

  return { poll, options: optionsData, totalVotes };
};

export const deletePoll = async (pollId, userId) => {
  const poll = await db.query.polls.findFirst({
    where: eq(polls.id, pollId),
  });

  if (!poll) throw ApiError.notFound("Poll not found");
  if (poll.creatorId !== userId) throw ApiError.forbidden("Not authorized");

  await db.delete(polls).where(eq(polls.id, pollId));
  return { deleted: true };
};

export const publishPoll = async (pollId, userId, isPublished) => {
  const poll = await db.query.polls.findFirst({
    where: eq(polls.id, pollId),
  });

  if (!poll) throw ApiError.notFound("Poll not found");
  if (poll.creatorId !== userId) throw ApiError.forbidden("Not authorized");

  const [updatedPoll] = await db
    .update(polls)
    .set({ isPublished, updatedAt: new Date() })
    .where(eq(polls.id, pollId))
    .returning();

  return updatedPoll;
};

export const votePoll = async ({ pollId, optionId, userId, voterFingerPrint, IPHash }) => {
  // Validate option exists for the poll
  const option = await db.query.pollOptions.findFirst({
    where: and(eq(pollOptions.id, optionId), eq(pollOptions.pollId, pollId)),
  });

  if (!option) {
    throw ApiError.badRequest("Invalid option for this poll");
  }

  const [vote] = await db
    .insert(votes)
    .values({
      pollId,
      optionId,
      userId,
      voterFingerPrint,
      IPHash,
    })
    .returning();

  // Get total votes for the poll to broadcast
  const [{ totalVotes }] = await db
    .select({ totalVotes: sql`count(${votes.id})::int` })
    .from(votes)
    .where(eq(votes.pollId, pollId));

  return { vote, totalVotes };
};
