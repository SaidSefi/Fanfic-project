import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/lib/auth/AuthContext";
import { EditProfileForm } from "@/components/custom/edit-profile-form";

export default function ProfileEdit() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();

  // Not logged in → redirect to login
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Logged in but trying to edit someone else's profile → redirect to that user's public profile
  if (user.username !== username) {
    return <Navigate to={`/profile/${username}`} replace />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8">
      <EditProfileForm user={user} />
    </div>
  );
}
