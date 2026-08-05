/**
 * クーポン定義ファイル
 *
 * このファイルを書き換えてGitHubへPushすると、
 * Renderが自動デプロイして新しいクーポンへ切り替わります。
 *
 * ■ クーポンの種類
 *   type: "public"  → 通常配布クーポン（サイトアクセスで全員に表示）
 *   type: "code"    → コード入力クーポン（正しいsecretCodeを入力した人だけに表示）
 *
 * ■ フィールド説明
 *   id          : 一意のID（半角英数字、変更不可）
 *   type        : "public" または "code"
 *   title       : クーポン名（管理画面・利用履歴に表示）
 *   code        : クーポンコード（使用済み判定のキー、半角英数字推奨）
 *   description : 説明文
 *   expires     : 有効期限（YYYY-MM-DD形式、この日の23:59まで有効）
 *   secretCode  : コード入力クーポンのみ必要（ユーザーが入力するコード）
 *   maxUses     : コード入力クーポンのみ（利用人数の上限、null で無制限）
 */

export interface Coupon {
  id: string;
  type: "public" | "code";
  title: string;
  code: string;
  description: string;
  expires: string;
  secretCode?: string;
  maxUses?: number | null;
}

export const coupons: Coupon[] = [
  // ===== 通常配布クーポン =====
  {
    id: "coupon-001",
    type: "public",
    title: "100円OFFクーポン",
    code: "DISCOUNT100",
    description: "お会計から100円引き！",
    expires: "2026-12-31",
  },
  {
    id: "coupon-mgm1bg",
    type: "public",
    title: "100",
    code: "natsu",
    description: "100",
    expires: "2026-08-03",
  },

  // ===== コード入力クーポン =====
  {
    id: "coupon-code-001",
    type: "code",
    title: "会員限定500円OFFクーポン",
    code: "MEMBER500",
    description: "会員様限定！お会計から500円引き！",
    expires: "2026-12-31",
    secretCode: "MEMBER2026",
    maxUses: 100,
  },
];
