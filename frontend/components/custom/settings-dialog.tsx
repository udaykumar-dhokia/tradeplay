"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserCircleIcon,
  Settings01Icon,
  Sun01Icon,
  Moon02Icon,
  ComputerIcon,
  ViewIcon,
  ViewOffSlashIcon,
  ChartBarLineIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import {
  useGetCurrentUserQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useUpdateSettingsMutation,
} from "@/lib/features/auth/authApi";
import { useTheme } from "next-themes";
import { useAppDispatch } from "@/lib/hooks";
import { setAdvancedMode } from "@/lib/features/ui/uiSlice";
import { cn } from "@/lib/utils";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { data: user, isLoading: isUserLoading } = useGetCurrentUserQuery({});
  const [updateProfile, { isLoading: isUpdatingProfile }] =
    useUpdateProfileMutation();
  const [changePassword, { isLoading: isChangingPassword }] =
    useChangePasswordMutation();
  const [updateSettings, { isLoading: isUpdatingSettings }] =
    useUpdateSettingsMutation();

  const { theme: activeTheme, setTheme } = useTheme();
  const dispatch = useAppDispatch();

  // Profile Form State
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [mobile, setMobile] = React.useState("");

  // Password Form State
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  // Platform Settings State
  const [selectedTradingMode, setSelectedTradingMode] = React.useState<
    "NORMAL" | "ADVANCED"
  >("NORMAL");
  const [selectedTheme, setSelectedTheme] = React.useState<
    "LIGHT" | "DARK" | "SYSTEM"
  >("SYSTEM");

  // Sync state when user data is available
  React.useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setMobile(user.mobile || "");

      if (user.settings?.default_mode) {
        setSelectedTradingMode(user.settings.default_mode);
      }
      if (user.settings?.theme) {
        setSelectedTheme(user.settings.theme);
      }
    }
  }, [user]);

  // Handle Profile Update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      toast.add({
        title: "Validation Error",
        description: "First name is required.",
        type: "error",
      });
      return;
    }

    try {
      await updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim() ? lastName.trim() : null,
        mobile: mobile.trim() ? mobile.trim() : null,
      }).unwrap();

      toast.add({
        title: "Profile Updated",
        description: "Your personal details have been updated successfully.",
        type: "success",
      });
    } catch (err: any) {
      toast.add({
        title: "Error",
        description: err.data?.message || "Failed to update profile",
        type: "error",
      });
    }
  };

  // Handle Password Change
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.add({
        title: "Validation Error",
        description: "Current password is required.",
        type: "error",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast.add({
        title: "Validation Error",
        description: "New password must be at least 6 characters.",
        type: "error",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.add({
        title: "Validation Error",
        description: "New password and confirmation do not match.",
        type: "error",
      });
      return;
    }

    try {
      const res = await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      }).unwrap();

      toast.add({
        title: "Password Changed",
        description: res.message || "Your password has been changed successfully.",
        type: "success",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.add({
        title: "Error",
        description: err.data?.message || "Failed to change password",
        type: "error",
      });
    }
  };

  // Handle Platform Settings Update
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings({
        default_mode: selectedTradingMode,
        theme: selectedTheme,
      }).unwrap();

      // Apply theme immediately
      setTheme(selectedTheme.toLowerCase());

      // Apply trading mode
      dispatch(setAdvancedMode(selectedTradingMode === "ADVANCED"));

      toast.add({
        title: "Settings Saved",
        description: "Your platform preferences have been updated.",
        type: "success",
      });
    } catch (err: any) {
      toast.add({
        title: "Error",
        description: err.data?.message || "Failed to save settings",
        type: "error",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-xl">Settings</DialogTitle>
          <DialogDescription>
            Manage your personal details, credentials, and platform preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="w-full grid grid-cols-2 mb-6">
              <TabsTrigger value="personal" className="flex items-center gap-2">
                <HugeiconsIcon icon={UserCircleIcon} size={16} />
                <span>Personal Details</span>
              </TabsTrigger>
              <TabsTrigger value="platform" className="flex items-center gap-2">
                <HugeiconsIcon icon={Settings01Icon} size={16} />
                <span>Platform Settings</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: PERSONAL DETAILS */}
            <TabsContent value="personal" className="space-y-6">
              {/* Profile Details Form */}
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground">
                    Profile Information
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Update your account details and contact information.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. John"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Doe"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile Number</Label>
                    <Input
                      id="mobile"
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-muted opacity-80 cursor-not-allowed"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Email address cannot be modified.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={isUpdatingProfile || isUserLoading}
                  >
                    {isUpdatingProfile ? "Saving..." : "Save Profile"}
                  </Button>
                </div>
              </form>

              <Separator />

              {/* Password Change Form */}
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground">
                    Change Password
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Ensure your account is using a secure, long password.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      <HugeiconsIcon
                        icon={
                          showCurrentPassword ? ViewOffSlashIcon : ViewIcon
                        }
                        size={16}
                      />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        <HugeiconsIcon
                          icon={showNewPassword ? ViewOffSlashIcon : ViewIcon}
                          size={16}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        <HugeiconsIcon
                          icon={
                            showConfirmPassword ? ViewOffSlashIcon : ViewIcon
                          }
                          size={16}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* TAB 2: PLATFORM SETTINGS */}
            <TabsContent value="platform" className="space-y-6">
              <form onSubmit={handleSettingsSubmit} className="space-y-6">
                {/* Default Mode Setting */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground">
                      Default Trading Mode
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Choose which charting layout opens by default when viewing stocks.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Normal Mode Card */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedTradingMode("NORMAL")}
                      className={cn(
                        "relative flex flex-col p-4 border text-left cursor-pointer transition-all select-none",
                        selectedTradingMode === "NORMAL"
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:bg-muted/50"
                      )}
                    >
                      {selectedTradingMode === "NORMAL" && (
                        <div className="absolute top-3 right-3 text-primary">
                          <HugeiconsIcon icon={Tick02Icon} size={18} />
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-1.5">
                        <HugeiconsIcon
                          icon={ChartBarLineIcon}
                          size={18}
                          className="text-primary"
                        />
                        <span className="font-semibold text-sm">
                          Normal Mode
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Standard lightweight charts, real-time depth & fast order execution.
                      </p>
                    </div>

                    {/* Advanced Mode Card */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedTradingMode("ADVANCED")}
                      className={cn(
                        "relative flex flex-col p-4 border text-left cursor-pointer transition-all select-none",
                        selectedTradingMode === "ADVANCED"
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:bg-muted/50"
                      )}
                    >
                      {selectedTradingMode === "ADVANCED" && (
                        <div className="absolute top-3 right-3 text-primary">
                          <HugeiconsIcon icon={Tick02Icon} size={18} />
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-1.5">
                        <HugeiconsIcon
                          icon={Settings01Icon}
                          size={18}
                          className="text-primary"
                        />
                        <span className="font-semibold text-sm">
                          Advanced Mode
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Pro Klinecharts & TradingView charting with full drawing tools & technical indicators.
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Theme Mode Setting */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground">
                      Theme Mode
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Select your preferred theme for the Tradeplay interface.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {/* Light */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedTheme("LIGHT")}
                      className={cn(
                        "relative flex flex-col items-center justify-center p-4 border text-center cursor-pointer transition-all select-none gap-2",
                        selectedTheme === "LIGHT"
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:bg-muted/50"
                      )}
                    >
                      {selectedTheme === "LIGHT" && (
                        <div className="absolute top-2 right-2 text-primary">
                          <HugeiconsIcon icon={Tick02Icon} size={14} />
                        </div>
                      )}
                      <HugeiconsIcon
                        icon={Sun01Icon}
                        size={22}
                        className={
                          selectedTheme === "LIGHT"
                            ? "text-primary"
                            : "text-muted-foreground"
                        }
                      />
                      <span className="text-xs font-semibold">Light</span>
                    </div>

                    {/* Dark */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedTheme("DARK")}
                      className={cn(
                        "relative flex flex-col items-center justify-center p-4 border text-center cursor-pointer transition-all select-none gap-2",
                        selectedTheme === "DARK"
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:bg-muted/50"
                      )}
                    >
                      {selectedTheme === "DARK" && (
                        <div className="absolute top-2 right-2 text-primary">
                          <HugeiconsIcon icon={Tick02Icon} size={14} />
                        </div>
                      )}
                      <HugeiconsIcon
                        icon={Moon02Icon}
                        size={22}
                        className={
                          selectedTheme === "DARK"
                            ? "text-primary"
                            : "text-muted-foreground"
                        }
                      />
                      <span className="text-xs font-semibold">Dark</span>
                    </div>

                    {/* System */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedTheme("SYSTEM")}
                      className={cn(
                        "relative flex flex-col items-center justify-center p-4 border text-center cursor-pointer transition-all select-none gap-2",
                        selectedTheme === "SYSTEM"
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:bg-muted/50"
                      )}
                    >
                      {selectedTheme === "SYSTEM" && (
                        <div className="absolute top-2 right-2 text-primary">
                          <HugeiconsIcon icon={Tick02Icon} size={14} />
                        </div>
                      )}
                      <HugeiconsIcon
                        icon={ComputerIcon}
                        size={22}
                        className={
                          selectedTheme === "SYSTEM"
                            ? "text-primary"
                            : "text-muted-foreground"
                        }
                      />
                      <span className="text-xs font-semibold">System</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isUpdatingSettings}>
                    {isUpdatingSettings ? "Saving..." : "Save Preferences"}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
