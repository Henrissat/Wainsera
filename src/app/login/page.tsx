import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <p className="py-20 text-center text-sm text-muted-foreground">
          Chargement…
        </p>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
