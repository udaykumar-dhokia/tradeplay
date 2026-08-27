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

        // upsert position
        const existingPosition = await tx.position.findUnique({
          where: {
            portfolioId_symbol: {
              portfolioId: portfolio.id,
              symbol: data.symbol,
            },
          },
        });

        if (existingPosition) {
          const oldTotal = existingPosition.average_price.mul(
            existingPosition.quantity,
          );
          const newTotalAmount = oldTotal.plus(totalAmount);
          const newQuantity = existingPosition.quantity + data.quantity;
          const newAvgPrice = newTotalAmount.dividedBy(newQuantity);

          await tx.position.update({
            where: { id: existingPosition.id },
            data: {
              quantity: newQuantity,
              average_price: newAvgPrice,
              status: "OPEN",
              closed_at: null,
            },
          });
        } else {
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
        }

        return transaction;
      } else {
        // SELL
        const existingPosition = await tx.position.findUnique({
          where: {
            portfolioId_symbol: {
              portfolioId: portfolio.id,
              symbol: data.symbol,
            },
          },
        });

        if (!existingPosition || existingPosition.quantity < data.quantity) {
          throw new Error("Insufficient shares to sell");
        }

        await tx.portfolio.update({
          where: { id: portfolio.id },
          data: { current_balance: { increment: totalAmount } },
        });

        const avgPrice = new Prisma.Decimal(existingPosition.average_price);
        const priceDiff = priceDec.minus(avgPrice);
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

        const newQuantity = existingPosition.quantity - data.quantity;

        await tx.position.update({
          where: { id: existingPosition.id },
          data: {
            quantity: newQuantity,
            status: newQuantity === 0 ? "CLOSED" : "OPEN",
            closed_at: newQuantity === 0 ? new Date() : null,
          },
        });

        return transaction;
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
