import { siteMenu } from "./siteMenu";
import { ArrowUpRight } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

const Navbar = () => {
  return (
    <div>
      <header className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="md:flex md:items-center md:gap-12">
              <a className="block text-teal-600" href="#">
                <span className="sr-only">Home</span>
                <h1 className="text-2xl font-bold text-black">Tradeplay.</h1>
              </a>
            </div>

            <div className="hidden md:block">
              <nav aria-label="Global">
                <ul className="flex items-center gap-6 text-sm">
                  {siteMenu.map((link) => (
                    <li key={link.href}>
                      <Link
                        className="text-black transition hover:text-black/80"
                        href={link.href}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="sm:flex sm:gap-4">
                <Link
                  className=" bg-white px-5 py-2.5 text-sm font-medium text-black"
                  href="/login"
                >
                  Login
                </Link>

                <div className="hidden sm:flex">
                  <Link
                    className=" bg-primary px-5 py-2.5 text-sm font-medium text-white flex gap-1"
                    href="/register"
                  >
                    Trade for free
                    <HugeiconsIcon icon={ArrowUpRight} size={20} />
                  </Link>
                </div>
              </div>

              <div className="block md:hidden">
                <button className="rounded-sm bg-gray-100 p-2 text-gray-600 transition hover:text-gray-600/75">
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
