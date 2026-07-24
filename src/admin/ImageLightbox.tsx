import { ChevronLeft, ChevronRight, Minus, Plus, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from "react";
import type { QuoteImage } from "./types";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;
const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type Point = { x: number; y: number };

type PinchState = {
  distance: number;
  zoom: number;
  center: Point;
  position: Point;
};

function pointerPoint(event: ReactPointerEvent<HTMLElement>): Point {
  return { x: event.clientX, y: event.clientY };
}

function distance(first: Point, second: Point): number {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

function midpoint(first: Point, second: Point): Point {
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  };
}

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

export function ImageLightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: QuoteImage[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [position, setPosition] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const pointersRef = useRef(new Map<number, Point>());
  const dragRef = useRef<{ pointer: Point; position: Point } | null>(null);
  const pinchRef = useRef<PinchState | null>(null);
  const zoomRef = useRef(MIN_ZOOM);
  const positionRef = useRef<Point>({ x: 0, y: 0 });

  const current = images[index];

  const clampPosition = useCallback((next: Point, nextZoom: number): Point => {
    const stage = stageRef.current;
    if (!stage || nextZoom <= MIN_ZOOM) return { x: 0, y: 0 };

    const maxX = (stage.clientWidth * (nextZoom - 1)) / 2;
    const maxY = (stage.clientHeight * (nextZoom - 1)) / 2;

    return {
      x: Math.min(maxX, Math.max(-maxX, next.x)),
      y: Math.min(maxY, Math.max(-maxY, next.y)),
    };
  }, []);

  const applyTransform = useCallback((nextZoom: number, nextPosition: Point) => {
    const clampedZoom = clampZoom(nextZoom);
    const clampedPosition = clampPosition(nextPosition, clampedZoom);

    zoomRef.current = clampedZoom;
    positionRef.current = clampedPosition;
    setZoom(clampedZoom);
    setPosition(clampedPosition);
  }, [clampPosition]);

  const resetTransform = useCallback(() => {
    applyTransform(MIN_ZOOM, { x: 0, y: 0 });
    pointersRef.current.clear();
    dragRef.current = null;
    pinchRef.current = null;
    setIsPanning(false);
  }, [applyTransform]);

  const moveImage = useCallback((direction: -1 | 1) => {
    setIndex((value) => (value + direction + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    resetTransform();
  }, [index, resetTransform]);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => dialogRef.current?.focus());

    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "ArrowLeft" && images.length > 1) {
        event.preventDefault();
        moveImage(-1);
        return;
      }

      if (event.key === "ArrowRight" && images.length > 1) {
        event.preventDefault();
        moveImage(1);
        return;
      }

      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        applyTransform(zoomRef.current + ZOOM_STEP, positionRef.current);
        return;
      }

      if (event.key === "-") {
        event.preventDefault();
        applyTransform(zoomRef.current - ZOOM_STEP, positionRef.current);
        return;
      }

      if (event.key === "0") {
        event.preventDefault();
        resetTransform();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [applyTransform, images.length, moveImage, onClose, resetTransform]);

  if (!current?.signed_url) return null;

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const point = pointerPoint(event);
    pointersRef.current.set(event.pointerId, point);
    event.currentTarget.setPointerCapture(event.pointerId);

    if (pointersRef.current.size === 1 && zoomRef.current > MIN_ZOOM) {
      dragRef.current = { pointer: point, position: positionRef.current };
      setIsPanning(true);
    }

    if (pointersRef.current.size === 2) {
      const [first, second] = Array.from(pointersRef.current.values());
      pinchRef.current = {
        distance: Math.max(distance(first, second), 1),
        zoom: zoomRef.current,
        center: midpoint(first, second),
        position: positionRef.current,
      };
      dragRef.current = null;
      setIsPanning(true);
    }
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, pointerPoint(event));

    if (pointersRef.current.size >= 2 && pinchRef.current) {
      const [first, second] = Array.from(pointersRef.current.values());
      const pinch = pinchRef.current;
      const nextCenter = midpoint(first, second);
      const nextZoom = pinch.zoom * (distance(first, second) / pinch.distance);

      applyTransform(nextZoom, {
        x: pinch.position.x + nextCenter.x - pinch.center.x,
        y: pinch.position.y + nextCenter.y - pinch.center.y,
      });
      return;
    }

    if (pointersRef.current.size === 1 && dragRef.current && zoomRef.current > MIN_ZOOM) {
      const point = pointerPoint(event);
      applyTransform(zoomRef.current, {
        x: dragRef.current.position.x + point.x - dragRef.current.pointer.x,
        y: dragRef.current.position.y + point.y - dragRef.current.pointer.y,
      });
    }
  }

  function releasePointer(event: ReactPointerEvent<HTMLDivElement>) {
    pointersRef.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (pointersRef.current.size === 1 && zoomRef.current > MIN_ZOOM) {
      const remaining = Array.from(pointersRef.current.values())[0];
      dragRef.current = { pointer: remaining, position: positionRef.current };
      pinchRef.current = null;
      return;
    }

    dragRef.current = null;
    pinchRef.current = null;
    setIsPanning(false);
  }

  function onWheel(event: ReactWheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const direction = event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
    applyTransform(zoomRef.current + direction, positionRef.current);
  }

  function onDoubleClick() {
    if (zoomRef.current > MIN_ZOOM) resetTransform();
    else applyTransform(2, { x: 0, y: 0 });
  }

  return (
    <div
      ref={dialogRef}
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Vauriokuvan tarkastelu"
      tabIndex={-1}
    >
      <div className="lightbox-bar">
        <span aria-live="polite">{index + 1} / {images.length} · {Math.round(zoom * 100)} %</span>
        <div className="lightbox-controls">
          <button
            className="icon-button"
            type="button"
            onClick={() => applyTransform(zoomRef.current - ZOOM_STEP, positionRef.current)}
            aria-label="Loitonna kuvaa"
            disabled={zoom <= MIN_ZOOM}
          >
            <Minus />
          </button>
          <button className="icon-button" type="button" onClick={resetTransform} aria-label="Palauta kuva">
            <RotateCcw />
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={() => applyTransform(zoomRef.current + ZOOM_STEP, positionRef.current)}
            aria-label="Lähennä kuvaa"
            disabled={zoom >= MAX_ZOOM}
          >
            <Plus />
          </button>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Sulje kuvankatselu">
            <X />
          </button>
        </div>
      </div>

      <div
        ref={stageRef}
        className={`lightbox-stage${zoom > MIN_ZOOM ? " is-pannable" : ""}${isPanning ? " is-panning" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={releasePointer}
        onPointerCancel={releasePointer}
        onWheel={onWheel}
        onDoubleClick={onDoubleClick}
      >
        {images.length > 1 ? (
          <button
            className="icon-button lightbox-previous"
            type="button"
            onClick={() => moveImage(-1)}
            aria-label="Edellinen kuva"
          >
            <ChevronLeft />
          </button>
        ) : null}

        <img
          className="lightbox-image"
          src={current.signed_url}
          alt={current.original_filename ?? `Vauriokuva ${index + 1}`}
          draggable={false}
          style={{
            transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${zoom})`,
          }}
        />

        {images.length > 1 ? (
          <button
            className="icon-button lightbox-next"
            type="button"
            onClick={() => moveImage(1)}
            aria-label="Seuraava kuva"
          >
            <ChevronRight />
          </button>
        ) : null}

        <p className="lightbox-hint">Zoomaa rullalla tai nipistämällä. Siirrä kuvaa vetämällä.</p>
      </div>
    </div>
  );
}
