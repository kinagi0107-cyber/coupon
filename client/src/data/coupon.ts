/**
 * クーポンデータ定義ファイル
 *
 * このファイルを書き換えてGitHubへPushすると、
 * Renderが自動デプロイされ、新しいクーポンへ切り替わります。
 *
 * 管理画面の「新規クーポン作成」機能でコードを生成できます。
 */

export interface Coupon {
  /** クーポン名 */
  title: string;
  /** クーポンコード */
  code: string;
  /** クーポンの説明文 */
  description: string;
  /** 利用期限（YYYY-MM-DD形式） */
  expires: string;
  /** 補足事項（任意） */
  note?: string;
}

/**
 * 現在配布中のクーポン
 * ここを書き換えてGitHubへPushしてください
 */
export const coupon: Coupon = {
  title: "100円OFFクーポン",
  code: "WELCOME100",
  description: "ご来店ありがとうございます！本日限り、お会計から100円割引いたします。",
  expires: "2026-12-31",
  note: "※ 1日1回限定。他のクーポンとの併用不可。",
};
