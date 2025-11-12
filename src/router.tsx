import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "./pages/Login";
import ResetPasswordPage from "./pages/ResetPassword";
import SignedPage from "./pages/Signed";
import SignupPage from "./pages/Signup";
import SuccessPage from "./pages/Success";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />
  },
  {
    path: "/login",
    element: <LoginPage />
  },
  {
    path: "/signup",
    element: <SignupPage />
  },
  {
    path: "/success",
    element: <SuccessPage />
  },
  {
    path: "/reset-password",
    element: <ResetPasswordPage />
  },
  {
    path: "/signed",
    element: <SignedPage />
  }
]);

export default router;
