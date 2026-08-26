import { prisma } from "../lib/prisma";
import type { TCreateUser } from "./dto/createUser.dto";

class AuthService {
  createUser = async (payload: TCreateUser) => {
    return prisma.user.create({
      data: {
        email: payload.email,
        first_name: payload.first_name,
        password: payload.password,
      },
    });
  };

  findUserByEmail = async (email: string) => {
    return prisma.user.findFirst({
      where: {
        email: email,
      },
    });
  };

  findUserById = async (id: string) => {
    return prisma.user.findFirst({
      where: {
        id: id,
      },
    });
  };
}

export default AuthService;
