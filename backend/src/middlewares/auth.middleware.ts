import type { Request, Response, NextFunction } from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import Jwt, { type IJwtPayload } from "../utils/jwt.util";
import AuthService from "../features/auth/auth.service";

const jwt = new Jwt();
const authService = new AuthService();

/**
 * Authenticates requests using the JWT stored in the token cookie.
 * Verifies the token, loads the associated user, and attaches the user to the request.
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express callback that continues to the next middleware
 * @returns {Promise<void | Response>} Continues the request or returns an unauthorized response
 *
 * @description
 * - Reads the JWT from the token cookie
 * - Verifies the token payload
 * - Finds the corresponding user
 * - Attaches the user to `req.user`
 *
 * @throws Returns 401 when the token is missing, invalid, or its user cannot be found
 */
const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: ReasonPhrases.UNAUTHORIZED });
    }

    const payload: IJwtPayload = await jwt.verify(token);

    if (!payload) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: ReasonPhrases.UNAUTHORIZED });
    }

    const user = await authService.findUserById(payload.userId);

    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: ReasonPhrases.UNAUTHORIZED });
    }

    req.user = user;

    next();
  } catch {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: ReasonPhrases.UNAUTHORIZED });
  }
};

export default authMiddleware;
