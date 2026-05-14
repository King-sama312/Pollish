import * as controller from "./auth.controllers.js";
import { Router } from "express";
import validate from "../../common/middleware/validate.middleware.js"
import RegisterDto from "./dto/register.dto.js";
import LoginDto from "./dto/login.dto.js";
import { authenticate } from "./auth.middlewares.js";
const router = Router();

router.post("/register", validate(RegisterDto), controller.register);
router.post("/login", validate(LoginDto), controller.login);
router.post("/logout", controller.logout)

router.get("/me", authenticate, controller.getMe);
router.post("/refresh", controller.refresh)
export default router;