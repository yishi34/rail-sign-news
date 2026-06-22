"use client";

import { useState, useEffect } from "react";

// クリックすると画像を大きく表示する(モーダル)。背景か×ボタンで閉じる
export default function ImageZoom({ src, alt, className }) {
  const [open, setOpen] = useState(false);

  // モーダル表示中は Esc キーでも閉じられるように
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={className}
        onClick={() => setOpen(true)}
        style={{ cursor: "zoom-in" }}
      />
      {open && (
        <div
          className="yk-zoom-overlay"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={alt}
        >
          <img src={src} alt={alt} className="yk-zoom-img" />
          <button
            type="button"
            className="yk-zoom-close"
            aria-label="閉じる"
            onClick={() => setOpen(false)}
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
