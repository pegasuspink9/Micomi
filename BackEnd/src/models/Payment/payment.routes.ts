import express from "express";
import * as PaymentService from "./payment.service";
import {
  authenticate,
  requirePlayer,
} from "../../../middleware/auth.middleware";

const router = express.Router();

router.post(
  "/verify",
  authenticate,
  requirePlayer,
  PaymentService.verifyPurchase,
);

export default router;
