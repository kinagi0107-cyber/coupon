/**
 * 日付ユーティリティ
 * 日本時間（JST, UTC+9）での日付文字列生成を行う
 */

/**
 * 現在の日本時間での日付文字列を返す（YYYY-MM-DD形式）
 * 毎日0:00 JSTでリセット判定に使用する
 */
export function getTodayJST(): string {
  const now = new Date();
  // UTC+9 に変換
  const jstOffset = 9 * 60; // 分単位
  const jstTime = new Date(now.getTime() + jstOffset * 60 * 1000);
  return jstTime.toISOString().split("T")[0]; // YYYY-MM-DD
}

/**
 * 指定したDateオブジェクトを日本時間の日付文字列に変換する
 */
export function toJSTDateString(date: Date): string {
  const jstOffset = 9 * 60;
  const jstTime = new Date(date.getTime() + jstOffset * 60 * 1000);
  return jstTime.toISOString().split("T")[0];
}

/**
 * 指定したDateオブジェクトを日本時間の日時文字列に変換する
 */
export function toJSTDateTimeString(date: Date): string {
  const jstOffset = 9 * 60;
  const jstTime = new Date(date.getTime() + jstOffset * 60 * 1000);
  return jstTime.toISOString().replace("T", " ").substring(0, 19) + " JST";
}
