import ApiError from "../../common/utils/api-error.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../../common/utils/jwt.utils.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "../../db/index.js";
import { users, refreshTokens } from "../../db/schema.js";

export const register = async ({ name, email, password }) => {
  try {
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existing) {
      throw ApiError.conflict("Email already in use");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db
      .insert(users)
      .values({ name, email, passwordHash })
      .returning();

      const userObj = user
      delete userObj.passwordHash;
    return userObj;
  } catch (err) {
    if(err instanceof ApiError){
        throw err;
    }
    console.log("Register error", err);
    throw ApiError.internal("Internal Server error");
  }
};

export const login = async ({ email, password }) => {
  const [user] = await db.select().from(users).where(eq(users.email, email));

  console.log("service user:", user)
  if (!user) {
    throw ApiError.unauthorized("Invalid credentials");
  }
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if(!isMatch){
    throw ApiError.unauthorized("Invalid credentials");
  }

  const accessToken = generateAccessToken({ userId: user.id });
  const refreshToken = generateRefreshToken({ userId: user.id });

  console.log("service refresh token:", refreshToken)

  await db.insert(refreshTokens).values({
    userId: user.id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  })
 const userObj = user
      delete userObj.passwordHash;
  return {user:userObj, accessToken, refreshToken};
};

export const getMe = async (userId)=>{
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if(!user){
    throw ApiError.notFound("User not found");
  }
  const userObj = user;
  delete userObj.passwordHash;
  return userObj;
}

export const refresh= async(oldRefreshToken)=>{
  try {
    const payload = verifyRefreshToken(oldRefreshToken);
    
    const [storedToken] = await db.select().from(refreshTokens).where(eq(refreshTokens.token, oldRefreshToken));
    if(!storedToken || storedToken.expiresAt < new Date()){
        throw ApiError.unauthorized("Invalid refresh token");
    }

    const accessToken = generateAccessToken({ userId: payload.userId });
    const refreshToken = generateRefreshToken({ userId: payload.userId });

    await db.insert(refreshTokens).values({
        userId: payload.userId,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      })

      await db.delete(refreshTokens).where(eq(refreshTokens.token, oldRefreshToken));

      return {accessToken, refreshToken};
  } catch (err) {
      if (err instanceof ApiError) throw err;
    throw ApiError.unauthorized("Invalid refresh token");
  }
}

export const logout = async(refreshToken)=>{
  await db.delete(refreshTokens).where(eq(refreshTokens.token, refreshToken));
}