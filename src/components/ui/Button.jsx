"use client";

import "@/styles/Button.css";

export default function Button({
    children,
    className,
    href,
    "is-highlighted": isHighlighted = false,
    type = "button",
    ...buttonProps
}) {
    const buttonClassName = [
        "customized-button",
        className,
        isHighlighted && "is-highlighted",
    ]
        .filter(Boolean)
        .join(" ");

    const bgColor = isHighlighted
        ? "var(--color-capsule)"
        : "var(--color-capsule-no-highlight)";

    const bgColorPressed = isHighlighted
        ? "var(--color-capsule-pressed)"
        : "var(--color-capsule-no-highlight-pressed)";

    const buttonStyle = {
        "--bg-color": bgColor,
        "--bg-color-pressed": bgColorPressed,
    };

    if (href) {
        return (
            <a
                {...buttonProps}
                href={href}
                className={buttonClassName}
                style={buttonStyle}
            >
                {children}
            </a>
        );
    }

    return (
        <button
            {...buttonProps}
            className={buttonClassName}
            type={type}
            style={buttonStyle}
        >
            {children}
        </button>
    );
}
