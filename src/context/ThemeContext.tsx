"use client";
import { useEffect } from "react";
import "theme-change";

export default function ThemeSetup() {
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "cupcake";
    document.documentElement.setAttribute("data-theme", storedTheme);
  }, []);

  return null;
}