"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import { signOut } from "firebase/auth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import LanguageToggle from "./LanguageToggle";
import { Leaf, LayoutDashboard, List, Wallet, LogOut, Store, ShoppingCart } from "lucide-react";

interface NavbarProps {
  role: "farmer" | "consumer";
  netProfit?: number;
}

export default function Navbar({ role, netProfit = 0 }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const { totalItems } = useCart();

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    router.push("/");
  };

  const farmerLinks = [
    { href: "/farmer/dashboard", label: t.nav.dashboard, icon: LayoutDashboard },
    { href: "/farmer/listings", label: t.nav.listings, icon: List },
    { href: "/farmer/payout", label: t.nav.payout, icon: Wallet },
  ];

  const consumerLinks = [
    { href: "/consumer/browse", label: t.nav.browse, icon: Store },
  ];

  const links = role === "farmer" ? farmerLinks : consumerLinks;

  return (
    <nav className="bg-white border-b border-primary/10 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href={role === "farmer" ? "/farmer/dashboard" : "/consumer/browse"}
            className="flex items-center gap-2 text-primary font-bold text-xl"
          >
            <Leaf className="w-6 h-6" />
            FarmerHub
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-white"
                      : "text-foreground/60 hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <LanguageToggle />

          {role === "farmer" && (
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
              <span className="text-sm text-foreground/50">{t.nav.netProfit}</span>
              <span className="font-bold text-primary">
                ₹{netProfit.toLocaleString("en-IN")}
              </span>
            </div>
          )}

          {role === "consumer" && (
            <Link
              href="/consumer/cart"
              className="relative flex items-center gap-2 px-3 py-2 text-sm text-foreground/60 hover:bg-muted rounded-lg transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-foreground/50 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">{t.nav.logout}</span>
          </button>
        </div>
      </div>

      <div className="flex md:hidden items-center gap-1 mt-3 overflow-x-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-primary text-white"
                  : "text-foreground/60 hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
