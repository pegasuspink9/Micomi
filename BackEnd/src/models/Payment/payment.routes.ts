import express from "express";
import * as PaymentService from "./payment.service";
import {
  authenticate,
  requirePlayer,
} from "../../../middleware/auth.middleware";
import { purchaseLimiter } from "../../../middleware/rateLimit.middleware";

const router = express.Router();

router.post(
  "/verify",
  authenticate,
  requirePlayer,
  purchaseLimiter,
  PaymentService.verifyPurchase,
);

export default router;
