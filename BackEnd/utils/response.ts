import { Response } from "express";

export const successResponse = <T>(
  res: Response,
  data: T,
  message = "Success",
  status = 200
) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};

export const errorResponse = (
  res: Response,
  error: unknown,
  message = "An error occurred",
  status = 500
) => {
  return res.status(status).json({
    success: false,
    message,
    error: error instanceof Error ? error.message : error,
  });
};
