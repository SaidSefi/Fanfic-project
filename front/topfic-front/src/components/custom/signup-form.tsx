import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RegisterRequestData } from "@/lib/auth/types";
import { useAuth } from "@/lib/auth/AuthContext";

export function SignupForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    const trimmed = value.trim();
    if (!trimmed) {
      setUsernameError(null);
      return;
    }
    if (trimmed.length < 3 || trimmed.length > 30) {
      setUsernameError(t("usernameError"));
    } else if (!/^[A-Za-z0-9]+$/.test(trimmed)) {
      setUsernameError(t("usernameError"));
    } else {
      setUsernameError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUsername = username.trim();
    if (!trimmedUsername || !email || !password) {
      setError(t("fillRequiredFields"));
      return;
    }

    if (!/^[A-Za-z0-9]{3,30}$/.test(trimmedUsername)) {
      setError(t("usernameError"));
      return;
    }

    if (password.length < 8) {
      setError(t("passwordTooShort"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("passwordsMismatch"));
      return;
    }

    const payload: RegisterRequestData = {
      username: trimmedUsername,
      email,
      password,
    };

    try {
      const res = await register(payload);
      if (!res.ok) {
        setError(res.error || t("registrationFailed"));
        return;
      }

      const from = (location.state as any)?.from;
      if (from && from.pathname) {
        navigate(from.pathname + (from.search || ""), { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err: any) {
      setError(err?.message || t("unexpectedError"));
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl">{t("registerTitle")}</CardTitle>
        <CardDescription>{t("registerDescription")}</CardDescription>
      </CardHeader>

      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="username">{t("username")}</Label>
            <Input
              id="username"
              type="text"
              placeholder={t("usernamePlaceholder")}
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              required
            />
            {usernameError && (
              <p className="text-xs text-destructive">{usernameError}</p>
            )}
            {!usernameError && (
              <p className="text-xs text-muted-foreground">{t("usernameHint")}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">{t("passwordHint")}</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("creatingAccount") : t("createAccount")}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {t("alreadyHaveAccount")}{" "}
            <Link to="/auth/login" className="text-primary hover:underline underline-offset-4 font-medium">
              {t("signIn")}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
