import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import { Toaster } from "sonner";

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
