import type { Request, Response } from "express";
import { StatusCodes, ReasonPhrases } from "http-status-codes";
import { wishlistService } from "./wishlist.service";

/**
 * WishlistController
 * Handles wishlist retrieval and updates for the authenticated user.
 */
class WishlistController {
  /**
   * Returns the authenticated user's wishlist.
   *
   * @param {Request} req - Express request object containing the authenticated user
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response containing the user's wishlist or an error message
   *
   * @description
   * - Checks whether an authenticated user is attached to the request
   * - Retrieves the user's wishlist from the wishlist service
   *
   * @throws Returns 401 when no authenticated user is present
   * @throws Returns 500 when wishlist retrieval fails
   */
  getWishlist = async (req: Request, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ message: ReasonPhrases.UNAUTHORIZED });
      }

      const wishlist = await wishlistService.getWishlist(user.id);
      return res.json(wishlist);
    } catch (error) {
      console.error("Get wishlist failed:", error);
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: ReasonPhrases.INTERNAL_SERVER_ERROR });
    }
  };

  /**
   * Adds a stock to the authenticated user's wishlist.
   *
   * @param {Request} req - Express request object containing the authenticated user and stock details
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response containing the created wishlist item or an error message
   *
   * @description
   * - Checks whether an authenticated user is attached to the request
   * - Validates that symbol, name, and exchange are provided
   * - Prevents duplicate wishlist entries for the same stock
   * - Persists the stock to the user's wishlist
   *
   * @throws Returns 401 when no authenticated user is present
   * @throws Returns 400 when required stock fields are missing
   * @throws Returns 409 when the stock is already in the wishlist
   * @throws Returns 500 when the wishlist update fails
   */
  addToWishlist = async (req: Request, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ message: ReasonPhrases.UNAUTHORIZED });
      }

      const { symbol, name, exchange } = req.body;
      if (!symbol || !name || !exchange) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "Symbol, name, and exchange are required" });
      }

      // Check if already wishlisted
      const isWishlisted = await wishlistService.checkStatus(user.id, symbol);
      if (isWishlisted) {
        return res
          .status(StatusCodes.CONFLICT)
          .json({ message: "Stock is already in wishlist" });
      }

      const item = await wishlistService.addToWishlist(
        user.id,
        symbol,
        name,
        exchange,
      );
      return res.status(StatusCodes.CREATED).json(item);
    } catch (error) {
      console.error("Add to wishlist failed:", error);
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: ReasonPhrases.INTERNAL_SERVER_ERROR });
    }
  };

  /**
   * Removes a stock from the authenticated user's wishlist.
   *
   * @param {Request} req - Express request object containing the authenticated user and stock symbol
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response confirming removal or an error message
   *
   * @description
   * - Checks whether an authenticated user is attached to the request
   * - Validates that a stock symbol is provided
   * - Removes the matching symbol from the user's wishlist
   *
   * @throws Returns 401 when no authenticated user is present
   * @throws Returns 400 when no symbol is supplied
   * @throws Returns 500 when removing the item fails
   */
  removeFromWishlist = async (req: Request, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ message: ReasonPhrases.UNAUTHORIZED });
      }

      const symbol = String(req.params.symbol || "").toUpperCase();
      if (!symbol) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "Symbol is required" });
      }

      await wishlistService.removeFromWishlist(user.id, symbol);
      return res
        .status(StatusCodes.OK)
        .json({ message: "Removed from wishlist" });
    } catch (error) {
      console.error("Remove from wishlist failed:", error);
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: ReasonPhrases.INTERNAL_SERVER_ERROR });
    }
  };

  /**
   * Checks whether a stock is already present in the authenticated user's wishlist.
   *
   * @param {Request} req - Express request object containing the authenticated user and stock symbol
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response indicating whether the symbol is wishlisted
   *
   * @description
   * - Checks whether an authenticated user is attached to the request
   * - Validates that a stock symbol is provided
   * - Queries the wishlist service for the current status of the stock
   *
   * @throws Returns 401 when no authenticated user is present
   * @throws Returns 400 when no symbol is supplied
   * @throws Returns 500 when the status check fails
   */
  checkStatus = async (req: Request, res: Response) => {
    try {
      const userId = req.user;
      if (!userId) {
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ message: ReasonPhrases.UNAUTHORIZED });
      }

      const symbol = String(req.params.symbol || "").toUpperCase();
      if (!symbol) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "Symbol is required" });
      }

      const isWishlisted = await wishlistService.checkStatus(userId.id, symbol);
      return res.json({ isWishlisted });
    } catch (error) {
      console.error("Check wishlist status failed:", error);
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: ReasonPhrases.INTERNAL_SERVER_ERROR });
    }
  };
}

export default new WishlistController();
