import { siteMenu } from "./siteMenu";
import { ArrowUpRight } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

const Navbar = () => {
  return (
    <div>
      <header className="bg-background border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="md:flex md:items-center md:gap-12">
              <Link className="block text-primary" href="/">
                <span className="sr-only">Home</span>
                <h1 className="text-2xl font-bold text-foreground">Tradeplay.</h1>
              </Link>
            </div>

            <div className="hidden md:block">
              <nav aria-label="Global">
                <ul className="flex items-center gap-6 text-sm">
                  {siteMenu.map((link) => (
                    <li key={link.href}>
                      <Link
                        className="text-muted-foreground transition hover:text-foreground"
                        href={link.href}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  className="border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  href="/login"
                >
                  Login
                </Link>

                <div className="hidden sm:flex">
                  <Link
                    className="bg-primary hover:bg-primary/90 px-4 py-2 text-sm font-medium text-primary-foreground flex items-center gap-1 transition-colors"
                    href="/register"
                  >
                    Trade for free
                    <HugeiconsIcon icon={ArrowUpRight} size={18} />
                  </Link>
                </div>

                <ThemeToggle />
              </div>

              <div className="block md:hidden">
                <button className="rounded-sm bg-muted p-2 text-muted-foreground transition hover:text-foreground">
                  <span className="sr-only">Toggle menu</span>

                  <svg
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
};

export default Navbar;
