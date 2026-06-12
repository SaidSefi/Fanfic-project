import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserData } from "@/lib/auth/types";
import { getUserProfile, updateUserProfile } from "@/lib/users/api";
import { setUser as setStoreUser } from "@/lib/auth/authStore";

interface EditProfileFormProps {
  user: UserData;
}

export function EditProfileForm({ user }: EditProfileFormProps) {
  const { t } = useTranslation();

  const [username, setUsername] = useState(user.username || "");
  const [bio, setBio] = useState(user.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // Fetch full profile on mount to get bio/avatar if not in auth store
  useEffect(() => {
    const fetchFullProfile = async () => {
      try {
        const profile = await getUserProfile(user.username);
        if (profile.bio !== undefined && user.bio === undefined) {
          setBio(profile.bio || "");
        }
        if (profile.avatar !== undefined && user.avatar_url === undefined) {
          setAvatarUrl(profile.avatar || "");
        }
      } catch {
        // Ignore — user might not exist yet or network issue
      }
    };
    fetchFullProfile();
  }, [user.username]);

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    const trimmed = value.trim();
    if (!trimmed) {
      setUsernameError(t("usernameError"));
    } else if (trimmed.length < 3 || trimmed.length > 30) {
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
    setSuccess(false);

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError(t("fillRequiredFields"));
      return;
    }
    if (!/^[A-Za-z0-9]{3,30}$/.test(trimmedUsername)) {
      setError(t("usernameError"));
      return;
    }

    setLoading(true);
    try {
      // Call update with current username (backend identifies user by URL param)
      const updated = await updateUserProfile(user.username, {
        username: trimmedUsername !== user.username ? trimmedUsername : undefined,
        bio: bio || null,
        avatar_url: avatarUrl || null,
      });

      // Update auth store with new data so Navbar refreshes immediately
      const mergedUser: UserData = {
        ...user,
        username: updated.username,
        bio: updated.bio,
        avatar_url: updated.avatar,
      };
      localStorage.setItem("user_data", JSON.stringify(mergedUser));
      setStoreUser(mergedUser);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        t("unexpectedError");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={username}
              className="h-20 w-20 rounded-full object-cover border-2 border-primary/20"
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold border-2 border-primary/20">
              {username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <CardTitle className="text-2xl">{t("editProfile") || "Edit Profile"}</CardTitle>
        <CardDescription>
          {t("editProfileDescription") || "Update your public profile information"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Avatar URL */}
          <div className="grid gap-2">
            <Label htmlFor="avatarUrl">{t("avatarUrl") || "Avatar URL"}</Label>
            <Input
              id="avatarUrl"
              type="url"
              placeholder="https://example.com/avatar.jpg"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {t("avatarUrlHint") || "Paste a URL to your profile picture"}
            </p>
          </div>

          {/* Username */}
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

          {/* Email (read-only — shown for reference) */}
          <div className="grid gap-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              disabled
              className="opacity-60 cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              {t("emailReadOnly") || "Email cannot be changed"}
            </p>
          </div>

          {/* Bio */}
          <div className="grid gap-2">
            <Label htmlFor="bio">{t("bio") || "Bio"}</Label>
            <textarea
              id="bio"
              rows={4}
              placeholder={t("bioPlaceholder") || "Tell others a bit about yourself..."}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 md:text-sm resize-y"
            />
            <p className="text-xs text-muted-foreground">
              {bio.length}/500
            </p>
          </div>

          {/* Feedback */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {t("profileSaved") || "Profile saved successfully!"}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (t("saving") || "Saving...") : (t("saveChanges") || "Save Changes")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
