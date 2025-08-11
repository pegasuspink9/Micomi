import { Request, Response } from "express";
import * as ShopService from "./shop.service";
import { errorResponse, successResponse } from "../../../utils/response";

/* GET all shops */
export const getAllShop = async (req: Request, res: Response) => {
  try {
    const shops = await ShopService.getAllShop();
    return successResponse(res, shops, "Shops fetched");
  } catch (error) {
    return errorResponse(res, null, "Shops not found", 404);
  }
};

/* GET a shop by ID */
export const getShopById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const shop = await ShopService.getShopById(id);
    return successResponse(res, shop, "Shop found");
  } catch (error) {
    return errorResponse(res, null, "Shop not found", 404);
  }
};

/* POST a shop */
export const createShop = async (req: Request, res: Response) => {
  try {
    const data = await ShopService.createShop(req.body);
    return successResponse(res, data, "Shop created", 201);
  } catch (error) {
    return errorResponse(res, null, "Failed to create shop", 400);
  }
};

/* PUT a shop by ID */
export const updateShop = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const shop = await ShopService.updateShop(id, req.body);
    return successResponse(res, shop, "Shop updated");
  } catch (error) {
    return errorResponse(res, null, "Failed to update shop", 400);
  }
};

/* DELETE a shop by ID */
export const deleteShop = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await ShopService.deleteShop(id);
    return successResponse(res, null, "Shop deleted");
  } catch (error) {
    return errorResponse(res, null, "Failed to delete shop", 400);
  }
};
