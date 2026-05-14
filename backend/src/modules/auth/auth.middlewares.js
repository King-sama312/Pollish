import ApiError from "../../common/utils/api-error.js";
import ApiResponse from "../../common/utils/api-response.js";
import { verifyAccessToken } from "../../common/utils/jwt.utils.js";

export const authenticate = (req, res, next) => {
  const {accessToken} = req.cookies;
  const {refreshToken} = req.cookies;
  console.log(req.cookies)
  console.log("AccessToken :",accessToken)
  if(!accessToken){
   return next(ApiError.unauthorized("No token found"));
  }

  try {
    const payload = verifyAccessToken(accessToken);
    req.user = { id: payload.userId };
    next();
  } catch (err) {
    console.error("Token verification error:", err);
    if (err.name === "TokenExpiredError") {
      return next(ApiError.unauthorized("Token expired"));
    }
    return next(ApiError.unauthorized("Invalid token"));
  }
};
