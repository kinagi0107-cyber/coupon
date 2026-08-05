/**
 * 管理者ログインページ
 * JWT認証でバックエンドに認証し、トークンをlocalStorageに保存する
 */

import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { adminLogin } from "../lib/api";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("ユーザー名とパスワードを入力してください");
      return;
    }

    setIsLoading(true);
    try {
      const result = await adminLogin(username, password);
      // JWTトークンをlocalStorageに保存
      localStorage.setItem("admin_token", result.token);
      toast.success("ログインしました");
      navigate("/admin");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      const message =
        error.response?.data?.error ||
        "ログインに失敗しました。認証情報を確認してください。";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Toaster position="top-center" />
      <div className="login-container">
        <div className="login-header">
          <h1 className="login-title">管理者ログイン</h1>
          <p className="login-subtitle">クーポン管理システム</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              ユーザー名
            </label>
            <input
              id="username"
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoComplete="username"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを入力"
              autoComplete="current-password"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={isLoading}
          >
            {isLoading ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        <div className="login-footer">
          <a href="/" className="back-link">
            ← ユーザー画面へ戻る
          </a>
        </div>
      </div>
    </div>
  );
}
