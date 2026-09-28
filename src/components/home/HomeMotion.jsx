"use client";

import { useEffect } from "react";

export default function HomeMotion() {
    useEffect(() => {
        // 减少动态效果 or 浏览器不支持用来判断元素是否进入窗口
        if (
            window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
            !("IntersectionObserver" in window)
        ) {
            return;
        }

        const elements = document.querySelectorAll("[data-reveal]");

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.removeAttribute("data-reveal-state");
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                rootMargin: "0px 0px -80px 0px",
                threshold: 0,
            },
        );

        elements.forEach((e) => {
            e.setAttribute("data-reveal-state", "waiting");
            observer.observe(e);
        });

        return () => {
            observer.disconnect();
            elements.forEach((e) => {
                e.removeAttribute("data-reveal-state");
            });
        };
    }, []);

    return null;
}
