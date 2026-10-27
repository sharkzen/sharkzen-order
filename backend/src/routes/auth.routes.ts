import type { FastifyPluginAsync } from "fastify";
import { authController } from "../controllers/auth.controller.js";

/** จำกัดจำนวนครั้งต่อ IP เพื่อกันเดารหัส/ยิงอีเมลรัว */
const limit = (max: number) => ({ config: { rateLimit: { max, timeWindow: "1 minute" } } });

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/register", limit(5), authController.register);
  app.post("/verify-email", limit(10), authController.verifyEmail);
  app.post("/resend-otp", limit(5), authController.resendOtp);
  app.post("/login", limit(10), authController.login);
  app.post("/logout", authController.logout);
  app.get("/me", { onRequest: [app.authenticate] }, authController.me);
  app.put("/plan", { onRequest: [app.authenticate] }, authController.selectPlan);
  app.post("/forgot-password", limit(5), authController.forgotPassword);
  app.post("/reset-password", limit(10), authController.resetPassword);
};
