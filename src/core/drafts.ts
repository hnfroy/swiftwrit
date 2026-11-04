"use client";
import { useSyncExternalStore } from "react";
import type { PageSettings } from "./document";

// Draft disimpan di localStorage browser ini (belum sinkron antar perangkat).
export type Draft = { id: string; toolSlug: string; title: string; name: string; updatedAt: number; content: unknown; settings: PageSettings };

const KEY = "toolbox:drafts";
const EMPTY: Draft[] = [];
const subs = new Set<() => void>();
let raw: string | null = null;
let cache: Draft[] = EMPTY;

const read = (): Draft[] => {
  try {
    const r = localStorage.getItem(KEY) ?? "[]";
    if (r !== raw) { raw = r; cache = JSON.parse(r); }
  } catch { cache = EMPTY; }
  return cache;
};
const write = (list: Draft[]) => { localStorage.setItem(KEY, JSON.stringify(list)); subs.forEach((f) => f()); };

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export const getDraft = (id: string) => read().find((d) => d.id === id);
export const saveDraft = (d: Draft) => write([d, ...read().filter((x) => x.id !== d.id)]); // bisa melempar error jika penyimpanan penuh
export const deleteDraft = (id: string) => write(read().filter((d) => d.id !== id));
export const useDrafts = () =>
  useSyncExternalStore(
    (cb) => { subs.add(cb); window.addEventListener("storage", cb); return () => { subs.delete(cb); window.removeEventListener("storage", cb); }; },
    read,
    () => EMPTY
  );
