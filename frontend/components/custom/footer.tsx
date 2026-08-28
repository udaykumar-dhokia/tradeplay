import React from "react";
import { siteMenu } from "./siteMenu";

const Footer = () => {
  return (
    <div>
      <footer className="bg-primary">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex justify-center text-white">
            <h1 className="text-2xl font-bold">Tradeplay.</h1>
          </div>

          <p className="mx-auto mt-6 max-w-md text-center leading-relaxed text-white/80">
            Learn and experience the thrill of the market without the financial risk. Join TradePlay's educational paper trading contests today and see if you have what it takes to top the leaderboard.
          </p>

          <ul className="mt-12 flex flex-wrap justify-center gap-6 md:gap-8 lg:gap-12">
            {siteMenu.map((link) => (
              <li key={link.href}>
                <a
                  className="text-white transition hover:text-white/80"
                  href={link.href}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <p className="mt-12 text-center text-white/80">
            Copyright 2026 Tradeplay
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
