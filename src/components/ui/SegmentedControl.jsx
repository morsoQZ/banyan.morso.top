"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import "@/styles/SegmentedControl.css";

function isItemSelected(pathname, href) {
    return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SegmentedControl({ items }) {
    const pathname = usePathname();

    return (
        <div className="segmented-control">
            {items.map((item) => {
                const isExternal = item.href.startsWith("http");
                const isSelected = isItemSelected(pathname, item.href);
                const className = isSelected
                    ? "segmented-control_item is-selected"
                    : "segmented-control_item";

                if (isExternal) {
                    return (
                        <a
                            key={item.id}
                            href={item.href}
                            target="_blank"
                            className="segmented-control_item"
                        >
                            {item.label}
                        </a>
                    );
                }

                return (
                    <Link key={item.id} href={item.href} className={className}>
                        {item.label}
                    </Link>
                );
            })}
        </div>
    );
}
