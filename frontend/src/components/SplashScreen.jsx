import React from "react";
import { DollarSign } from "lucide-react";

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-[#fff7df] flex items-center justify-center z-50">
      
      <div className="flex flex-col items-center">

        {/* ICON WRAPPER */}
        <div className="relative">

          <div className="w-16 h-16 bg-[#111] rounded-2xl flex items-center justify-center shadow-xl animate-[pop_0.6s_ease-out]">
            <DollarSign className="w-8 h-8 text-[#fff7df]" />
          </div>

          {/* soft glow effect */}
          <div className="absolute inset-0 w-16 h-16 bg-[#111] rounded-2xl blur-xl opacity-20"></div>

        </div>

        {/* BRAND NAME */}
        <h1 className="mt-4 text-xl font-black text-[#111] tracking-wide animate-[fadeIn_0.8s_ease-in]">
          PayPerAI
        </h1>

        {/* LOADING DOTS */}
        <div className="flex gap-1 mt-3">
          <span className="w-2 h-2 bg-[#111] rounded-full animate-bounce [animation-delay:-0.2s]"></span>
          <span className="w-2 h-2 bg-[#111] rounded-full animate-bounce [animation-delay:-0.1s]"></span>
          <span className="w-2 h-2 bg-[#111] rounded-full animate-bounce"></span>
        </div>

      </div>
    </div>
  );
}