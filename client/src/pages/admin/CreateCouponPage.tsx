/**
 * 管理画面 - 新規クーポン作成ページ
 *
 * Render Free では永続保存できないため、
 * GitHubへ貼り付けるためのコード生成機能として実装
 * type: "public"（通常配布）と type: "code"（コード入力）に対応
 */

import { useState, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";

type CouponType = "public" | "code";

interface CouponForm {
  id: string;
  type: CouponType;
  title: string;
  code: string;
  description: string;
  expires: string;
  secretCode: string;
  maxUses: string;
}

const defaultForm = (): CouponForm => ({
  id: `coupon-${Date.now()}`,
  type: "public",
  title: "",
  code: "",
  description: "",
  expires: "",
  secretCode: "",
  maxUses: "",
});

export default function CreateCouponPage() {
  const [form, setForm] = useState<CouponForm>(defaultForm());
  const [generatedTs, setGeneratedTs] = useState<string>("");
  const [generatedJson, setGeneratedJson] = useState<string>("");
  const tsRef = useRef<HTMLPreElement>(null);
  const jsonRef = useRef<HTMLPreElement>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /** ランダムなIDを生成する */
  const generateId = () => {
    const prefix = form.type === "code" ? "coupon-code" : "coupon";
    return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
  };

  /** ランダムなシークレットコードを生成する */
  const generateSecretCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    setForm((prev) => ({ ...prev, secretCode: code }));
  };

  // コードを生成する
  const generateCode = () => {
    if (!form.title || !form.code || !form.description || !form.expires) {
      toast.error("クーポン名、クーポンコード、説明文、利用期限は必須です");
      return;
    }
    if (form.type === "code" && !form.secretCode) {
      toast.error("コード入力クーポンにはシークレットコードが必要です");
      return;
    }

    const id = generateId();
    const maxUsesNum = form.maxUses ? parseInt(form.maxUses) : null;

    // 新しいクーポンオブジェクト
    const newCoupon: Record<string, unknown> = {
      id,
      type: form.type,
      title: form.title,
      code: form.code,
      description: form.description,
      expires: form.expires,
    };
    if (form.type === "code") {
      newCoupon.secretCode = form.secretCode;
      newCoupon.maxUses = maxUsesNum;
    }

    // coupon.ts の生成（配列形式）
    const tsCode = `/**
 * クーポンデータ定義ファイル
 *
 * このファイルを書き換えてGitHubへPushすると、
 * Renderが自動デプロイされ、新しいクーポンへ切り替わります。
 *
 * type: "public"  → 通常配布クーポン（トップページに表示）
 * type: "code"    → コード入力クーポン（シークレットコード入力で取得）
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

/**
 * 配布中のクーポン一覧
 * ※ 既存のクーポンはそのまま残し、末尾に追加してください
 */
export const coupons: Coupon[] = [
  // ↓ 以下を既存の配列に追加してください
  {
    id: ${JSON.stringify(id)},
    type: ${JSON.stringify(form.type)},
    title: ${JSON.stringify(form.title)},
    code: ${JSON.stringify(form.code)},
    description: ${JSON.stringify(form.description)},
    expires: ${JSON.stringify(form.expires)},${
      form.type === "code"
        ? `\n    secretCode: ${JSON.stringify(form.secretCode)},\n    maxUses: ${maxUsesNum ?? "null"},`
        : ""
    }
  },
];
`;

    // coupon.json の生成（配列形式、追加用オブジェクト）
    const jsonCode = JSON.stringify([newCoupon], null, 2);

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

          {/* クーポン種別 */}
          <div className="form-group form-group-full">
            <label className="form-label">
              クーポン種別 <span className="required">*</span>
            </label>
            <div className="type-selector">
              <label className={`type-option ${form.type === "public" ? "type-option--active" : ""}`}>
                <input
                  type="radio"
                  name="type"
                  value="public"
                  checked={form.type === "public"}
                  onChange={handleChange}
                />
                <span className="type-option-label">
                  <strong>通常配布</strong>
                  <small>トップページに表示されるクーポン</small>
                </span>
              </label>
              <label className={`type-option ${form.type === "code" ? "type-option--active" : ""}`}>
                <input
                  type="radio"
                  name="type"
                  value="code"
                  checked={form.type === "code"}
                  onChange={handleChange}
                />
                <span className="type-option-label">
                  <strong>コード入力</strong>
                  <small>シークレットコードを入力した人だけが取得できるクーポン</small>
                </span>
              </label>
            </div>
          </div>

          {/* クーポン名 */}
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

          {/* クーポンコード */}
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

          {/* 説明文 */}
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

          {/* 利用期限 */}
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

          {/* コード入力クーポン専用フィールド */}
          {form.type === "code" && (
            <>
              <div className="form-group">
                <label className="form-label">
                  シークレットコード <span className="required">*</span>
                </label>
                <div className="input-with-btn">
                  <input
                    type="text"
                    name="secretCode"
                    className="form-input"
                    value={form.secretCode}
                    onChange={handleChange}
                    placeholder="例: MEMBER2026"
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={generateSecretCode}
                  >
                    自動生成
                  </button>
                </div>
                <p className="form-hint">
                  ユーザーがこのコードを入力するとクーポンが表示されます
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">利用人数上限（任意）</label>
                <input
                  type="number"
                  name="maxUses"
                  className="form-input"
                  value={form.maxUses}
                  onChange={handleChange}
                  placeholder="例: 100（空欄で上限なし）"
                  min="1"
                />
                <p className="form-hint">
                  設定した人数に達すると「利用上限に達しています」と表示されます
                </p>
              </div>
            </>
          )}
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
                📄 client/src/data/coupon.ts（追加分）
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
                📄 server/shared/coupon.json（追加分）
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
                GitHub の <code>client/src/data/coupon.ts</code> を開き、
                <code>coupons</code> 配列に上記オブジェクトを追加して保存
              </li>
              <li>
                GitHub の <code>server/shared/coupon.json</code> を開き、
                配列に上記オブジェクトを追加して保存
              </li>
              <li>GitHub へ Push する</li>
              <li>Render が自動デプロイされ、新しいクーポンが追加されます</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
