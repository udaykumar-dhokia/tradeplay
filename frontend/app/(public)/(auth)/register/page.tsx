"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import Link from "next/link";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <section className="bg-gray-50 lg:grid lg:h-screen lg:place-content-center">
        <div className="mx-auto w-screen max-w-7xl px-4 py-16 sm:px-6 sm:py-24 md:grid md:grid-cols-2 md:items-center md:gap-12 lg:px-8 lg:py-32">
          <div className="max-w-prose text-left">
            <img
              src="https://cdn.dribbble.com/userupload/46510643/file/9ba85652a1d4c2e1714d7f091842ad18.png?resize=1504x1128&vertical=center"
              alt="Tradeplay interface illustration"
              className="mx-auto hidden max-w-xl md:block shadow-sm"
            />
          </div>

          <div className="mx-auto w-full max-w-md p-8 bg-white border">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              Create Account
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input id="first_name" placeholder="John" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input id="last_name" placeholder="Doe" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input id="mobile" type="tel" placeholder="+91 9876543210" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <HugeiconsIcon
                      icon={showPassword ? ViewOffSlashIcon : ViewIcon}
                      size={18}
                    />
                  </button>
                </div>
              </div>

              <Button className="w-full mt-2" size="lg">
                Get Started
              </Button>

              <div className="mt-4 text-center text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-primary hover:underline"
                >
                  Login here
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Register;
