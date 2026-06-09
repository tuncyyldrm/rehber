"use client";

import React, { useEffect, useMemo } from "react";

export default function MedyaOnizlemeModal({
  activeModalUrl,
  setActiveModalUrl,
  dosyaAdiniAyıkla,
  dosyaIkonuVer,
}) {
  // 1. Scroll lock (HER ZAMAN ÇALIŞIR)
  useEffect(() => {
    document.body.style.overflow = activeModalUrl ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [activeModalUrl]);

  // 2. Hook HER ZAMAN çağrılır (CRITICAL FIX)
  const fileInfo = useMemo(() => {
    const url = activeModalUrl || "";
    const urlLower = url.toLowerCase().split("?")[0];

    return {
      urlLower,

      isYoutube:
        url.includes("youtube.com") || url.includes("youtu.be"),

      isImage:
        /\.(png|jpg|jpeg|gif|webp|bmp|tiff|svg|avif|ico|heic)$/i.test(
          urlLower
        ),

      isVideo:
        /\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv|m4v)$/i.test(urlLower),

      isPdf: /\.pdf$/i.test(urlLower),

      isOffice:
        /\.(doc|docx|xls|xlsx|ppt|pptx|odt|ods|csv)$/i.test(urlLower),

      isText: /\.(txt|html|htm)$/i.test(urlLower),
    };
  }, [activeModalUrl]);

  const getYoutubeEmbedUrl = () => {
    if (!activeModalUrl) return "";

    try {
      const url = new URL(activeModalUrl);

      let videoId = null;

      if (url.hostname.includes("youtu.be")) {
        videoId = url.pathname.slice(1);
      } else if (url.pathname.startsWith("/shorts/")) {
        videoId = url.pathname.split("/shorts/")[1];
      } else {
        videoId = url.searchParams.get("v");
      }

      if (!videoId) return activeModalUrl;

      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    } catch {
      return activeModalUrl;
    }
  };

  const closeModal = () => setActiveModalUrl(null);

  // 3. EARLY RETURN artık hook'lardan sonra ✔
  if (!activeModalUrl) return null;

  return (
    <div
      className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[9999] flex flex-col p-4"
      onClick={closeModal}
    >
      {/* TOP BAR */}
      <div className="flex justify-between items-center bg-gray-900/80 p-3 rounded-lg border border-gray-800 w-full max-w-6xl mx-auto mb-2">
        <span className="text-xs font-mono text-gray-300 truncate max-w-[65%]">
          {dosyaAdiniAyıkla
            ? dosyaAdiniAyıkla(activeModalUrl)
            : "Dosya Önizleme"}
        </span>

        <div className="flex gap-2">
          <a
            href={activeModalUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded"
          >
            {fileInfo.isYoutube ? "YT AÇ" : "AÇ"}
          </a>

          <button
            onClick={closeModal}
            className="bg-gray-800 text-white text-[10px] font-bold px-3 py-1 rounded"
          >
            KAPAT
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div
        className="flex-1 w-full max-w-6xl mx-auto flex items-center justify-center bg-gray-950 rounded-xl border border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {fileInfo.isYoutube ? (
          <iframe
            src={getYoutubeEmbedUrl()}
            className="w-full h-full max-h-[80vh] aspect-video border-0"
            allowFullScreen
          />
        ) : fileInfo.isImage ? (
          <img
            src={activeModalUrl}
            alt="Önizleme"
            className="max-w-full max-h-[80vh] object-contain"
          />
        ) : fileInfo.isVideo ? (
          <video
            src={activeModalUrl}
            controls
            autoPlay
            className="w-full max-h-[80vh]"
          />
        ) : fileInfo.isPdf ? (
          <iframe
            src={activeModalUrl}
            className="w-full h-full bg-white border-0"
          />
        ) : fileInfo.isOffice ? (
          <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
              activeModalUrl
            )}`}
            className="w-full h-full bg-white border-0"
          />
        ) : fileInfo.isText ? (
          <iframe
            src={activeModalUrl}
            className="w-full h-full bg-white border-0"
          />
        ) : (
          <div className="text-center p-8">
            <div className="text-6xl mb-4">
              {typeof dosyaIkonuVer === "function"
                ? dosyaIkonuVer(activeModalUrl)
                : "📁"}
            </div>

            <p className="text-gray-400 mb-4">
              Bu dosya türü önizlenemiyor.
            </p>

            <a
              href={activeModalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-xs font-bold"
            >
              Dosyayı Aç
            </a>
          </div>
        )}
      </div>
    </div>
  );
}