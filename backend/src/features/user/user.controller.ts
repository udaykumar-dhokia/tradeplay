import type { Request, Response } from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import UserService from "./user.service";

const userService = new UserService();

/**
 * UserController
 * Handles HTTP requests for user profile, settings, and credentials.
 */
class UserController {
  /**
   * Returns the authenticated user's details and settings without the stored password.
   */
  me = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: ReasonPhrases.UNAUTHORIZED });
    }

    try {
      const profile = await userService.getProfileWithSettings(user.id);
      if (!profile) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json({ message: "User not found" });
      }

      return res.status(StatusCodes.OK).json(profile);
    } catch (error: any) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: error?.message || "Internal server error" });
    }
  };

  /**
   * Updates personal details: first_name, last_name, mobile
   */
  updateProfile = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: ReasonPhrases.UNAUTHORIZED });
    }

    const { first_name, last_name, mobile } = req.body;

    if (first_name !== undefined && String(first_name).trim().length === 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "First name cannot be empty" });
    }

    try {
      const updatedUser = await userService.updateProfile(user.id, {
        ...(first_name !== undefined && { first_name: String(first_name).trim() }),
        ...(last_name !== undefined && {
          last_name: last_name ? String(last_name).trim() : null,
        }),
        ...(mobile !== undefined && {
          mobile: mobile ? String(mobile).trim() : null,
        }),
      });

      return res.status(StatusCodes.OK).json(updatedUser);
    } catch (error: any) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: error?.message || "Failed to update profile" });
    }
  };

  /**
   * Changes the user's password after verifying current password
   */
  changePassword = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: ReasonPhrases.UNAUTHORIZED });
    }

    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Both current password and new password are required" });
    }

    try {
      await userService.changePassword(user.id, {
        current_password,
        new_password,
      });

      return res
        .status(StatusCodes.OK)
        .json({ message: "Password updated successfully" });
    } catch (error: any) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: error?.message || "Failed to update password" });
    }
  };

  /**
   * Gets platform settings (default_mode, theme)
   */
  getSettings = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: ReasonPhrases.UNAUTHORIZED });
    }

    try {
      const settings = await userService.getSettings(user.id);
      return res.status(StatusCodes.OK).json(settings);
    } catch (error: any) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: error?.message || "Failed to fetch settings" });
    }
  };

  /**
   * Updates platform settings (default_mode, theme)
   */
  updateSettings = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: ReasonPhrases.UNAUTHORIZED });
    }

    const { default_mode, theme } = req.body;

    if (
      default_mode !== undefined &&
      !["NORMAL", "ADVANCED"].includes(default_mode)
    ) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid default_mode. Must be NORMAL or ADVANCED" });
    }

    if (
      theme !== undefined &&
      !["LIGHT", "DARK", "SYSTEM"].includes(theme)
    ) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid theme. Must be LIGHT, DARK, or SYSTEM" });
    }

    try {
      const updatedSettings = await userService.updateSettings(user.id, {
        default_mode,
        theme,
      });

      return res.status(StatusCodes.OK).json(updatedSettings);
    } catch (error: any) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: error?.message || "Failed to update settings" });
    }
  };
}

export default new UserController();
