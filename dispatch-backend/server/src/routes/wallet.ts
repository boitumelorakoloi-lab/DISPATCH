import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";

const router = Router();

// ── GET /wallet ───────────────────────────────────────────────────────────────

router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  const wallet = await prisma.wallet.findUnique({
    where: { userId: req.user!.id },
    select: { balance: true },
  });
  res.json(wallet ?? { balance: 0 });
});

// ── GET /wallet/transactions ──────────────────────────────────────────────────

router.get("/transactions", authenticate, async (req: AuthRequest, res: Response) => {
  const wallet = await prisma.wallet.findUnique({ where: { userId: req.user!.id } });
  if (!wallet) {
    res.json([]);
    return;
  }

  const transactions = await prisma.walletTransaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json(transactions);
});

// ── POST /wallet/deposit ──────────────────────────────────────────────────────

const depositSchema = z.object({
  amount: z.number().positive().max(10000),
  method: z.enum(["CARD", "ECOCASH", "MPESA"]),
  reference: z.string().optional(),
});

router.post("/deposit", authenticate, async (req: AuthRequest, res: Response) => {
  const parsed = depositSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { amount, method } = parsed.data;

  // In production: integrate payment gateway (Stripe, Flutterwave, etc.)
  // here we trust the request (demo). Add payment verification before going live.
  const wallet = await prisma.wallet.update({
    where: { userId: req.user!.id },
    data: {
      balance: { increment: amount },
      transactions: {
        create: {
          type: "DEPOSIT",
          amount,
          description: `Deposit via ${method}`,
        },
      },
    },
    select: { balance: true },
  });

  res.json({ balance: wallet.balance, deposited: amount });
});

// ── POST /wallet/withdraw ──────────────────────────────────────────────────────

const withdrawSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(["CARD", "ECOCASH", "MPESA"]),
});

router.post("/withdraw", authenticate, async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== "DRIVER") {
    res.status(403).json({ error: "Only drivers can withdraw" });
    return;
  }

  const parsed = withdrawSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { amount, method } = parsed.data;

  const wallet = await prisma.wallet.findUnique({ where: { userId: req.user!.id } });
  if (!wallet || Number(wallet.balance) < amount) {
    res.status(400).json({ error: "Insufficient balance" });
    return;
  }

  const updated = await prisma.wallet.update({
    where: { userId: req.user!.id },
    data: {
      balance: { decrement: amount },
      transactions: {
        create: {
          type: "WITHDRAWAL",
          amount,
          description: `Withdrawal to ${method}`,
        },
      },
    },
    select: { balance: true },
  });

  res.json({ balance: updated.balance, withdrawn: amount });
});

export default router;
