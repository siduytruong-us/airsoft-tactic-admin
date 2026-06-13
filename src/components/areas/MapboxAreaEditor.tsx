"use client";

// CSS is imported globally in app/globals.css:
// @import 'mapbox-gl/dist/mapbox-gl.css';
// @import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { CheckCircle2, X } from "lucide-react";
import type { Area, GeoJsonPolygon } from "@/types/api";

interface MapboxAreaEditorProps {
  areas: Area[];
  center?: [number, number]; // [lng, lat]
  flyTo?: [number, number] | null; // trigger flyTo when changed
  onPolygonComplete: (polygon: GeoJsonPolygon) => void;
  onAreaClick?: (area: Area) => void;
  readOnly?: boolean;
}

export function MapboxAreaEditor({
  areas,
  center = [106.6297, 10.8231],
  flyTo,
  onPolygonComplete,
  onAreaClick,
  readOnly = false,
}: MapboxAreaEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);

  // Track vertices clicked while in draw_polygon mode
  const verticesRef = useRef<[number, number][]>([]);
  const isDrawingRef = useRef(false);
  const [vertexCount, setVertexCount] = useState(0);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  // Stable callback ref so map events always call the latest prop
  const onPolygonCompleteRef = useRef(onPolygonComplete);
  onPolygonCompleteRef.current = onPolygonComplete;

  // ── Done / Cancel handlers ────────────────────────────────────────────────
  const resetDraw = () => {
    drawRef.current?.deleteAll();
    drawRef.current?.changeMode("simple_select");
    isDrawingRef.current = false;
    verticesRef.current = [];
    setVertexCount(0);
    setContextMenu(null);
  };

  const handleDone = () => {
    const verts = verticesRef.current;
    if (verts.length < 3) return;
    const polygon: GeoJsonPolygon = {
      type: "Polygon",
      coordinates: [[...verts, verts[0]]],
    };
    resetDraw();
    onPolygonCompleteRef.current(polygon);
  };

  const handleCancel = () => resetDraw();

  // ── Init map once ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.error("Missing NEXT_PUBLIC_MAPBOX_TOKEN in .env.local");
      return;
    }
    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center,
      zoom: 15,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    if (!readOnly) {
      const draw = new MapboxDraw({
        displayControlsDefault: false,
        // Hide the built-in polygon button — we keep trash only;
        // user enters draw mode via the polygon icon we keep below
        controls: { polygon: true, trash: true },
        defaultMode: "simple_select",
      });
      map.addControl(draw, "top-left");
      drawRef.current = draw;

      // Track when the user enters / exits draw_polygon mode
      map.on("draw.modechange", (e: { mode: string }) => {
        if (e.mode === "draw_polygon") {
          isDrawingRef.current = true;
          verticesRef.current = [];
          setVertexCount(0);
          setContextMenu(null);
        } else {
          isDrawingRef.current = false;
          verticesRef.current = [];
          setVertexCount(0);
          setContextMenu(null);
        }
      });

      // Count each vertex click while drawing; also dismiss context menu
      map.on("click", (e) => {
        if (!isDrawingRef.current) return;
        setContextMenu(null);
        verticesRef.current.push([e.lngLat.lng, e.lngLat.lat]);
        setVertexCount(verticesRef.current.length);
      });

      // Right-click while drawing → show Done/Cancel menu at cursor
      map.on("contextmenu", (e) => {
        if (!isDrawingRef.current) return;
        e.preventDefault();
        const rect = containerRef.current!.getBoundingClientRect();
        setContextMenu({
          x: e.originalEvent.clientX - rect.left,
          y: e.originalEvent.clientY - rect.top,
        });
      });

      // User closed polygon manually (clicked first point) — still works as fallback
      map.on("draw.create", (e: { features: GeoJSON.Feature[] }) => {
        isDrawingRef.current = false;
        verticesRef.current = [];
        setVertexCount(0);
        setContextMenu(null);
        const feature = e.features[0];
        if (feature?.geometry?.type === "Polygon") {
          onPolygonCompleteRef.current(feature.geometry as GeoJsonPolygon);
          draw.deleteAll();
        }
      });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      drawRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep a stable ref to onAreaClick so handler closures don't go stale
  const onAreaClickRef = useRef(onAreaClick);
  onAreaClickRef.current = onAreaClick;

  // ── Fly to field center exactly once when coordinates first arrive ─────────
  const hasCenteredRef = useRef(false);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !center || hasCenteredRef.current) return;
    hasCenteredRef.current = true;
    map.flyTo({ center, zoom: 16, speed: 1.4, essential: true });
  }, [center]);

  // ── Fly to address search result when flyTo prop changes ─────────────────
  const prevFlyToRef = useRef<[number, number] | null>(null);
  useEffect(() => {
    if (!flyTo || !mapRef.current) return;
    if (
      prevFlyToRef.current?.[0] === flyTo[0] &&
      prevFlyToRef.current?.[1] === flyTo[1]
    )
      return;
    prevFlyToRef.current = flyTo;
    mapRef.current.flyTo({ center: flyTo, zoom: 17, speed: 1.6, essential: true });
  }, [flyTo]);

  // ── Re-render saved area layers whenever areas prop changes ───────────────
  // Use a ref to track named handlers so they can be removed before re-adding
  const areaHandlersRef = useRef<
    Map<string, { click: () => void; enter: () => void; leave: () => void }>
  >(new Map());

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const renderAreas = () => {
      const style = map.getStyle();

      // Remove previous event handlers before removing layers
      areaHandlersRef.current.forEach((handlers, layerId) => {
        map.off("click", layerId, handlers.click);
        map.off("mouseenter", layerId, handlers.enter);
        map.off("mouseleave", layerId, handlers.leave);
      });
      areaHandlersRef.current.clear();

      // Remove previous layers/sources
      style?.layers
        ?.filter((l) => l.id.startsWith("area-fill-") || l.id.startsWith("area-outline-"))
        .forEach((l) => { if (map.getLayer(l.id)) map.removeLayer(l.id); });
      Object.keys(style?.sources ?? {})
        .filter((k) => k.startsWith("area-src-"))
        .forEach((k) => { if (map.getSource(k)) map.removeSource(k); });

      areas.forEach((area) => {
        const srcId = `area-src-${area.id}`;
        const fillId = `area-fill-${area.id}`;

        map.addSource(srcId, {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: area.geometry,
            properties: { id: area.id, name: area.name },
          },
        });
        const isBoundary = area.areaType === "BOUNDARY";

        map.addLayer({
          id: fillId,
          type: "fill",
          source: srcId,
          paint: {
            "fill-color": area.colorHex,
            "fill-opacity": isBoundary ? 0 : 0.3,
          },
        });
        map.addLayer({
          id: `area-outline-${area.id}`,
          type: "line",
          source: srcId,
          paint: {
            "line-color": area.colorHex,
            "line-width": isBoundary ? 2.5 : 2,
            ...(isBoundary && { "line-dasharray": [4, 3] }),
          },
        });

        // Named handlers — stored so they can be removed on next render
        const clickHandler = () => {
          if (isDrawingRef.current) return;
          onAreaClickRef.current?.(area);
        };
        const enterHandler = () => {
          if (!isDrawingRef.current) map.getCanvas().style.cursor = "pointer";
        };
        const leaveHandler = () => {
          map.getCanvas().style.cursor = "";
        };

        map.on("click", fillId, clickHandler);
        map.on("mouseenter", fillId, enterHandler);
        map.on("mouseleave", fillId, leaveHandler);
        areaHandlersRef.current.set(fillId, {
          click: clickHandler,
          enter: enterHandler,
          leave: leaveHandler,
        });
      });
    };

    if (map.isStyleLoaded()) {
      renderAreas();
    } else {
      map.once("styledata", renderAreas);
    }
  }, [areas]);

  return (
    <div className="relative h-full w-full min-h-[400px]">
      {/* Map canvas */}
      <div ref={containerRef} className="h-full w-full rounded-lg" />

      {/* Right-click context menu — Done / Cancel */}
      {contextMenu && (
        <div
          className="absolute z-20 overflow-hidden rounded-xl border bg-white shadow-xl"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={handleDone}
            disabled={vertexCount < 3}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CheckCircle2 className="h-4 w-4 text-orange-500" />
            Xong
            <span className="ml-auto text-xs text-gray-400">{vertexCount} điểm</span>
          </button>
          <div className="h-px bg-gray-100" />
          <button
            onClick={handleCancel}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <X className="h-4 w-4" />
            Huỷ vẽ
          </button>
        </div>
      )}

      {/* Hint pill — visible while drawing */}
      {isDrawingRef.current && vertexCount > 0 && !contextMenu && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
          <span className="rounded-full bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
            {vertexCount} điểm · Chuột phải để hoàn thành
          </span>
        </div>
      )}
    </div>
  );
}
