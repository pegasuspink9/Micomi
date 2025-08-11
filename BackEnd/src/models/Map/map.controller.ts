import { Request, Response } from "express";
import * as MapService from "./map.service";
import { successResponse, errorResponse } from "../../../utils/response";

/* GET all maps */
export const getAllMaps = async (req: Request, res: Response) => {
  const maps = await MapService.getAllMaps();
  return successResponse(res, maps, "All maps fetched");
};

/* GET a map by ID */
export const getMapById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const map = await MapService.getMapById(id);
  if (!map) return errorResponse(res, null, "Map not found", 404);
  return successResponse(res, map, "Map found");
};

/* POST a map */
export const createMap = async (req: Request, res: Response) => {
  try {
    const data = await MapService.createMap(req.body);
    return successResponse(res, data, "Map created", 201);
  } catch (err) {
    return errorResponse(res, null, "Failed to create map", 400);
  }
};

/* PUT a map by ID */
export const updateMap = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const map = await MapService.updateMap(id, req.body);
    return successResponse(res, map, "Map updated");
  } catch (err) {
    return errorResponse(res, null, "Failed to update map", 400);
  }
};

/* DELETE a map by ID */
export const deleteMap = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await MapService.deleteMap(id);
    return successResponse(res, null, "Map deleted");
  } catch (err) {
    return errorResponse(res, null, "Failed to delete map", 400);
  }
};
