"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Check, ChevronDown, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { fieldBase } from "./input";

export interface SelectOption {
  value: string;
  label: string;
  /** คำอธิบายสั้นใต้ชื่อ */
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
  /** ตัวเลือกที่ group เดียวกันต้องอยู่ติดกัน จะมีหัวข้อกลุ่มคั่น */
  group?: string;
}

interface SelectBase {
  options: SelectOption[];
  placeholder?: string;
  id?: string;
  /** ใส่เมื่อใช้ใน <form> จะส่งค่าผ่าน input ซ่อน */
  name?: string;
  className?: string;
  /** md = ช่องกรอกในฟอร์ม, lg = ช่องกรองข้อมูล */
  size?: "md" | "lg";
  invalid?: boolean;
  disabled?: boolean;
  /** ช่องค้นหาในเมนู ค่าเริ่มต้นเปิดเองเมื่อมีตัวเลือกเกิน 8 รายการ */
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
  /** ปุ่มล้างค่า */
  clearable?: boolean;
  /** พิมพ์ชื่อใหม่แล้วเพิ่มเป็นตัวเลือกได้ */
  creatable?: boolean;
  "aria-label"?: string;
}

interface SingleSelectProps extends SelectBase {
  multiple?: false;
  value: string;
  onChange: (value: string) => void;
}

interface MultiSelectProps extends SelectBase {
  multiple: true;
  value: string[];
  onChange: (value: string[]) => void;
}

export type SelectProps = SingleSelectProps | MultiSelectProps;

interface Entry {
  option: SelectOption;
  create?: boolean;
}

const AUTO_SEARCH_AT = 8;
const MENU_GAP = 6;
const VIEWPORT_MARGIN = 12;
const MENU_MAX_HEIGHT = 320;

function buildEntries(
  options: SelectOption[],
  query: string,
  creatable: boolean,
): Entry[] {
  const text = query.trim();
  const q = text.toLowerCase();
  const matched = q
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(q) ||
          o.description?.toLowerCase().includes(q),
      )
    : options;
  const entries: Entry[] = matched.map((option) => ({ option }));
  const exists = options.some(
    (o) => o.value === text || o.label.toLowerCase() === q,
  );
  if (creatable && text && !exists) {
    entries.push({
      create: true,
      option: { value: text, label: `เพิ่ม “${text}”` },
    });
  }
  return entries;
}

function firstEnabled(entries: Entry[]) {
  return entries.findIndex((e) => !e.option.disabled);
}

/**
 * ช่องเลือกกลางของระบบ: เลือกเดี่ยว/หลายรายการ ค้นหา จัดกลุ่ม คำอธิบาย ล้างค่า และเพิ่มรายการใหม่
 * เมนูเปิดในชั้น top layer (Popover API) จึงไม่ถูกตัดโดย Dialog หรือกล่องที่เลื่อนได้
 */
export function Select(props: SelectProps) {
  const {
    options,
    placeholder = "เลือก",
    id,
    name,
    className,
    size = "md",
    invalid,
    disabled,
    searchPlaceholder = "ค้นหา",
    emptyText = "ไม่พบรายการ",
    clearable,
    creatable = false,
    "aria-label": ariaLabel,
  } = props;
  const searchable =
    props.searchable ?? (options.length > AUTO_SEARCH_AT || creatable);

  const autoId = useId();
  const triggerId = id ?? `${autoId}-trigger`;
  const listId = `${autoId}-list`;
  const optionId = (i: number) => `${autoId}-opt-${i}`;

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const typed = useRef({ text: "", at: 0 });

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const [pos, setPos] = useState<CSSProperties | null>(null);

  const selected = props.multiple ? props.value : [props.value];
  const entries = useMemo(
    () => buildEntries(options, query, creatable),
    [options, query, creatable],
  );

  const labelOf = (value: string) => {
    const found = options.find((o) => o.value === value);
    if (found) return found;
    return creatable && value ? ({ value, label: value } as SelectOption) : undefined;
  };
  const chosen = selected
    .map(labelOf)
    .filter((o): o is SelectOption => o !== undefined);
  const hasValue = props.multiple ? props.value.length > 0 : props.value !== "";

  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const below = window.innerHeight - r.bottom - MENU_GAP - VIEWPORT_MARGIN;
    const above = r.top - MENU_GAP - VIEWPORT_MARGIN;
    const flip = below < 200 && above > below;
    const room = Math.max(flip ? above : below, 140);
    setPos({
      left: r.left,
      width: r.width,
      maxHeight: Math.min(MENU_MAX_HEIGHT, room),
      ...(flip
        ? { bottom: window.innerHeight - r.top + MENU_GAP }
        : { top: r.bottom + MENU_GAP }),
    });
  }, []);

  const openMenu = useCallback(() => {
    if (disabled) return;
    const initial = options.findIndex(
      (o) => !o.disabled && selected.includes(o.value),
    );
    place();
    setQuery("");
    setActive(initial >= 0 ? initial : options.findIndex((o) => !o.disabled));
    setOpen(true);
  }, [disabled, options, selected, place]);

  const close = useCallback((refocus = false) => {
    setOpen(false);
    setQuery("");
    if (refocus) triggerRef.current?.focus();
  }, []);

  // เปิดเมนูในชั้น top layer และคอยจัดตำแหน่งตามช่องเลือกเมื่อเลื่อน/ปรับขนาดจอ
  useLayoutEffect(() => {
    if (!open) return;
    const menu = menuRef.current;
    if (menu && !menu.matches(":popover-open")) menu.showPopover?.();
    if (searchable) searchRef.current?.focus({ preventScroll: true });
    const reposition = () => place();
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open, searchable, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, close]);

  useEffect(() => {
    if (open && active >= 0) {
      document
        .getElementById(`${autoId}-opt-${active}`)
        ?.scrollIntoView({ block: "nearest" });
    }
  }, [open, active, autoId]);

  function pick(option: SelectOption) {
    if (option.disabled) return;
    if (props.multiple) {
      const has = props.value.includes(option.value);
      props.onChange(
        has
          ? props.value.filter((v) => v !== option.value)
          : [...props.value, option.value],
      );
      if (query) setQuery("");
    } else {
      props.onChange(option.value);
      close(true);
    }
  }

  function clear() {
    if (props.multiple) props.onChange([]);
    else props.onChange("");
    triggerRef.current?.focus();
  }

  function step(dir: 1 | -1) {
    const n = entries.length;
    let i = active;
    for (let k = 0; k < n; k++) {
      i = (i + dir + n) % n;
      if (!entries[i].option.disabled) return i;
    }
    return active;
  }

  function onKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (disabled) return;
    switch (e.key) {
      case "ArrowDown":
      case "ArrowUp":
        e.preventDefault();
        if (!open) openMenu();
        else setActive(step(e.key === "ArrowDown" ? 1 : -1));
        break;
      case "Home":
      case "End":
        if (!open || searchable) break;
        e.preventDefault();
        setActive(
          e.key === "Home"
            ? firstEnabled(entries)
            : entries.findLastIndex((en) => !en.option.disabled),
        );
        break;
      case "Enter":
        e.preventDefault();
        if (!open) openMenu();
        else if (entries[active]) pick(entries[active].option);
        break;
      case " ":
        if (open && searchable) break;
        e.preventDefault();
        if (!open) openMenu();
        else if (entries[active]) pick(entries[active].option);
        break;
      case "Escape":
        if (!open) break;
        // กัน Esc ไปปิด Dialog ที่ครอบอยู่
        e.preventDefault();
        e.stopPropagation();
        close(true);
        break;
      case "Tab":
        if (open) close();
        break;
      default: {
        if (searchable || e.key.length !== 1 || e.ctrlKey || e.metaKey) break;
        const now = Date.now();
        const t = typed.current;
        t.text = now - t.at > 600 ? e.key : t.text + e.key;
        t.at = now;
        const q = t.text.toLowerCase();
        const idx = entries.findIndex(
          (en) => !en.option.disabled && en.option.label.toLowerCase().startsWith(q),
        );
        if (idx >= 0) {
          if (!open) openMenu();
          setActive(idx);
        }
      }
    }
  }

  function onSearch(value: string) {
    setQuery(value);
    setActive(firstEnabled(buildEntries(options, value, creatable)));
  }

  const triggerLabel = props.multiple ? (
    chosen.length > 0 && (
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate">{chosen[0].label}</span>
        {chosen.length > 1 && (
          <span className="bg-primary-soft text-primary-strong shrink-0 rounded-full px-2 py-0.5 text-xs font-medium">
            +{chosen.length - 1}
          </span>
        )}
      </span>
    )
  ) : (
    chosen[0] && (
      <span className="flex min-w-0 items-center gap-2">
        {chosen[0].icon}
        <span className="truncate">{chosen[0].label}</span>
      </span>
    )
  );

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={
          open && !searchable && active >= 0 ? optionId(active) : undefined
        }
        aria-invalid={invalid || undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onKeyDown}
        className={cn(
          fieldBase,
          "flex cursor-pointer items-center text-left",
          size === "lg" ? "h-[46px]" : "h-10",
          clearable && hasValue && !disabled ? "pr-16" : "pr-10",
          invalid
            ? "border-danger"
            : open
              ? "border-primary"
              : "border-border hover:border-primary/50",
          className,
        )}
      >
        {triggerLabel || (
          <span className="text-muted-foreground truncate">{placeholder}</span>
        )}
      </button>

      {clearable && hasValue && !disabled && (
        <button
          type="button"
          onClick={clear}
          aria-label="ล้างตัวเลือก"
          className="text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-primary/50 absolute top-1/2 right-9 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      )}

      <ChevronDown
        className={cn(
          "text-muted-foreground pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 transition-transform duration-200 motion-reduce:transition-none",
          open && "rotate-180",
        )}
        aria-hidden
      />

      {name &&
        (props.multiple ? (
          props.value.map((v) => <input key={v} type="hidden" name={name} value={v} />)
        ) : (
          <input type="hidden" name={name} value={props.value} />
        ))}

      {open && pos && (
        <div
          ref={menuRef}
          popover="manual"
          data-select-menu
          style={{ position: "fixed", inset: "auto", margin: 0, ...pos }}
          className="border-border bg-surface text-foreground shadow-float flex flex-col overflow-hidden rounded-xl border p-1.5"
        >
          {searchable && (
            <div className="relative mb-1.5 shrink-0">
              <Search
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                aria-hidden
              />
              <input
                ref={searchRef}
                type="text"
                role="combobox"
                aria-expanded
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={active >= 0 ? optionId(active) : undefined}
                aria-label={searchPlaceholder}
                autoComplete="off"
                value={query}
                placeholder={searchPlaceholder}
                onChange={(e) => onSearch(e.target.value)}
                onKeyDown={onKeyDown}
                className="border-border bg-muted placeholder:text-muted-foreground focus-visible:ring-primary/50 h-9 w-full rounded-lg border pr-3 pl-9 text-sm focus-visible:ring-2 focus-visible:outline-none"
              />
            </div>
          )}

          <ul
            id={listId}
            role="listbox"
            aria-multiselectable={props.multiple || undefined}
            aria-label={ariaLabel ?? placeholder}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          >
            {entries.length === 0 && (
              <li
                role="presentation"
                className="text-muted-foreground px-3 py-6 text-center text-sm"
              >
                {emptyText}
              </li>
            )}
            {entries.map(({ option, create }, i) => {
              const isSelected = selected.includes(option.value);
              const header =
                !create && option.group && option.group !== entries[i - 1]?.option.group
                  ? option.group
                  : null;
              return (
                <li key={`${option.value}-${create ? "new" : i}`} role="presentation">
                  {header && (
                    <p className="text-muted-foreground px-3 pt-2 pb-1 text-xs font-medium">
                      {header}
                    </p>
                  )}
                  <div
                    id={optionId(i)}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={option.disabled || undefined}
                    onMouseDown={(e) => e.preventDefault()}
                    onPointerMove={() => {
                      if (i !== active && !option.disabled) setActive(i);
                    }}
                    onClick={() => pick(option)}
                    className={cn(
                      "flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                      i === active && "bg-muted",
                      isSelected && "text-primary-strong font-medium",
                      option.disabled && "cursor-not-allowed opacity-50",
                    )}
                  >
                    {props.multiple && (
                      <span
                        aria-hidden
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-surface",
                        )}
                      >
                        {isSelected && <Check className="size-3" strokeWidth={3} />}
                      </span>
                    )}
                    {create && <Plus className="text-primary size-4 shrink-0" aria-hidden />}
                    {option.icon}
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">{option.label}</span>
                      {option.description && (
                        <span className="text-muted-foreground truncate text-xs font-normal">
                          {option.description}
                        </span>
                      )}
                    </span>
                    {!props.multiple && isSelected && (
                      <Check className="text-primary size-4 shrink-0" aria-hidden />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
