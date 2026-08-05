/**
 * SNSアプリ内ブラウザ検知ユーティリティ
 *
 * LINE、Instagram、Facebook、X（Twitter）、TikTok などの
 * アプリ内ブラウザを検知し、外部ブラウザへの誘導を促します。
 */

export interface InAppBrowserInfo {
  /** アプリ内ブラウザかどうか */
  isInApp: boolean;
  /** 検知されたアプリ名（例: "LINE", "Instagram"） */
  appName: string | null;
  /** iOS端末かどうか */
  isIOS: boolean;
  /** Android端末かどうか */
  isAndroid: boolean;
}

/**
 * ユーザーエージェントを解析してアプリ内ブラウザを検知する
 */
export function detectInAppBrowser(): InAppBrowserInfo {
  const ua = navigator.userAgent || "";

  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);

  // LINE アプリ内ブラウザ
  if (/Line\//i.test(ua)) {
    return { isInApp: true, appName: "LINE", isIOS, isAndroid };
  }

  // Instagram アプリ内ブラウザ
  if (/Instagram/i.test(ua)) {
    return { isInApp: true, appName: "Instagram", isIOS, isAndroid };
  }

  // Facebook アプリ内ブラウザ
  if (/FBAN|FBAV|FB_IAB|FB4A|FBIOS/i.test(ua)) {
    return { isInApp: true, appName: "Facebook", isIOS, isAndroid };
  }

  // X（Twitter）アプリ内ブラウザ
  if (/TwitterAndroid|TwitteriPhone/i.test(ua)) {
    return { isInApp: true, appName: "X（Twitter）", isIOS, isAndroid };
  }

  // TikTok アプリ内ブラウザ
  if (/musical_ly|TikTok/i.test(ua)) {
    return { isInApp: true, appName: "TikTok", isIOS, isAndroid };
  }

  // Snapchat アプリ内ブラウザ
  if (/Snapchat/i.test(ua)) {
    return { isInApp: true, appName: "Snapchat", isIOS, isAndroid };
  }

  // Yahoo! アプリ内ブラウザ
  if (/YJApp/i.test(ua)) {
    return { isInApp: true, appName: "Yahoo!アプリ", isIOS, isAndroid };
  }

  return { isInApp: false, appName: null, isIOS, isAndroid };
}
