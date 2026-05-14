import * as authServices from "./auth.services.js";
import ApiResponse from "../../common/utils/api-response.js";

export const register = async (req, res) => {
  const user = await authServices.register(req.body);
  ApiResponse.created(res, "Registration successful", user);
};

export const login = async (req, res) => {
  const { user, accessToken, refreshToken } = await authServices.login(
    req.body,
  );

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 15* 60 * 1000, // 15 minutes
  });

  ApiResponse.ok(res, "Login successful", { user });
};

export const getMe = async (req, res) => {
  const user = await authServices.getMe(req.user.id);
  ApiResponse.ok(res, "User fetched successfully", user);
};

export const refresh = async (req, res) => {
  const oldRefreshToken = req.cookies.refreshToken;
  const { accessToken, refreshToken } =
    await authServices.refresh(oldRefreshToken);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 15 *60* 1000, // 15 minutes
  });

  ApiResponse.ok(res, "Token refreshed successfully", { accessToken });
};

export const logout = async (req, res) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) {
  throw ApiError.unauthorized("No refresh token provided");
}
  await authServices.logout(refreshToken);
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" ,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  ApiResponse.ok(res, "Logged out successfully");
};
