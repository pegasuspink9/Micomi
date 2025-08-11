import { Request, Response } from "express";
import * as AdminService from "./admin.service";
import { successResponse, errorResponse } from "../../../utils/response";

/*GET all admins*/
export const getAllAdmins = async (req: Request, res: Response) => {
  try {
    const result = await AdminService.getAllAdmins();
    return successResponse(res, result, "Admins fetched successfully");
  } catch (error) {
    return errorResponse(res, null, "Failed to fetch admins");
  }
};

/*GET admin by ID*/
export const getAdminById = async (req: Request, res: Response) => {
  try {
    const result = await AdminService.getAdminById(Number(req.params.id));
    if (!result) {
      return errorResponse(res, null, "Admin not found", 404);
    }
    return successResponse(res, result, "Admin found");
  } catch (error) {
    return errorResponse(res, null, "Failed to fetch admin");
  }
};

/*POST an admin*/
export const createAdmin = async (req: Request, res: Response) => {
  try {
    const data = await AdminService.createAdmin(req.body);
    return successResponse(res, data, "Admin created successfully", 201);
  } catch (error) {
    return errorResponse(res, null, "Failed to create admin", 400);
  }
};

/*PUT an admin by ID*/
export const updateAdmin = async (req: Request, res: Response) => {
  try {
    const result = await AdminService.updateAdmin(
      Number(req.params.id),
      req.body
    );
    return successResponse(res, result, "Admin updated successfully");
  } catch (error) {
    return errorResponse(res, null, "Failed to update admin");
  }
};

/*DELETE an admin by ID*/
export const deleteAdmin = async (req: Request, res: Response) => {
  try {
    const result = await AdminService.deleteAdmin(Number(req.params.id));
    return successResponse(res, result, "Admin deleted successfully");
  } catch (error) {
    return errorResponse(res, null, "Failed to delete admin");
  }
};

/*LOGIN an admin*/
export const loginAdmin = async (req: Request, res: Response) => {
  try {
    const result = await AdminService.loginAdmin(req.body);
    if (!result) {
      return errorResponse(res, null, "Invalid credentials", 401);
    }
    return successResponse(res, result, "Login successful");
  } catch (error) {
    return errorResponse(res, null, "Failed to login");
  }
};
