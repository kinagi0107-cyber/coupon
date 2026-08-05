/**
 * 管理者APIルート
 *
 * POST /api/admin/login    - 管理者ログイン（JWTトークン発行）
 * GET  /api/admin/history  - 利用履歴一覧取得（認証必須）
 * GET  /api/admin/today    - 本日の利用人数取得（認証必須）
 * GET  /api/admin/coupons  - 全クーポン情報取得（警告情報付き、認証必須）
 */

import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import prisma from "../lib/prisma";
import { authenticateToken } from "../middleware/auth";
import { getTodayJST, toJSTDateTimeString } from "../lib/dateUtils";

const router = Router();

// ===== 型定義 =====
interface CouponData {
  id: string;
  type: "public" | "code";
  title: string;
  code: string;
  description: string;
  expires: string;
  secretCode?: string;
  maxUses?: number | null;
}

// ===== バリデーションスキーマ =====
const loginSchema = z.object({
  username: z.string().min(1, "ユーザー名は必須です"),
  password: z.string().min(1, "パスワードは必須です"),
});

// ===== ヘルパー =====

/** coupon.json を読み込んで配列で返す */
function loadCoupons(): CouponData[] {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const data = require("../../shared/coupon.json");
  return Array.isArray(data) ? data : [data];
}

/** 有効期限チェック */
function isExpired(expires: string): boolean {
  const today = getTodayJST();
  return today > expires;
}

// ===== エンドポイント =====

/**
 * POST /api/admin/login
 * 管理者ログイン（JWTトークン発行）
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0]?.message || "入力エラー" });
      return;
    }

    const { username, password } = parseResult.data;
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const jwtSecret = process.env.JWT_SECRET;

    if (!adminUsername || !adminPassword || !jwtSecret) {
      console.error("管理者認証情報または JWT_SECRET が設定されていません");
      res.status(500).json({ error: "サーバー設定エラー" });
      return;
    }

    const isUsernameValid = username === adminUsername;
    const isPasswordValid = password === adminPassword;

    if (!isUsernameValid || !isPasswordValid) {
      res.status(401).json({ error: "ユーザー名またはパスワードが正しくありません" });
      return;
    }

    const token = jwt.sign(
      { username, role: "admin" },
      jwtSecret,
      { expiresIn: "24h" }
    );

    res.json({ success: true, token, message: "ログインしました" });
  } catch (err) {
    console.error("管理者ログインエラー:", err);
    res.status(500).json({ error: "ログイン処理に失敗しました" });
  }
});

/**
 * GET /api/admin/today
 * 本日の利用人数（クーポン別）を取得する（認証必須）
 */
router.get("/today", authenticateToken, async (_req: Request, res: Response) => {
  try {
    const today = getTodayJST();

    // 全体の利用件数
    const totalCount = await prisma.couponLog.count({
      where: { usedDate: today },
    });

    // クーポン別の利用件数
    const byCode = await prisma.couponLog.groupBy({
      by: ["couponCode", "couponTitle"],
      where: { usedDate: today },
      _count: { id: true },
    });

    const breakdown = byCode.map((item) => ({
      couponCode: item.couponCode,
      couponTitle: item.couponTitle,
      count: item._count.id,
    }));

    res.json({ date: today, count: totalCount, breakdown });
  } catch (err) {
    console.error("本日利用人数取得エラー:", err);
    res.status(500).json({ error: "利用人数の取得に失敗しました" });
  }
});

/**
 * GET /api/admin/history
 * 利用履歴一覧を取得する（認証必須）
 * 最新順で返す
 */
router.get("/history", authenticateToken, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const offset = parseInt(req.query.offset as string) || 0;

    const [logs, total] = await Promise.all([
      prisma.couponLog.findMany({
        orderBy: { usedAt: "desc" },
        take: limit,
        skip: offset,
        select: {
          id: true,
          fingerprint: true,
          couponCode: true,
          couponTitle: true,
          usedDate: true,
          usedAt: true,
        },
      }),
      prisma.couponLog.count(),
    ]);

    const formattedLogs = logs.map((log) => ({
      ...log,
      usedAtFormatted: toJSTDateTimeString(log.usedAt),
    }));

    res.json({ logs: formattedLogs, total, limit, offset });
  } catch (err) {
    console.error("利用履歴取得エラー:", err);
    res.status(500).json({ error: "利用履歴の取得に失敗しました" });
  }
});

/**
 * GET /api/admin/coupons
 * 全クーポン情報を取得する（認証必須）
 * 有効期限切れ・利用上限到達の警告情報付き
 */
router.get("/coupons", authenticateToken, async (_req: Request, res: Response) => {
  try {
    const coupons = loadCoupons();
    const today = getTodayJST();

    // コード入力クーポンの利用カウンターを取得
    const codeCoupons = coupons.filter((c) => c.type === "code");
    const counters = codeCoupons.length > 0
      ? await prisma.codeUseCount.findMany({
          where: {
            couponCode: { in: codeCoupons.map((c) => c.code) },
          },
        })
      : [];

    const counterMap: Record<string, number> = {};
    for (const counter of counters) {
      counterMap[counter.couponCode] = counter.useCount;
    }

    // クーポンごとに警告情報を付加
    const couponsWithStatus = coupons.map((coupon) => {
      const expired = today > coupon.expires;
      const useCount = counterMap[coupon.code] ?? 0;
      const limitReached =
        coupon.type === "code" &&
        coupon.maxUses != null &&
        useCount >= coupon.maxUses;

      return {
        ...coupon,
        // secretCode は管理画面では表示（管理者向け）
        isExpired: expired,
        isLimitReached: limitReached,
        useCount: coupon.type === "code" ? useCount : null,
        warnings: [
          ...(expired ? ["有効期限切れ"] : []),
          ...(limitReached ? ["利用上限に達しました"] : []),
        ],
      };
    });

    res.json({ coupons: couponsWithStatus });
  } catch (err) {
    console.error("クーポン情報取得エラー:", err);
    res.status(500).json({ error: "クーポン情報の取得に失敗しました" });
  }
});

export default router;
