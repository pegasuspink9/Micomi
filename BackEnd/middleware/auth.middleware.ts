import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  id: number;
  role: string;
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    (req as any).user = { id: decoded.id, role: decoded.role };
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!(req as any).user || (req as any).user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admins only" });
  }
  next();
};

export const requirePlayer = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!(req as any).user || (req as any).user.role !== "player") {
    return res.status(403).json({ success: false, message: "Players only" });
  }
  next();
};
