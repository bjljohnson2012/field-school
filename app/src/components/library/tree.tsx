"use client";

import Link from "next/link";
import { useState } from "react";
import { LIBRARY_SECTIONS, moveTreeFocus } from "@/lib/library/m10";

export function LibraryTree() {
  const [index, setIndex] = useState(0);

  return (
    <div
      role="tree"
      aria-label="Library"
      data-library-tree="m10"
      onKeyDown={(event) => {
        const next = moveTreeFocus(LIBRARY_SECTIONS.length, index, event.key);
        if (next === index) return;
        event.preventDefault();
        setIndex(next);
        const items = event.currentTarget.querySelectorAll<HTMLElement>('[role="treeitem"]');
        items[next]?.focus();
      }}
    >
      {LIBRARY_SECTIONS.map((section, sectionIndex) => (
        <div key={section.id} className="m10-tree-row" role="presentation">
          <Link
            href={section.href}
            role="treeitem"
            tabIndex={sectionIndex === index ? 0 : -1}
            data-tree={section.id}
            aria-selected={sectionIndex === index}
          >
            {section.label}
          </Link>
          <Link href={section.href} className="m10-plus" aria-label={`Add in ${section.label}`} data-plus={section.id}>
            +
          </Link>
        </div>
      ))}
    </div>
  );
}
