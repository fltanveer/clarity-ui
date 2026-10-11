import {
  Archive, ArrowDownUp, Bookmark, Calendar, Check, Copy, Download, Eye, FileDown, FileUp, Filter, Link,
  ListOrdered, Mail, Maximize2, Menu, Pencil, Play, Plus, Printer, RefreshCw, RotateCcw, Save, Send,
  Settings, Share2, Sparkles, Star, Trash2, Upload, UserPlus, Zap, type LucideIcon,
} from "lucide-react";

/*
 * Icons an admin can choose for a toolbar button. A curated set, referenced
 * by name in settings, so the bundle stays small and every icon has been
 * checked at 14px on a coloured bar.
 */
export const ICONS = {
  Plus, UserPlus, Download, FileDown, Upload, FileUp, RefreshCw, RotateCcw, Maximize2, Menu, ListOrdered,
  ArrowDownUp, Trash2, Archive, Share2, Send, Mail, Link, Printer, Copy, Pencil, Save, Check, Filter,
  Eye, Star, Bookmark, Calendar, Settings, Sparkles, Zap, Play,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

export const isIconName = (v: unknown): v is IconName => typeof v === "string" && v in ICONS;
