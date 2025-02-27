"use client";
import { useEffect } from "react";

export default function ThemeSetup() {
  useEffect(() => {
    require("theme-change");

    const storedTheme = localStorage.getItem("theme") || "cupcake";
    document.documentElement.setAttribute("data-theme", storedTheme);
  }, []);

  return null;
}