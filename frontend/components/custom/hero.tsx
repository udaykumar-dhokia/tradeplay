import { ArrowUpRight } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

const Hero = () => {
  return (
    <div>
      <section className="bg-background lg:grid lg:h-screen lg:place-content-center">
        <div className="mx-auto w-screen max-w-7xl px-4 py-16 sm:px-6 sm:py-24 md:grid md:grid-cols-2 md:items-center md:gap-4 lg:px-8 lg:py-32">
          <div className="max-w-prose text-left">
            <h1 className="text-4xl font-bold text-foreground sm:text-5xl">
              Learn to trade, compete, and
              <strong className="text-primary"> dominate </strong>
              the leaderboard
            </h1>

            <p className="mt-4 text-base text-pretty text-muted-foreground sm:text-lg/relaxed">
              Master the stock market with our risk-free learning platform. Join
              exciting paper trading contests, predict stock movements, and
              build your virtual portfolio. No real money involved, just pure
              skill, strategy, and education.
            </p>

            <div className="mt-4 flex gap-4 sm:mt-6">
              <Link
                className="flex gap-1 bg-primary px-5 py-2.5 font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/80"
                href="/register"
              >
                Trade for free <HugeiconsIcon icon={ArrowUpRight} size={20} />
              </Link>

              <Link
                className="inline-block border border-border px-5 py-2.5 font-medium text-foreground transition-colors hover:bg-muted"
                href="#learn-more"
              >
                Learn More
              </Link>
            </div>
          </div>

          <img
            src="https://cdn.dribbble.com/userupload/46510643/file/9ba85652a1d4c2e1714d7f091842ad18.png?resize=1504x1128&vertical=center"
            alt="Tradeplay interface illustration"
            className="mx-auto hidden max-w-xl md:block"
          />
        </div>
      </section>
    </div>
  );
};

export default Hero;
