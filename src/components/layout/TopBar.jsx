import "@/styles/TopBar.css";
import Link from "next/link";
import SegmentedControl from "@/components/ui/SegmentedControl";
import navigationItems from "@/data/navigation_items";

export default function TopBar() {
    return (
        <header className="top-bar">
            <div className="bar-brand">
                <Link href="/" className="brand-text">
                    <span>
                        <span style={{ color: "#60cf6f" }}>banyan</span>
                        {".morso.top"}
                    </span>
                </Link>
            </div>
            <div className="bar-selector">
                <SegmentedControl items={navigationItems} />
            </div>
            <div className="bar-buttons"></div>
        </header>
    );
}
