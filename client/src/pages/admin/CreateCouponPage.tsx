/**
 * 管理画面 - 新規クーポン作成ページ
 *
 * Render Free では永続保存できないため、
 * GitHubへ貼り付けるためのコード生成機能として実装
 */

import { useState, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";

interface CouponForm {
  title: string;
  code: string;
  description: string;
  expires: string;
  note: string;
}

export default function CreateCouponPage() {
  const [form, setForm] = useState<CouponForm>({
    title: "",
    code: "",
    description: "",
    expires: "",
    note: "",
  });
  const [generatedTs, setGeneratedTs] = useState<string>("");
  const [generatedJson, setGeneratedJson] = useState<string>("");
  const tsRef = useRef<HTMLPreElement>(null);
  const jsonRef = useRef<HTMLPreElement>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // TypeScript コードを生成する
  const generateCode = () => {
    if (!form.title || !form.code || !form.description || !form.expires) {
      toast.error("クーポン名、コード、説明文、利用期限は必須です");
      return;
    }

    // coupon.ts の生成
    const tsCode = `/**
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
  title: ${JSON.stringify(form.title)},
  code: ${JSON.stringify(form.code)},
  description: ${JSON.stringify(form.description)},
  expires: ${JSON.stringify(form.expires)},${
      form.note ? `\n  note: ${JSON.stringify(form.note)},` : ""
    }
};
`;

    // coupon.json の生成
    const jsonObj: Record<string, string> = {
      title: form.title,
      code: form.code,
      description: form.description,
      expires: form.expires,
    };
    if (form.note) {
      jsonObj.note = form.note;
    }
    const jsonCode = JSON.stringify(jsonObj, null, 2);

    setGeneratedTs(tsCode);
    setGeneratedJson(jsonCode);
    toast.success("コードを生成しました");
  };

  // クリップボードにコピーする
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label}をコピーしました`);
    } catch {
      // フォールバック: テキストエリアを使ったコピー
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      toast.success(`${label}をコピーしました`);
    }
  };

  // テキストを全選択する
  const selectAll = (ref: React.RefObject<HTMLPreElement | null>) => {
    if (!ref.current) return;
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(ref.current);
    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  return (
    <div className="admin-page">
      <Toaster position="top-center" />

      <div className="page-header-section">
        <h2 className="page-title">✏️ 新規クーポン作成</h2>
        <p className="page-description">
          クーポン内容を入力すると、GitHub へ貼り付けるためのコードを生成します。
        </p>
      </div>

      {/* 入力フォーム */}
      <div className="create-form-card">
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">
              クーポン名 <span className="required">*</span>
            </label>
            <input
              type="text"
              name="title"
              className="form-input"
              value={form.title}
              onChange={handleChange}
              placeholder="例: 100円OFFクーポン"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              クーポンコード <span className="required">*</span>
            </label>
            <input
              type="text"
              name="code"
              className="form-input"
              value={form.code}
              onChange={handleChange}
              placeholder="例: SUMMER2026"
            />
          </div>

          <div className="form-group form-group-full">
            <label className="form-label">
              説明文 <span className="required">*</span>
            </label>
            <textarea
              name="description"
              className="form-textarea"
              value={form.description}
              onChange={handleChange}
              placeholder="例: ご来店ありがとうございます！お会計から100円割引いたします。"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              利用期限 <span className="required">*</span>
            </label>
            <input
              type="date"
              name="expires"
              className="form-input"
              value={form.expires}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">補足事項（任意）</label>
            <input
              type="text"
              name="note"
              className="form-input"
              value={form.note}
              onChange={handleChange}
              placeholder="例: ※ 他のクーポンとの併用不可"
            />
          </div>
        </div>

        <button className="btn btn-primary btn-generate" onClick={generateCode}>
          コードを生成する
        </button>
      </div>

      {/* 生成されたコード */}
      {generatedTs && (
        <div className="generated-section">
          {/* coupon.ts */}
          <div className="code-card">
            <div className="code-card-header">
              <h3 className="code-card-title">
                📄 client/src/data/coupon.ts
              </h3>
              <div className="code-actions">
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => selectAll(tsRef)}
                >
                  全選択
                </button>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => copyToClipboard(generatedTs, "coupon.ts")}
                >
                  コピー
                </button>
              </div>
            </div>
            <pre ref={tsRef} className="code-block">
              <code>{generatedTs}</code>
            </pre>
          </div>

          {/* coupon.json */}
          <div className="code-card">
            <div className="code-card-header">
              <h3 className="code-card-title">
                📄 server/shared/coupon.json
              </h3>
              <div className="code-actions">
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => selectAll(jsonRef)}
                >
                  全選択
                </button>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => copyToClipboard(generatedJson, "coupon.json")}
                >
                  コピー
                </button>
              </div>
            </div>
            <pre ref={jsonRef} className="code-block">
              <code>{generatedJson}</code>
            </pre>
          </div>

          <div className="info-box">
            <h4>📌 反映手順</h4>
            <ol>
              <li>
                上記 <code>coupon.ts</code> の内容を GitHub の{" "}
                <code>client/src/data/coupon.ts</code> に貼り付けて保存
              </li>
              <li>
                上記 <code>coupon.json</code> の内容を GitHub の{" "}
                <code>server/shared/coupon.json</code> に貼り付けて保存
              </li>
              <li>GitHub へ Push する</li>
              <li>Render が自動デプロイされ、新しいクーポンへ切り替わります</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
