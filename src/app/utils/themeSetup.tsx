"use client";
import { useEffect } from "react";
import "theme-change";

export default function ThemeSetup() {
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "winter";
    document.documentElement.setAttribute("data-theme", storedTheme);
  }, []);

  return null;
}