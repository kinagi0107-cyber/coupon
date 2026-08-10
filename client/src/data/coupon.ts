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
    id: "coupon-qbuajq",
    type: "public",
    title: "お盆の期間、毎日使える！お会計1000円以上で100円OFFクーポン！",
    code: "OBON100OFF",
    description: "お盆の期間、なんと毎日使えちゃいます！
※利用は一日一回までで、他クーポンとの併用はできません。
※クーポンを使用する際はお会計の際に従業員に画面をお見せください。会計前に使用済みのボタンを押してしまった場合、使用することが出来ません。
※金券・金プラには使用できません。",
    expires: "2026-08-16",
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
