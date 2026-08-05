/**
 * ブラウザフィンガープリント取得フック
 * FingerprintJS を使用して端末を識別するIDを生成する
 */

import { useState, useEffect } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

interface FingerprintState {
  fingerprint: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * FingerprintJS でブラウザフィンガープリントを取得するカスタムフック
 * @returns フィンガープリントID、ローディング状態、エラー
 */
export function useFingerprint(): FingerprintState {
  const [state, setState] = useState<FingerprintState>({
    fingerprint: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    const getFingerprint = async () => {
      try {
        // FingerprintJS エージェントを初期化
        const fp = await FingerprintJS.load();
        // フィンガープリントを取得
        const result = await fp.get();
        
        if (mounted) {
          setState({
            fingerprint: result.visitorId,
            loading: false,
            error: null,
          });
        }
      } catch (err) {
        console.error("フィンガープリント取得エラー:", err);
        if (mounted) {
          setState({
            fingerprint: null,
            loading: false,
            error: "端末IDの取得に失敗しました",
          });
        }
      }
    };

    getFingerprint();

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}
