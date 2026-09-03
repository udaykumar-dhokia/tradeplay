import { prisma } from "../../lib/prisma";

export class WishlistService {
  async getWishlist(userId: string) {
    return prisma.wishlist.findMany({
      where: { userId },
      orderBy: { created_at: "desc" },
    });
  }

  async addToWishlist(
    userId: string,
    symbol: string,
    name: string,
    exchange: string,
  ) {
    return prisma.wishlist.create({
      data: {
        userId,
        symbol,
        name,
        exchange,
      },
    });
  }

  async removeFromWishlist(userId: string, symbol: string) {
    return prisma.wishlist.deleteMany({
      where: {
        userId,
        symbol,
      },
    });
  }

  async checkStatus(userId: string, symbol: string) {
    const item = await prisma.wishlist.findFirst({
      where: {
        userId,
        symbol,
      },
    });
    return !!item;
  }
}

export const wishlistService = new WishlistService();
