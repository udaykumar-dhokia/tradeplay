import type { TUser } from "../user/dto/user.dto";

declare global {
  namespace Express {
    interface Request {
      user?: TUser;
    }
  }
}

export {};
