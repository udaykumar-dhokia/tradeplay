import Footer from "@/components/custom/footer";
import Navbar from "@/components/custom/navbar";
import React from "react";

import StockMarquee from "@/components/custom/StockMarquee";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div>
      <Navbar />
      <StockMarquee />
      {children}
      <Footer />
    </div>
  );
};

export default Layout;
