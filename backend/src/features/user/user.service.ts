import { prisma } from "../../lib/prisma";
import Hash from "../../utils/hash.util";
import type { TUpdateProfile } from "./dto/updateProfile.dto";
import type { TChangePassword } from "./dto/changePassword.dto";
import type { TUpdateUserSettings } from "./dto/userSettings.dto";

const hash = new Hash();

class UserService {
  getProfileWithSettings = async (userId: string) => {
    let user = await prisma.user.findFirst({
      where: { id: userId },
      include: {
        settings: true,
      },
    });

    if (!user) return null;

    if (!user.settings) {
      const defaultSettings = await prisma.userSettings.create({
        data: {
          userId: user.id,
          default_mode: "NORMAL",
          theme: "SYSTEM",
        },
      });
      user = {
        ...user,
        settings: defaultSettings,
      };
    }

    const { password, ...userDetails } = user;
    return userDetails;
  };

  updateProfile = async (userId: string, payload: TUpdateProfile) => {
    if (payload.mobile) {
      const existingMobileUser = await prisma.user.findFirst({
        where: {
          mobile: payload.mobile,
          NOT: { id: userId },
        },
      });
      if (existingMobileUser) {
        throw new Error("Mobile number is already in use by another account");
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(payload.first_name !== undefined && { first_name: payload.first_name }),
        ...(payload.last_name !== undefined && { last_name: payload.last_name }),
        ...(payload.mobile !== undefined && { mobile: payload.mobile }),
      },
      include: {
        settings: true,
      },
    });

    const { password, ...userDetails } = updatedUser;
    return userDetails;
  };

  changePassword = async (userId: string, payload: TChangePassword) => {
    const user = await prisma.user.findFirst({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const isMatch = await hash.compare(payload.current_password, user.password);
    if (!isMatch) {
      throw new Error("Incorrect current password");
    }

    if (!payload.new_password || payload.new_password.length < 6) {
      throw new Error("New password must be at least 6 characters long");
    }

    const encodedNewPassword = await hash.encode(payload.new_password);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: encodedNewPassword,
      },
    });

    return true;
  };

  getSettings = async (userId: string) => {
    let settings = await prisma.userSettings.findFirst({
      where: { userId },
    });

    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          userId,
          default_mode: "NORMAL",
          theme: "SYSTEM",
        },
      });
    }

    return settings;
  };

  updateSettings = async (userId: string, payload: TUpdateUserSettings) => {
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        default_mode: payload.default_mode || "NORMAL",
        theme: payload.theme || "SYSTEM",
      },
      update: {
        ...(payload.default_mode && { default_mode: payload.default_mode }),
        ...(payload.theme && { theme: payload.theme }),
      },
    });

    return settings;
  };
}

export default UserService;
