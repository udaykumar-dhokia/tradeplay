"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import Link from "next/link";
import { useLoginMutation } from "@/lib/features/auth/authApi";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [login, { isLoading }] = useLoginMutation();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password }).unwrap();

      toast.add({
        title: "Success",
        description: "Login successful",
        type: "success",
      });

      router.push("/dashboard");
    } catch (err: any) {
      toast.add({
        title: "Error",
        description: err.data?.message || "Login failed",
        type: "error",
      });
    }
  };

  return (
    <div>
      <section className="bg-background lg:grid lg:h-screen lg:place-content-center">
        <div className="mx-auto w-screen max-w-7xl px-4 py-16 sm:px-6 sm:py-24 md:grid md:grid-cols-2 md:items-center md:gap-12 lg:px-8 lg:py-32">
          <div className="max-w-prose text-left">
            <img
              src="https://cdn.dribbble.com/userupload/46510643/file/9ba85652a1d4c2e1714d7f091842ad18.png?resize=1504x1128&vertical=center"
              alt="Tradeplay interface illustration"
              className="mx-auto hidden max-w-xl md:block shadow-sm"
            />
          </div>

          <div className="mx-auto w-full max-w-md p-8 bg-card border border-border">
            <h2 className="text-2xl font-bold mb-6 text-foreground">
              Welcome Back
            </h2>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <HugeiconsIcon
                      icon={showPassword ? ViewOffSlashIcon : ViewIcon}
                      size={18}
                    />
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2"
                size="lg"
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>

              <div className="mt-4 text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-primary hover:underline"
                >
                  Register here
                </Link>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Login;
