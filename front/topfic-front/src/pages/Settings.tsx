import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth/AuthContext";
import { EditProfileForm } from "@/components/custom/edit-profile-form";

export default function Settings() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8">
      <EditProfileForm user={user} />
    </div>
  );
}
