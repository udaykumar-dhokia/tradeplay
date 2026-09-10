import { prisma } from "../../lib/prisma";
import { Prisma } from "../../../generated/prisma/client";

export default class TransactionsService {
  async trade(
    userId: string,
    data: {
      symbol: string;
      name: string;
      exchange: string;
      type: "BUY" | "SELL";
      quantity: number;
      price: number;
      positionId?: string;
    },
  ) {
    const portfolio = await prisma.portfolio.findFirst({
      where: { userId },
    });
    if (!portfolio) throw new Error("Portfolio not found");

    const totalAmount = new Prisma.Decimal(data.price * data.quantity);
    const priceDec = new Prisma.Decimal(data.price);

    return prisma.$transaction(async (tx) => {
      if (data.type === "BUY") {
        const currentBalance = await tx.portfolio.findUnique({
          where: { id: portfolio.id },
          select: { current_balance: true },
        });

        if (
          !currentBalance ||
          currentBalance.current_balance.lessThan(totalAmount)
        ) {
          throw new Error("Insufficient balance");
        }

        // deduct balance
        await tx.portfolio.update({
          where: { id: portfolio.id },
          data: { current_balance: { decrement: totalAmount } },
        });

        // record transaction
        const transaction = await tx.transactions.create({
          data: {
            portfolioId: portfolio.id,
            type: "BUY",
            symbol: data.symbol,
            name: data.name,
            exchange: data.exchange,
            total_shares: data.quantity,
            price: priceDec,
            total_amount: totalAmount,
          },
        });

        // create distinct position lot for every purchase
        await tx.position.create({
          data: {
            portfolioId: portfolio.id,
            symbol: data.symbol,
            name: data.name,
            exchange: data.exchange,
            quantity: data.quantity,
            average_price: priceDec,
            status: "OPEN",
          },
        });

        return transaction;
      } else {
        // SELL
        if (data.positionId) {
          // Specific lot sell (e.g. from Portfolio page)
          const position = await tx.position.findFirst({
            where: {
              id: data.positionId,
              portfolioId: portfolio.id,
              status: "OPEN",
            },
          });

          if (!position || position.quantity < data.quantity) {
            throw new Error("Insufficient shares in this position to sell");
          }

          await tx.portfolio.update({
            where: { id: portfolio.id },
            data: { current_balance: { increment: totalAmount } },
          });

          const buyPrice = new Prisma.Decimal(position.average_price);
          const priceDiff = priceDec.minus(buyPrice);
          const realizedPnl = priceDiff.mul(data.quantity);

          const transaction = await tx.transactions.create({
            data: {
              portfolioId: portfolio.id,
              type: "SELL",
              symbol: data.symbol,
              name: data.name,
              exchange: data.exchange,
              total_shares: data.quantity,
              price: priceDec,
              total_amount: totalAmount,
              realized_pnl: realizedPnl,
            },
          });

          const newQuantity = position.quantity - data.quantity;

          await tx.position.update({
            where: { id: position.id },
            data: {
              quantity: newQuantity,
              status: newQuantity === 0 ? "CLOSED" : "OPEN",
              closed_at: newQuantity === 0 ? new Date() : null,
            },
          });

          return transaction;
        } else {
          // General sell (e.g. from Trade page): apply FIFO across open positions
          const openPositions = await tx.position.findMany({
            where: {
              portfolioId: portfolio.id,
              symbol: data.symbol,
              status: "OPEN",
            },
            orderBy: { opened_at: "asc" },
          });

          const totalAvailable = openPositions.reduce(
            (sum, p) => sum + p.quantity,
            0,
          );
          if (totalAvailable < data.quantity) {
            throw new Error("Insufficient shares to sell");
          }

          await tx.portfolio.update({
            where: { id: portfolio.id },
            data: { current_balance: { increment: totalAmount } },
          });

          let sharesToSell = data.quantity;
          let totalRealizedPnl = new Prisma.Decimal(0);

          for (const pos of openPositions) {
            if (sharesToSell <= 0) break;

            const sellFromThis = Math.min(pos.quantity, sharesToSell);
            const buyPrice = new Prisma.Decimal(pos.average_price);
            const pnlForLot = priceDec.minus(buyPrice).mul(sellFromThis);
            totalRealizedPnl = totalRealizedPnl.plus(pnlForLot);

            const remainingQty = pos.quantity - sellFromThis;
            await tx.position.update({
              where: { id: pos.id },
              data: {
                quantity: remainingQty,
                status: remainingQty === 0 ? "CLOSED" : "OPEN",
                closed_at: remainingQty === 0 ? new Date() : null,
              },
            });

            sharesToSell -= sellFromThis;
          }

          const transaction = await tx.transactions.create({
            data: {
              portfolioId: portfolio.id,
              type: "SELL",
              symbol: data.symbol,
              name: data.name,
              exchange: data.exchange,
              total_shares: data.quantity,
              price: priceDec,
              total_amount: totalAmount,
              realized_pnl: totalRealizedPnl,
            },
          });

          return transaction;
        }
      }
    });
  }

  async getTransactions(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ) {
    const portfolio = await prisma.portfolio.findFirst({
      where: { userId },
    });
    if (!portfolio) throw new Error("Portfolio not found");

    const [transactions, totalCount] = await Promise.all([
      prisma.transactions.findMany({
        where: { portfolioId: portfolio.id },
        orderBy: { created_at: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.transactions.count({
        where: { portfolioId: portfolio.id },
      }),
    ]);

    return { transactions, totalCount };
  }

  async getPositions(userId: string) {
    const portfolio = await prisma.portfolio.findFirst({
      where: { userId },
    });
    if (!portfolio) throw new Error("Portfolio not found");

    return prisma.position.findMany({
      where: { portfolioId: portfolio.id, status: "OPEN" },
      orderBy: { opened_at: "desc" },
    });
  }
}
