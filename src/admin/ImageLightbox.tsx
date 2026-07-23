import { ChevronLeft, ChevronRight, Minus, Plus, RotateCcw, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { QuoteImage } from "./types";

export function ImageLightbox({ images, initialIndex, onClose }: { images: QuoteImage[]; initialIndex: number; onClose: () => void }) {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const current = images[index];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") setIndex((value) => (value - 1 + images.length) % images.length);
      if (event.key === "ArrowRight") setIndex((value) => (value + 1) % images.length);
      if (event.key === "+" || event.key === "=") setZoom((value) => Math.min(4, value + 0.25));
      if (event.key === "-") setZoom((value) => Math.max(1, value - 0.25));
      if (event.key === "0") setZoom(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images.length, onClose]);

  useEffect(() => setZoom(1), [index]);

  if (!current?.signed_url) return null;

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Vauriokuvan suurennus">
      <div className="lightbox-bar">
        <span>{index + 1} / {images.length} · {Math.round(zoom * 100)} %</span>
        <div className="lightbox-controls">
          <button className="icon-button" type="button" onClick={() => setZoom((value) => Math.max(1, value - 0.25))} aria-label="Pienennä"><Minus /></button>
          <button className="icon-button" type="button" onClick={() => setZoom(1)} aria-label="Palauta zoom"><RotateCcw /></button>
          <button className="icon-button" type="button" onClick={() => setZoom((value) => Math.min(4, value + 0.25))} aria-label="Suurenna"><Plus /></button>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Sulje"><X /></button>
        </div>
      </div>
      <div className="lightbox-stage">
        {images.length > 1 ? <button className="icon-button" style={{ position: "absolute", left: 16, zIndex: 2 }} type="button" onClick={() => setIndex((value) => (value - 1 + images.length) % images.length)} aria-label="Edellinen kuva"><ChevronLeft /></button> : null}
        <img src={current.signed_url} alt={current.original_filename ?? `Vauriokuva ${index + 1}`} style={{ transform: `scale(${zoom})` }} />
        {images.length > 1 ? <button className="icon-button" style={{ position: "absolute", right: 16, zIndex: 2 }} type="button" onClick={() => setIndex((value) => (value + 1) % images.length)} aria-label="Seuraava kuva"><ChevronRight /></button> : null}
      </div>
    </div>
  );
}
