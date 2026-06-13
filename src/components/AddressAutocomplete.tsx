"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Loader2, X } from "lucide-react";

interface Suggestion {
  id: string;
  placeName: string; // full address shown to user
  lat: number;
  lng: number;
}

interface AddressAutocompleteProps {
  defaultValue?: string;
  placeholder?: string;
  onSelect: (placeName: string, lat: number, lng: number) => void;
  error?: string;
}

export function AddressAutocomplete({
  defaultValue = "",
  placeholder = "Nhập địa chỉ...",
  onSelect,
  error,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(!!defaultValue);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync defaultValue when it changes (edit mode)
  useEffect(() => {
    if (defaultValue) {
      setQuery(defaultValue);
      setSelected(true);
    }
  }, [defaultValue]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json` +
          `?access_token=${token}&language=vi&limit=5&types=place,address,poi`
      );
      const json = await res.json();
      const results: Suggestion[] = (json.features ?? []).map(
        (f: { id: string; place_name: string; center: [number, number] }) => ({
          id: f.id,
          placeName: f.place_name,
          lng: f.center[0],
          lat: f.center[1],
        })
      );
      setSuggestions(results);
      setOpen(results.length > 0);
    } catch {
      // silently fail — user can still type manually
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    setSelected(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 350);
  };

  const handleSelect = (s: Suggestion) => {
    setQuery(s.placeName);
    setSelected(true);
    setOpen(false);
    setSuggestions([]);
    onSelect(s.placeName, s.lat, s.lng);
  };

  const handleClear = () => {
    setQuery("");
    setSelected(false);
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
          placeholder={placeholder}
          className={`w-full rounded-lg border py-2 pl-9 pr-8 text-sm outline-none focus:ring-2 focus:ring-orange-400 ${
            error ? "border-red-400" : "border-gray-300"
          } ${selected ? "bg-green-50" : ""}`}
        />
        {loading ? (
          <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
        ) : query ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* Suggestions dropdown */}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border bg-white shadow-lg">
          {suggestions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => handleSelect(s)}
                className="flex w-full items-start gap-2.5 px-4 py-3 text-left text-sm hover:bg-orange-50"
              >
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-400" />
                <span className="text-gray-800">{s.placeName}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
