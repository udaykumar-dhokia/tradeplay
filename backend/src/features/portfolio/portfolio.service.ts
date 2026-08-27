import { prisma } from "../../lib/prisma";

class PortfolioService {
  initialize = (userId: string) => {
    return prisma.portfolio.create({
      data: {
        userId: userId,
      },
    });
  };

  current_balance = async (userId: string) => {
    const user = await prisma.portfolio.findFirst({
      where: { userId: userId },
    });
    if (!user) {
      return;
    }
    return user.current_balance;
  };

  original_balance = async (userId: string) => {
    const user = await prisma.portfolio.findFirst({
      where: { userId: userId },
    });
    if (!user) {
      return;
    }
    return user.original_balance;
  };
}

export default PortfolioService;
