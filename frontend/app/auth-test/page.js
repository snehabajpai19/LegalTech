"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export default function AuthTestPage() {
  const buttonRef = useRef(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [googleToken, setGoogleToken] = useState("");
  const [backendToken, setBackendToken] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!scriptReady || !buttonRef.current) {
      return;
    }

    if (!googleClientId) {
      setError(
        "Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID in frontend/.env.local."
      );
      return;
    }

    if (!window.google?.accounts?.id) {
      setError("Google Identity Services failed to load.");
      return;
    }

    buttonRef.current.innerHTML = "";

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: async (response) => {
        try {
          setIsLoading(true);
          setError("");
          setCopied(false);

          const idToken = response.credential;
          console.log("Google ID token:", idToken);
          setGoogleToken(idToken);

          const apiResponse = await fetch(`${backendUrl}/api/auth/google`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ id_token: idToken }),
          });

          const data = await apiResponse.json();
          console.log("Backend auth response:", data);

          if (!apiResponse.ok) {
            throw new Error(data.detail || "Backend auth failed.");
          }

          setBackendToken(data.access_token || "");
        } catch (authError) {
          console.error("Auth test flow failed:", authError);
          setBackendToken("");
          setError(authError.message || "Authentication failed.");
        } finally {
          setIsLoading(false);
        }
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      shape: "pill",
      text: "signin_with",
      width: 280,
    });
  }, [scriptReady]);

  async function copyToken() {
    if (!backendToken) {
      return;
    }

    try {
      await navigator.clipboard.writeText(backendToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (copyError) {
      console.error("Copy failed:", copyError);
      setError("Could not copy token to clipboard.");
    }
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />

      <main className="min-h-screen bg-slate-100 px-6 py-12 text-slate-900">
        <div className="mx-auto flex max-w-4xl flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">
              Auth Test Utility
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Google Login to Backend JWT
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Use this page only to sign in with Google, exchange the Google
              ID token with your FastAPI backend, and copy the backend bearer
              token into Swagger Authorize.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="mb-3 text-sm font-medium text-slate-700">
              Step 1: Sign in with Google
            </p>
            <div ref={buttonRef} />
            {isLoading ? (
              <p className="mt-3 text-sm text-slate-600">
                Authenticating with backend...
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="mb-2 text-sm font-semibold text-slate-800">
                Google ID Token
              </h2>
              <p className="mb-3 text-xs text-slate-500">
                This is the token returned by Google Identity Services.
              </p>
              <textarea
                readOnly
                value={googleToken}
                placeholder="Google credential will appear here after sign-in."
                className="min-h-52 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 outline-none"
              />
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-slate-800">
                  Backend JWT
                </h2>
                <button
                  type="button"
                  onClick={copyToken}
                  disabled={!backendToken}
                  className="rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white transition disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {copied ? "Copied" : "Copy Token"}
                </button>
              </div>
              <p className="mb-3 text-xs text-slate-500">
                This is the bearer token returned by POST /api/auth/google.
              </p>
              <textarea
                readOnly
                value={backendToken}
                placeholder="Backend JWT will appear here after successful auth."
                className="min-h-52 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 outline-none"
              />
            </section>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            <p>
              <span className="font-semibold text-slate-800">Backend URL:</span>{" "}
              {backendUrl}
            </p>
            <p>
              <span className="font-semibold text-slate-800">
                Google Client ID:
              </span>{" "}
              {googleClientId || "Not configured"}
            </p>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <span className="font-semibold">Auth error:</span> {error}
            </div>
          ) : null}
        </div>
      </main>
    </>
  );
}
