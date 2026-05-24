import { useCallback, useEffect, useState } from "react";

const KEY = "tann_favourites_v1";

export type Favourite = {
  url: string;
  category?: string | null;
  caption?: string | null;
  addedAt: number;
};

function read(): Favourite[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Favourite[]) : [];
  } catch {
    return [];
  }
}

function write(list: Favourite[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("favourites:changed"));
}

export function useFavourites() {
  const [items, setItems] = useState<Favourite[]>([]);

  useEffect(() => {
    setItems(read());
    const sync = () => setItems(read());
    window.addEventListener("favourites:changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("favourites:changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const isFav = useCallback((url: string) => items.some(i => i.url === url), [items]);

  const toggle = useCallback((fav: Omit<Favourite, "addedAt">) => {
    const list = read();
    const exists = list.some(i => i.url === fav.url);
    const next = exists ? list.filter(i => i.url !== fav.url) : [{ ...fav, addedAt: Date.now() }, ...list];
    write(next);
  }, []);

  const remove = useCallback((url: string) => {
    write(read().filter(i => i.url !== url));
  }, []);

  const clear = useCallback(() => write([]), []);

  return { items, isFav, toggle, remove, clear, count: items.length };
}
