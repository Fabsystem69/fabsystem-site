"use client";

import { useEffect, useRef, useState } from "react";

type ItemTemplate = {
  id: string;
  label: string;
  unit: string | null;
  defaultUnitPriceCents: number | null;
};

type ItemTemplateComboboxProps = {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onTemplateSelect: (template: ItemTemplate) => void;
};

export function ItemTemplateCombobox({
  value,
  placeholder,
  onChange,
  onTemplateSelect,
}: ItemTemplateComboboxProps) {
  const blurTimeoutRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<ItemTemplate[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);

      try {
        const response = await fetch(
          `/api/internal/item-templates?query=${encodeURIComponent(value)}`,
          { signal: controller.signal }
        );
        const body = (await response.json().catch(() => ({}))) as {
          templates?: ItemTemplate[];
        };

        if (!response.ok) {
          setTemplates([]);
          return;
        }

        setTemplates(body.templates ?? []);
      } catch {
        if (!controller.signal.aborted) {
          setTemplates([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, value.trim() ? 120 : 0);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [value]);

  function handleSelect(template: ItemTemplate) {
    onChange(template.label);
    onTemplateSelect(template);
    setOpen(false);
  }

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurTimeoutRef.current = window.setTimeout(() => setOpen(false), 120);
        }}
        placeholder={placeholder}
        list={undefined}
        className="h-11 w-full rounded-md border border-neutral-300 px-3 text-base"
        autoComplete="off"
      />
      {open && (templates.length > 0 || loading) ? (
        <div className="absolute z-20 mt-2 max-h-60 w-full overflow-y-auto rounded-md border border-neutral-200 bg-white shadow-lg">
          {loading ? (
            <p className="px-3 py-2 text-sm text-neutral-500">Chargement...</p>
          ) : (
            templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  if (blurTimeoutRef.current) {
                    window.clearTimeout(blurTimeoutRef.current);
                  }
                  handleSelect(template);
                }}
                className="flex w-full items-start justify-between gap-3 border-b border-neutral-100 px-3 py-2 text-left last:border-b-0 hover:bg-neutral-50"
              >
                <span className="text-sm text-neutral-900">{template.label}</span>
                {template.defaultUnitPriceCents !== null ? (
                  <span className="whitespace-nowrap text-xs text-neutral-500">
                    {(template.defaultUnitPriceCents / 100).toFixed(2).replace(".", ",")} €
                  </span>
                ) : null}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
