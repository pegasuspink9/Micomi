import express from "express";
import * as ShopController from "./shop.controller";

const router = express.Router();

router.get("/", ShopController.getAllShop);
router.get("/:id", ShopController.getShopById);
router.post("/", ShopController.createShop);
router.put("/:id", ShopController.updateShop);
router.delete("/:id", ShopController.deleteShop);

export default router;
