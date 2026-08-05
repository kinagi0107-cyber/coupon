/**
 * クーポン関連APIルート
 *
 * GET  /api/coupon              - 通常配布クーポン一覧を取得（有効期限内のみ）
 * GET  /api/coupon/status       - 端末の本日の利用状況を確認（全クーポン）
 * POST /api/coupon/verify-code  - シークレットコードを検証してクーポン情報を返す
 * POST /api/coupon/use          - クーポンを使用する（利用ログを保存）
 */
import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { getTodayJST } from "../lib/dateUtils";

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
const useSchema = z.object({
  fingerprint: z.string().min(1, "フィンガープリントは必須です").max(200),
  couponCode: z.string().min(1, "クーポンコードは必須です").max(100),
  couponTitle: z.string().min(1, "クーポン名は必須です").max(200),
});

const statusSchema = z.object({
  fingerprint: z.string().min(1, "フィンガープリントは必須です").max(200),
});

const verifyCodeSchema = z.object({
  secretCode: z.string().min(1, "コードを入力してください").max(100),
  fingerprint: z.string().min(1).max(200),
});

// ===== ヘルパー =====

/** coupon.json を読み込んで配列で返す */
function loadCoupons(): CouponData[] {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const data = require("../../shared/coupon.json");
  return Array.isArray(data) ? data : [data];
}

/** 有効期限チェック（YYYY-MM-DD 形式、当日23:59まで有効） */
function isExpired(expires: string): boolean {
  const today = getTodayJST();
  return today > expires;
}

// ===== エンドポイント =====

/**
 * GET /api/coupon
 * 通常配布クーポン（type: "public"）のうち有効期限内のものを返す
 * secretCode・maxUses は除外して返す（セキュリティ上）
 */
router.get("/", (_req: Request, res: Response) => {
  try {
    const coupons = loadCoupons();
    const publicCoupons = coupons
      .filter((c) => c.type === "public" && !isExpired(c.expires))
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(({ secretCode: _s, maxUses: _m, ...rest }) => rest);

    res.json({ coupons: publicCoupons });
  } catch (err) {
    console.error("クーポンデータ読み込みエラー:", err);
    res.status(500).json({ error: "クーポン情報の取得に失敗しました" });
  }
});

/**
 * GET /api/coupon/status
 * 指定端末の本日の利用状況を全クーポン分まとめて返す
 * クエリパラメータ: fingerprint
 * レスポンス: { usedMap: { [couponCode]: usedAt } }
 */
router.get("/status", async (req: Request, res: Response) => {
  try {
    const parseResult = statusSchema.safeParse({
      fingerprint: req.query.fingerprint,
    });
    if (!parseResult.success) {
      res.status(400).json({ error: "フィンガープリントが不正です" });
      return;
    }

    const { fingerprint } = parseResult.data;
    const today = getTodayJST();

    // 本日の利用ログを全件取得
    const logs = await prisma.couponLog.findMany({
      where: { fingerprint, usedDate: today },
      select: { couponCode: true, usedAt: true },
    });

    // couponCode → usedAt のマップを返す
    const usedMap: Record<string, string> = {};
    for (const log of logs) {
      usedMap[log.couponCode] = log.usedAt.toISOString();
    }

    res.json({ usedMap });
  } catch (err) {
    console.error("ステータス確認エラー:", err);
    res.status(500).json({ error: "利用状況の確認に失敗しました" });
  }
});

/**
 * POST /api/coupon/verify-code
 * シークレットコードを検証してコード入力クーポンを返す
 * Body: { secretCode: string, fingerprint: string }
 */
router.post("/verify-code", async (req: Request, res: Response) => {
  try {
    const parseResult = verifyCodeSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0]?.message || "入力エラー" });
      return;
    }

    const { secretCode, fingerprint } = parseResult.data;
    const coupons = loadCoupons();

    // シークレットコードが一致するクーポンを検索（有効期限内）
    const matched = coupons.find(
      (c) => c.type === "code" && c.secretCode === secretCode && !isExpired(c.expires)
    );

    if (!matched) {
      // 有効期限切れのコードかどうかも確認
      const expired = coupons.find(
        (c) => c.type === "code" && c.secretCode === secretCode && isExpired(c.expires)
      );
      if (expired) {
        res.status(410).json({ error: "このクーポンコードは有効期限が切れています" });
      } else {
        res.status(404).json({ error: "クーポンコードが正しくありません" });
      }
      return;
    }

    // 利用人数上限チェック
    if (matched.maxUses != null) {
      const counter = await prisma.codeUseCount.findUnique({
        where: { couponCode: matched.code },
      });
      const currentCount = counter?.useCount ?? 0;
      if (currentCount >= matched.maxUses) {
        res.status(410).json({ error: "このクーポンの利用上限に達しています" });
        return;
      }
    }

    // 本日の利用済みチェック
    const today = getTodayJST();
    const existingLog = await prisma.couponLog.findUnique({
      where: {
        fingerprint_couponCode_usedDate: {
          fingerprint,
          couponCode: matched.code,
          usedDate: today,
        },
      },
    });

    // secretCode は返さない
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { secretCode: _s, ...couponWithoutSecret } = matched;

    res.json({
      coupon: couponWithoutSecret,
      alreadyUsed: !!existingLog,
      usedAt: existingLog?.usedAt?.toISOString() ?? null,
    });
  } catch (err) {
    console.error("コード検証エラー:", err);
    res.status(500).json({ error: "コードの検証に失敗しました" });
  }
});

/**
 * POST /api/coupon/use
 * クーポンを使用する（利用ログ保存 + カウンター更新）
 * Body: { fingerprint, couponCode, couponTitle }
 */
router.post("/use", async (req: Request, res: Response) => {
  try {
    const parseResult = useSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0]?.message || "入力エラー" });
      return;
    }

    const { fingerprint, couponCode, couponTitle } = parseResult.data;
    const today = getTodayJST();

    // クーポンの存在・有効期限チェック
    const coupons = loadCoupons();
    const targetCoupon = coupons.find((c) => c.code === couponCode);

    if (!targetCoupon) {
      res.status(404).json({ error: "クーポンが見つかりません" });
      return;
    }

    if (isExpired(targetCoupon.expires)) {
      res.status(410).json({ error: "このクーポンは有効期限が切れています" });
      return;
    }

    // コード入力クーポンの場合は上限チェック
    if (targetCoupon.type === "code" && targetCoupon.maxUses != null) {
      const counter = await prisma.codeUseCount.findUnique({
        where: { couponCode },
      });
      const currentCount = counter?.useCount ?? 0;
      if (currentCount >= targetCoupon.maxUses) {
        res.status(410).json({ error: "このクーポンの利用上限に達しています" });
        return;
      }
    }

    // 二重利用チェック（DBで判定）
    const existingLog = await prisma.couponLog.findUnique({
      where: {
        fingerprint_couponCode_usedDate: {
          fingerprint,
          couponCode,
          usedDate: today,
        },
      },
    });

    if (existingLog) {
      res.status(409).json({
        error: "本日このクーポンは使用済みです",
        used: true,
        usedAt: existingLog.usedAt,
      });
      return;
    }

    // トランザクションで利用ログ保存 + カウンター更新
    const result = await prisma.$transaction(async (tx) => {
      const log = await tx.couponLog.create({
        data: { fingerprint, couponCode, couponTitle, usedDate: today },
      });

      // コード入力クーポンの場合はカウンターをインクリメント
      if (targetCoupon.type === "code") {
        await tx.codeUseCount.upsert({
          where: { couponCode },
          update: { useCount: { increment: 1 } },
          create: { couponCode, useCount: 1 },
        });
      }

      return log;
    });

    res.status(201).json({
      success: true,
      message: "クーポンを使用しました",
      usedAt: result.usedAt,
    });
  } catch (err: unknown) {
    // ユニーク制約違反（同時リクエストによる二重送信）
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      res.status(409).json({ error: "本日このクーポンは使用済みです", used: true });
      return;
    }
    console.error("クーポン使用エラー:", err);
    res.status(500).json({ error: "クーポンの使用に失敗しました" });
  }
});

export default router;
