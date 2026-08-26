import type { Request, Response } from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";

/**
 * UserController
 * Handles HTTP requests for authenticated user information.
 */
class UserController {
  /**
   * Returns the authenticated user's details without the stored password.
   *
   * @param {Request} req - Express request object containing the authenticated user
   * @param {Response} res - Express response object
   * @returns {Response} JSON response containing user details or an unauthorized message
   *
   * @description
   * - Checks whether an authenticated user is attached to the request
   * - Excludes the user's password from the response
   * - Returns the remaining user details with a successful response
   *
   * @throws Returns 401 when no authenticated user is present
   */
  me = (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: ReasonPhrases.UNAUTHORIZED });
    }

    const { password, ...userDetails } = user;

    return res.status(StatusCodes.OK).json(userDetails);
  };
}

export default new UserController();
