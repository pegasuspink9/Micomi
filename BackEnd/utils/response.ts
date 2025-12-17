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

export const successShopResponse = <T>(
  res: Response,
  data: T,
  message = "Success",
  status = 200
) => {
  const responseData = {
    message,
    ...((data as object) || {}),
  };

  return res.status(status).json({
    success: true,
    data: responseData,
  });
};

export const errorShopResponse = (
  res: Response,
  errorDetails: unknown,
  message = "An error occurred",
  status = 500
) => {
  const responseData: { message: string; error?: string } = { message };
  if (errorDetails) {
    responseData.error =
      errorDetails instanceof Error
        ? errorDetails.message
        : String(errorDetails);
  }

  return res.status(status).json({
    success: false,
    data: responseData,
  });
};
