/**
 * クーポンデータ定義ファイル
 *
 * このファイルを書き換えてGitHubへPushすると、
 * Renderが自動デプロイされ、新しいクーポンへ切り替わります。
 */

export interface Coupon {
  title: string;
  code: string;
  description: string;
  expires: string;
  note?: string;
}

/**
 * 現在配布中のクーポン
 */
export const coupon: Coupon = {
  title: "100%off",
  code: "SUMMER",
  description: "景気がいいね",
  expires: "2026-08-05",
};
