import React, { useState, useEffect } from "react";
import { Link } from "react-router";

export const Navbar = ({ onMobileMenuToggle, isMobileMenuOpen }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Competitions", href: "#competitions", isNew: false },
    { label: "Hackathons", href: "#hackathons", isNew: true },
    { label: "Leaderboard", href: "#leaderboard" },
    { label: "Organize", href: "#organize" },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-200 border-b ${
        isScrolled
          ? "bg-[var(--color-surface)]/85 backdrop-blur-xl border-[var(--color-border)] shadow-lg shadow-black/20"
          : "bg-[var(--color-surface)]/50 backdrop-blur-md border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-12 sm:h-14 flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <a href="/" className="flex items-center gap-2 shrink-0 group">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:border-emerald-400 transition-colors">
            <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-bold text-sm sm:text-base tracking-tight text-white">
            Arena<span className="text-emerald-400">X</span>
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="px-3 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors relative flex items-center gap-1.5"
            >
              {link.label}
              {link.isNew && (
                <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
                  Live
                </span>
              )}
            </a>
          ))}
        </nav>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2">
          <Link
            to="/register"
            className="h-7.5 sm:h-8.5 px-3 sm:px-4 text-xs font-semibold rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-all shadow-[0_2px_10px_-2px_rgba(16,185,129,0.3)] flex items-center justify-center shrink-0 active:scale-95"
          >
            Get Started
          </Link>

          {/* Mobile Hamburger Button */}
          <button
            onClick={onMobileMenuToggle}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            className="md:hidden w-7.5 h-7.5 flex items-center justify-center rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-white active:scale-90 transition-all shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};