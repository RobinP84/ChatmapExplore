import React, { useEffect } from "react";
// this gives you the real URL (with hash) that Vite built
import spriteUrl from "../assets/sprite.svg";

export default function SpriteLoader() {
  useEffect(() => {
    fetch(spriteUrl)
      .then((r) => r.text())
      .then((svgText) => {
        const wrapper = document.createElement("div");
        wrapper.style.position = "absolute";
        wrapper.style.width    = "0";
        wrapper.style.height   = "0";
        wrapper.style.overflow = "hidden";
        wrapper.innerHTML      = svgText;
        document.body.insertBefore(wrapper, document.body.firstChild);
      })
      .catch((err) => console.error("Could not load SVG sprite:", err));
  }, []);

  return null;
}