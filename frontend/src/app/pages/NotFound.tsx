import { useNavigate } from "react-router";
import { Home } from "lucide-react";

export function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#fdf2f8" }}>
      <div className="text-center">
        <div className="text-8xl font-bold text-pink-200 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h1>
        <p className="text-gray-500 mb-6">The page you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium transition-all"
          style={{ background: "#d63384" }}
        >
          <Home size={16} />
          Go Home
        </button>
      </div>
    </div>
  );
}
