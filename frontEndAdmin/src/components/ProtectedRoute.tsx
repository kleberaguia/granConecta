import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Importe o "Cérebro"
import type { JSX } from "react";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>A carregar...</div>; // Ou um spinner
  }
  if (!user) {  
    return <Navigate to="/login" replace />;
  }
  return children;
}