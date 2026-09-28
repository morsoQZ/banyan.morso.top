"use client";

import { motion } from "motion/react";
import "@/styles/ShiningText.css";

export function ShiningText({ children, className }) {
    const textClassName = ["shining-text", className].filter(Boolean).join(" ");

    return (
        <motion.span
            className={textClassName}
            initial={{ backgroundPosition: "100% 0" }}
            animate={{ backgroundPosition: "0% 0" }}
            transition={{
                repeat: Infinity,
                duration: 2,
                repeatDelay: 3,
                ease: "linear",
            }}
        >
            {children}
        </motion.span>
    );
}
