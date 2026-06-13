"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

type LoginForm = {
  username: string;
  password: string;
};

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    defaultValues: { username: "", password: "" },
  });

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  const onSubmit = async (data: LoginForm) => {
    setSubmitting(true);
    try {
      await login(data);
      toast.success("Đăng nhập thành công!");
      router.replace("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đăng nhập thất bại";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm px-4">
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/80 p-8 shadow-2xl backdrop-blur-sm">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500 shadow-lg shadow-orange-500/30">
              <Shield className="h-9 w-9 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white">Airsoft Tactic</h1>
              <p className="text-sm text-slate-400">Admin Dashboard</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Username */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Tên đăng nhập
              </label>
              <input
                {...register("username", {
                  required: "Vui lòng nhập tên đăng nhập",
                })}
                type="text"
                autoComplete="username"
                placeholder="admin"
                className="w-full rounded-xl border border-slate-600 bg-slate-700/60 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
              {errors.username && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  {...register("password", {
                    required: "Vui lòng nhập mật khẩu",
                  })}
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-600 bg-slate-700/60 px-4 py-3 pr-11 text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPw ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition-all hover:bg-orange-600 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
