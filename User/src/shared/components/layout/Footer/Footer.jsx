import React from "react";

export const Footer = () => {
  return (
    <footer className="w-full border-t border-[var(--color-border)] bg-[#07090e] text-[var(--color-text-secondary)]">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6">
          {/* Brand Info (Full width on mobile grid) */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-bold text-sm text-white">ArenaX</span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 max-w-xs leading-relaxed">
              Platform for competitive programming, hackathons, and real-time tech events.
            </p>
            {/* System Status Pill */}
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-medium w-fit mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              All Systems Operational
            </div>
          </div>

          {/* Platform Links */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">Platform</span>
            <a href="#competitions" className="text-xs hover:text-white transition-colors">Competitions</a>
            <a href="#hackathons" className="text-xs hover:text-white transition-colors">Hackathons</a>
            <a href="#leaderboard" className="text-xs hover:text-white transition-colors">Leaderboards</a>
          </div>

          {/* Resources */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">Resources</span>
            <a href="#docs" className="text-xs hover:text-white transition-colors">Documentation</a>
            <a href="#api" className="text-xs hover:text-white transition-colors">API Status</a>
            <a href="#rules" className="text-xs hover:text-white transition-colors">Guidelines</a>
          </div>

          {/* Legal / Social */}
          <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">Legal</span>
            <div className="flex md:flex-col gap-3 md:gap-1.5 text-xs">
              <a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#terms" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-4 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] sm:text-xs text-slate-500">
          <span>&copy; {new Date().getFullYear()} ArenaX Inc. All rights reserved.</span>
          <div className="flex items-center gap-3">
            <a href="#github" className="hover:text-slate-300">GitHub</a>
            <span>&bull;</span>
            <a href="#twitter" className="hover:text-slate-300">Twitter</a>
            <span>&bull;</span>
            <a href="#discord" className="hover:text-slate-300">Discord</a>
          </div>
        </div>
      </div>
    </footer>
  );
};