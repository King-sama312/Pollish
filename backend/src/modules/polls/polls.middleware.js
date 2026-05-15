import crypto from "crypto";
import svgCaptcha from "svg-captcha";
import ApiError from "../../common/utils/api-error.js";
import { authenticate } from "../auth/auth.middlewares.js";
import { db } from "../../db/index.js";
import { votes, polls } from "../../db/schema.js";
import { eq, and } from "drizzle-orm";
import { redisClient } from "../../redis/index.js";

// ──────────────────────────────────────────────
//  Configuration
// ──────────────────────────────────────────────
const IP_HASH_SECRET =
  process.env.IP_HASH_SECRET || "change-this-secret-in-production";

const FINGERPRINT_COOKIE_NAME = "voter_fp";
const FINGERPRINT_COOKIE_MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 1 year

const CAPTCHA_TTL_SECONDS = 5 * 60; // 5 minutes (Redis EX)
const CAPTCHA_KEY_PREFIX = "captcha:";

// ──────────────────────────────────────────────
//  Utility helpers (exported for testability)
// ──────────────────────────────────────────────

/**
 * Hash an IP address using HMAC-SHA256 with a server-side secret pepper.
 * Using HMAC (instead of plain SHA-256) prevents rainbow-table attacks
 * because the secret acts as a salt — two servers with different secrets
 * produce different hashes for the same IP.
 */
export const hashIP = (ip) => {
  return crypto.createHmac("sha256", IP_HASH_SECRET).update(ip).digest("hex");
};

/**
 * Generate a cryptographically random voter fingerprint (UUID v4).
 * This is stored in an httpOnly cookie and in the DB to uniquely
 * identify a browser across votes without PII.
 */
export const generateFingerprint = () => crypto.randomUUID();

/**
 * Resolve the real client IP, respecting reverse-proxy headers.
 * Adjust the header order if your infrastructure uses a different
 * convention (e.g. Fly.io uses Fly-Client-IP).
 */
export const getClientIP = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.ip ||
    req.connection?.remoteAddress ||
    "unknown"
  );
};

/**
 * Create an SVG captcha challenge and store the answer in Redis
 * with a TTL.  Returns { captchaId, svg } so the client can
 * render the image and submit both id + text later.
 */
export const generateCaptcha = async () => {
  const captcha = svgCaptcha.create({
    size: 6,
    noise: 3,
    color: true,
    background: "#f0f0f0",
  });
  const captchaId = crypto.randomUUID();
  await redisClient.set(
    `${CAPTCHA_KEY_PREFIX}${captchaId}`,
    captcha.text.toLowerCase(),
    { EX: CAPTCHA_TTL_SECONDS },
  );
  return { captchaId, svg: captcha.data };
};

/**
 * Verify a captcha answer from Redis.  One-time use — the key is deleted
 * regardless of whether the answer was correct.
 */
export const verifyCaptcha = async (captchaId, userInput) => {
  const key = `${CAPTCHA_KEY_PREFIX}${captchaId}`;
  const stored = await redisClient.get(key);
  if (!stored) return false;

  // Delete immediately (one-time use)
  await redisClient.del(key);

  return stored === userInput.toLowerCase().trim();
};

// ──────────────────────────────────────────────
//  Middlewares
// ──────────────────────────────────────────────

/**
 * optionalAuthenticate
 * ─────────────────────
 * Wraps the existing `authenticate` middleware but does NOT reject
 * the request when credentials are missing.  If the auth cookie is
 * present and valid, `req.user` is populated; otherwise req.user
 * stays null and the request continues — perfect for anonymous polls
 * where both logged-in and guest users can vote.
 */
export const optionalAuthenticate = (req, res, next) => {
  authenticate(req, res, (err) => {
    if (err) {
      // Auth failed or no token — proceed as anonymous
      req.user = null;
    }
    next();
  });
};

/**
 * validatePollForVoting
 * ──────────────────────
 * 1. Fetches the poll from DB and attaches it to `req.poll`.
 * 2. Ensures the poll exists, is still active, and has not ended.
 * 3. For non-anonymous polls, rejects unauthenticated requests
 *    (they must go through the `authenticate` middleware instead).
 *
 * Must run AFTER `optionalAuthenticate` so req.user is available.
 */
export const validatePollForVoting = async (req, res, next) => {
  try {
    const pollId = req.params.pollId;
    if (!pollId) throw ApiError.badRequest("Poll ID is required");

    const [poll] = await db.select().from(polls).where(eq(polls.id, pollId));

    if (!poll) throw ApiError.notFound("Poll not found");
    if (!poll.isActive)
      throw ApiError.badRequest("This poll is no longer active");
    if (poll.endsAt && new Date(poll.endsAt) < new Date()) {
      throw ApiError.badRequest("This poll has ended");
    }

    // Non-anonymous polls require a logged-in user
    if (!poll.isAnonymous && !req.user) {
      throw ApiError.badRequest("Authentication required to vote on this poll");
    }

    req.poll = poll;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * validateVoter
 * ──────────────
 * Core voter-identity middleware.  Responsibilities:
 *
 *   a) Compute a hashed version of the voter's IP (ipHash).
 *   b) Read the voter-fingerprint httpOnly cookie (`voter_fp`).
 *   c) If the cookie is MISSING and the user is NOT authenticated,
 *      require & verify a captcha before proceeding.
 *   d) If the cookie is missing, generate a new fingerprint UUID
 *      and set it as an httpOnly cookie on the response.
 *   e) Attach `req.voterInfo = { voterFingerprint, ipHash, userId }`
 *      for downstream middleware / controller use.
 *
 * Captcha logic recap:
 *   - First-time anonymous voter → no cookie → captcha required
 *   - Returning anonymous voter  → cookie present → captcha skipped
 *   - Any authenticated user     → captcha never required
 *   - Cookie cleared by user     → treated as first-time → captcha again
 */
export const validateVoter = async (req, res, next) => {
  try {
    const ip = getClientIP(req);
    const ipHash = hashIP(ip);
    const isAuthenticated = !!req.user;
    let voterFingerprint = req.cookies?.[FINGERPRINT_COOKIE_NAME];

    // ── No fingerprint cookie ────────────────────────────
    if (!voterFingerprint) {
      // Anonymous + no cookie → CAPTCHA gate
      if (!isAuthenticated) {
        const { captchaId, captchaText } = req.body || {};
        if (!captchaId || !captchaText) {
          throw ApiError.badRequest(
            "Captcha verification required. Request a captcha first via GET /polls/captcha/generate",
          );
        }
        const isValid = await verifyCaptcha(captchaId, captchaText);
        if (!isValid) {
          throw ApiError.badRequest("Invalid or expired captcha");
        }
      }

      // Generate a new fingerprint and bake it into an httpOnly cookie
      voterFingerprint = generateFingerprint();

      res.cookie(FINGERPRINT_COOKIE_NAME, voterFingerprint, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: FINGERPRINT_COOKIE_MAX_AGE,
        path: "/",
      });
    }

    // ── Attach resolved voter info ────────────────────────
    req.voterInfo = {
      voterFingerprint,
      ipHash,
      userId: isAuthenticated ? req.user.id : null,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * checkDuplicateVote
 * ───────────────────
 * Prevents double-voting by checking two dimensions:
 *
 *   1. Fingerprint + pollId  (catches the same browser voting twice,
 *      regardless of auth status)
 *   2. UserId + pollId       (catches an authenticated user who
 *      cleared cookies and got a new fingerprint — their userId
 *      still ties them to a previous vote)
 *
 * Must run AFTER `validateVoter` so req.voterInfo is available.
 */
export const checkDuplicateVote = async (req, res, next) => {
  try {
    const pollId = req.params.pollId;
    const { voterFingerprint, userId, ipHash } = req.voterInfo;

    // Check by fingerprint
    const [existingByFingerprint] = await db
      .select()
      .from(votes)
      .where(
        and(
          eq(votes.pollId, pollId),
          eq(votes.voterFingerPrint, voterFingerprint),
        ),
      )
      .limit(1);

    if (existingByFingerprint) {
      throw ApiError.badRequest("You have already voted on this poll");
    }

    // If authenticated, also check by userId
    if (userId) {
      const [existingByUser] = await db
        .select()
        .from(votes)
        .where(and(eq(votes.pollId, pollId), eq(votes.userId, userId)))
        .limit(1);

      if (existingByUser) {
        throw ApiError.badRequest("You have already voted on this poll");
      }
    } else {
      // Limit anonymous votes to 3 per IP per poll
      if (ipHash) {
        const { sql } = await import("drizzle-orm");
        const result = await db.select({ count: sql`count(${votes.id})::int` })
          .from(votes)
          .where(
            and(
              eq(votes.pollId, pollId),
              eq(votes.IPHash, ipHash)
            )
          );
        const ipVoteCount = result[0]?.count || 0;
        if (ipVoteCount >= 3) {
          throw ApiError.badRequest("Rate limit exceeded: You cannot vote more than 3 times from the same IP address in anonymous mode.");
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};
