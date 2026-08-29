"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  useGetCurrentUserQuery,
  useLogoutMutation,
} from "@/lib/features/auth/authApi";
import { logout as clearUser } from "@/lib/features/auth/authSlice";
import { useAppDispatch } from "@/lib/hooks";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserCircleIcon,
  Settings01Icon,
  Logout01Icon,
  ArrowUpDownIcon,
  Home01Icon,
  CompassIcon,
  ChartBarLineIcon,
  WorkHistoryIcon,
  HeartIcon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home01Icon },
  { title: "Explore", url: "/explore", icon: CompassIcon },
  { title: "Trade", url: "/trade", icon: ChartBarLineIcon },
  { title: "History", url: "/history", icon: WorkHistoryIcon },
  { title: "Wishlist", url: "/wishlist", icon: HeartIcon },
];

export function AppSidebar() {
  const { data: user, isLoading } = useGetCurrentUserQuery({});
  const [logout] = useLogoutMutation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="h-14 flex items-center justify-center border-b px-4 lg:h-[60px]">
        <h1 className="text-xl font-bold w-full text-left">Tradeplay</h1>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  isActive={pathname === item.url}
                  render={<Link href={item.url} />}
                >
                  <HugeiconsIcon icon={item.icon} size={18} />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        {isLoading ? (
          <div className="flex items-center gap-3 w-full animate-pulse">
            <div className="h-10 w-10 rounded-full bg-muted"></div>
            <div className="flex flex-col gap-2 flex-1">
              <div className="h-3 w-20 bg-muted rounded"></div>
              <div className="h-3 w-32 bg-muted rounded"></div>
            </div>
          </div>
        ) : user ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <SidebarMenuButton
                      size="lg"
                      className="w-full justify-start data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    />
                  }
                >
                  <div className="flex items-center gap-3 flex-1 overflow-hidden">
                    <img
                      src={`https://api.dicebear.com/10.x/waves/svg?seed=${user.id}`}
                      alt="avatar"
                      className="h-10 w-10 shrink-0 rounded bg-secondary overflow-hidden object-cover ring-2 ring-primary/20"
                    />
                    <div className="flex flex-col text-left flex-1 min-w-0">
                      <span className="truncate text-sm font-semibold leading-tight">
                        {user.first_name} {user.last_name || ""}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                    <HugeiconsIcon
                      icon={ArrowUpDownIcon}
                      size={16}
                      className="ml-auto opacity-50 shrink-0"
                    />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56"
                  align="end"
                  side="right"
                  sideOffset={8}
                >
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.first_name} {user.last_name || ""}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <HugeiconsIcon
                      icon={UserCircleIcon}
                      size={18}
                      className="mr-2"
                    />
                    Account
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <HugeiconsIcon
                      icon={Settings01Icon}
                      size={18}
                      className="mr-2"
                    />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                    onClick={async () => {
                      try {
                        await logout({}).unwrap();
                        dispatch(clearUser());
                        toast.add({
                          title: "Logged out",
                          description: "You have been successfully logged out.",
                        });
                        router.push("/login");
                      } catch (err) {
                        toast.add({
                          title: "Error",
                          description: "Failed to logout",
                          type: "error",
                        });
                      }
                    }}
                  >
                    <HugeiconsIcon
                      icon={Logout01Icon}
                      size={18}
                      className="mr-2"
                    />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : null}
      </SidebarFooter>
    </Sidebar>
  );
}
