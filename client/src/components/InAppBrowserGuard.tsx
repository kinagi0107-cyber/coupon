/**
 * アプリ内ブラウザ案内コンポーネント
 *
 * SNSアプリ内ブラウザからのアクセスを検知した場合に、
 * Safari / Chrome などの外部ブラウザで開くよう案内する画面を表示します。
 */

import { type ReactNode } from "react";
import { detectInAppBrowser } from "../lib/detectInAppBrowser";

interface Props {
  children: ReactNode;
}

export function InAppBrowserGuard({ children }: Props) {
  const { isInApp, appName, isIOS, isAndroid } = detectInAppBrowser();

  // アプリ内ブラウザでない場合はそのまま表示
  if (!isInApp) {
    return <>{children}</>;
  }

  // iOS / Android に応じた案内メッセージを生成
  const browserName = isIOS ? "Safari" : isAndroid ? "Chrome" : "外部ブラウザ";
  const currentUrl = window.location.href;

  return (
    <div className="inapp-guard-page">
      <div className="inapp-guard-container">
        {/* アイコン */}
        <div className="inapp-guard-icon">⚠️</div>

        {/* タイトル */}
        <h1 className="inapp-guard-title">
          外部ブラウザでご利用ください
        </h1>

        {/* 説明 */}
        <p className="inapp-guard-message">
          このクーポンは <strong>{appName}</strong> のアプリ内ブラウザでは
          正しく動作しません。
        </p>
        <p className="inapp-guard-message">
          <strong>{browserName}</strong> などの外部ブラウザで開いてください。
        </p>

        {/* 手順 */}
        <div className="inapp-guard-steps">
          <h2 className="inapp-guard-steps-title">開き方</h2>

          {isIOS && appName === "LINE" && (
            <ol className="inapp-guard-list">
              <li>右下の <strong>「…」</strong> メニューをタップ</li>
              <li><strong>「ブラウザで開く」</strong> を選択</li>
            </ol>
          )}

          {isIOS && appName === "Instagram" && (
            <ol className="inapp-guard-list">
              <li>右下の <strong>「…」</strong> メニューをタップ</li>
              <li><strong>「Safariで開く」</strong> を選択</li>
            </ol>
          )}

          {isAndroid && appName === "LINE" && (
            <ol className="inapp-guard-list">
              <li>右上の <strong>「…」</strong> メニューをタップ</li>
              <li><strong>「他のアプリで開く」</strong> を選択</li>
            </ol>
          )}

          {/* 汎用手順（上記以外） */}
          {!(
            (isIOS && appName === "LINE") ||
            (isIOS && appName === "Instagram") ||
            (isAndroid && appName === "LINE")
          ) && (
            <ol className="inapp-guard-list">
              <li>画面右上の <strong>「…」または「⋮」</strong> をタップ</li>
              <li><strong>「ブラウザで開く」</strong> または <strong>「Safariで開く」</strong> を選択</li>
            </ol>
          )}
        </div>

        {/* URLコピー用 */}
        <div className="inapp-guard-url-section">
          <p className="inapp-guard-url-label">
            または、以下のURLをコピーして{browserName}で開いてください：
          </p>
          <div className="inapp-guard-url-box">
            <span className="inapp-guard-url">{currentUrl}</span>
            <button
              className="inapp-guard-copy-btn"
              onClick={() => {
                navigator.clipboard.writeText(currentUrl).then(() => {
                  alert("URLをコピーしました！");
                }).catch(() => {
                  // クリップボードAPIが使えない場合は何もしない
                });
              }}
            >
              コピー
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
