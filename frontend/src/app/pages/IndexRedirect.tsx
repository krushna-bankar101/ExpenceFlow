import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

export function IndexRedirect() {
  const { currentUser, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (!currentUser) {
      navigate("/login", { replace: true });
    } else {
      const role = currentUser.role;
      if (role === "admin") navigate("/admin/dashboard", { replace: true });
      else if (role === "manager") navigate("/manager/dashboard", { replace: true });
      else navigate("/employee/dashboard", { replace: true });
    }
  }, [currentUser, isLoading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#fdf2f8" }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-pink-200 border-t-pink-600 animate-spin" />
        <p className="text-pink-600 font-medium">Loading...</p>
      </div>
    </div>
  );
}
