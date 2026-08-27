import type { TUser } from "../features/user/dto/user.dto";

declare global {
  namespace Express {
    interface Request {
      user?: TUser;
    }
  }
}

export {};
