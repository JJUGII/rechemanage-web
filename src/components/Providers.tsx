"use client";

import { Toaster } from "sonner";
import { PwaRegister } from "./PwaRegister";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PwaRegister />
      {children}
      <Toaster
        position="top-center"
        richColors={false}
        closeButton
        toastOptions={{
          classNames: {
            toast:
              "border border-slate-200 bg-white text-slate-800 shadow-md font-sans text-sm",
            title: "text-slate-800",
            description: "text-slate-600",
            closeButton: "text-slate-500",
          },
          duration: 4200,
        }}
      />
    </>
  );
}
