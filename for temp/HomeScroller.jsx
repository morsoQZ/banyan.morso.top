"use client";

import {
    Children,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import styles from "./HomeScroller.module.css";

const WHEEL_END_DELAY = 140;
const SETTLE_DURATION = 420;
const PAGE_THRESHOLD_RATIO = 0.18;
const WHEEL_SENSITIVITY = 0.75;

function clamp(value, minimum, maximum) {
    return Math.min(Math.max(value, minimum), maximum);
}

function normalizeWheelDelta(event, viewportHeight) {
    if (event.deltaMode === 1) {
        return event.deltaY * 16;
    }

    if (event.deltaMode === 2) {
        return event.deltaY * viewportHeight;
    }

    return event.deltaY;
}

function isInteractiveElement(target) {
    return Boolean(
        target.closest?.(
            "a, button, input, textarea, select, [contenteditable='true']",
        ),
    );
}

export default function HomeScroller({ children }) {
    const pages = Children.toArray(children);
    const pageCount = pages.length;
    const lastPageIndex = pageCount - 1;

    const [currentPage, setCurrentPage] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const [isWheelActive, setIsWheelActive] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    const scrollerRef = useRef(null);
    const currentPageRef = useRef(0);
    const dragOffsetRef = useRef(0);
    const isAnimatingRef = useRef(false);
    const wheelEndTimerRef = useRef(null);
    const animationTimerRef = useRef(null);
    const wheelFrameRef = useRef(null);
    const pendingWheelDeltaRef = useRef(0);
    const pointerStartYRef = useRef(null);
    const pointerStartOffsetRef = useRef(0);

    const updateCurrentPage = useCallback((pageIndex) => {
        currentPageRef.current = pageIndex;
        setCurrentPage(pageIndex);
    }, []);

    const updateDragOffset = useCallback((offset) => {
        dragOffsetRef.current = offset;
        setDragOffset(offset);
    }, []);

    const updateAnimationState = useCallback((animating) => {
        isAnimatingRef.current = animating;
        setIsAnimating(animating);
    }, []);

    const animateTo = useCallback(
        ({ targetOffset, nextPage = null }) => {
            if (isAnimatingRef.current) {
                return;
            }

            if (prefersReducedMotion) {
                if (nextPage !== null) {
                    updateCurrentPage(nextPage);
                }

                updateDragOffset(0);
                return;
            }

            updateAnimationState(true);
            updateDragOffset(targetOffset);

            window.clearTimeout(animationTimerRef.current);
            animationTimerRef.current = window.setTimeout(() => {
                if (nextPage !== null) {
                    updateCurrentPage(nextPage);
                }

                updateDragOffset(0);
                updateAnimationState(false);
            }, SETTLE_DURATION);
        },
        [
            prefersReducedMotion,
            updateAnimationState,
            updateCurrentPage,
            updateDragOffset,
        ],
    );

    const settleDrag = useCallback(
        (viewportHeight) => {
            const offset = dragOffsetRef.current;

            if (Math.abs(offset) < 0.5) {
                updateDragOffset(0);
                return;
            }

            const direction = offset < 0 ? 1 : -1;
            const nextPage = currentPageRef.current + direction;
            const isPageAvailable =
                nextPage >= 0 && nextPage <= lastPageIndex;
            const threshold = viewportHeight * PAGE_THRESHOLD_RATIO;
            const shouldChangePage =
                isPageAvailable && Math.abs(offset) >= threshold;

            animateTo({
                targetOffset: shouldChangePage
                    ? -direction * viewportHeight
                    : 0,
                nextPage: shouldChangePage ? nextPage : null,
            });
        },
        [animateTo, lastPageIndex, updateDragOffset],
    );

    const changePage = useCallback(
        (direction) => {
            const scroller = scrollerRef.current;

            if (!scroller || isAnimatingRef.current) {
                return;
            }

            const nextPage = currentPageRef.current + direction;

            if (nextPage < 0 || nextPage > lastPageIndex) {
                return;
            }

            animateTo({
                targetOffset: -direction * scroller.clientHeight,
                nextPage,
            });
        },
        [animateTo, lastPageIndex],
    );

    useEffect(() => {
        const mediaQuery = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        );
        const updatePreference = () => {
            setPrefersReducedMotion(mediaQuery.matches);
        };

        updatePreference();
        mediaQuery.addEventListener("change", updatePreference);

        return () => {
            mediaQuery.removeEventListener("change", updatePreference);
        };
    }, []);

    useEffect(() => {
        const scroller = scrollerRef.current;

        if (!scroller) {
            return undefined;
        }

        function handleWheel(event) {
            if (event.ctrlKey) {
                return;
            }

            event.preventDefault();

            if (isAnimatingRef.current) {
                return;
            }

            setIsWheelActive(true);

            const viewportHeight = scroller.clientHeight;
            const wheelDelta = normalizeWheelDelta(event, viewportHeight);

            pendingWheelDeltaRef.current +=
                wheelDelta * WHEEL_SENSITIVITY;

            if (wheelFrameRef.current === null) {
                wheelFrameRef.current = window.requestAnimationFrame(() => {
                    const nextOffset =
                        dragOffsetRef.current - pendingWheelDeltaRef.current;
                    const minimumOffset =
                        currentPageRef.current === lastPageIndex
                            ? 0
                            : -viewportHeight;
                    const maximumOffset =
                        currentPageRef.current === 0 ? 0 : viewportHeight;

                    pendingWheelDeltaRef.current = 0;
                    wheelFrameRef.current = null;

                    updateDragOffset(
                        clamp(nextOffset, minimumOffset, maximumOffset),
                    );
                });
            }

            window.clearTimeout(wheelEndTimerRef.current);
            wheelEndTimerRef.current = window.setTimeout(() => {
                setIsWheelActive(false);
                settleDrag(scroller.clientHeight);
            }, WHEEL_END_DELAY);
        }

        window.addEventListener("wheel", handleWheel, {
            passive: false,
        });

        return () => {
            window.removeEventListener("wheel", handleWheel);
            window.clearTimeout(wheelEndTimerRef.current);

            if (wheelFrameRef.current !== null) {
                window.cancelAnimationFrame(wheelFrameRef.current);
                wheelFrameRef.current = null;
            }

            pendingWheelDeltaRef.current = 0;
            setIsWheelActive(false);
        };
    }, [lastPageIndex, settleDrag, updateDragOffset]);

    useEffect(() => {
        function handleResize() {
            window.clearTimeout(wheelEndTimerRef.current);
            window.clearTimeout(animationTimerRef.current);

            if (wheelFrameRef.current !== null) {
                window.cancelAnimationFrame(wheelFrameRef.current);
                wheelFrameRef.current = null;
            }

            pendingWheelDeltaRef.current = 0;
            pointerStartYRef.current = null;
            setIsWheelActive(false);
            updateDragOffset(0);
            updateAnimationState(false);
        }

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            window.clearTimeout(animationTimerRef.current);
        };
    }, [updateAnimationState, updateDragOffset]);

    function handlePointerDown(event) {
        if (
            isAnimatingRef.current ||
            isInteractiveElement(event.target) ||
            (event.pointerType === "mouse" && event.button !== 0)
        ) {
            return;
        }

        pointerStartYRef.current = event.clientY;
        pointerStartOffsetRef.current = dragOffsetRef.current;
        window.clearTimeout(wheelEndTimerRef.current);

        if (wheelFrameRef.current !== null) {
            window.cancelAnimationFrame(wheelFrameRef.current);
            wheelFrameRef.current = null;
        }

        pendingWheelDeltaRef.current = 0;
        setIsWheelActive(false);
        event.currentTarget.setPointerCapture(event.pointerId);
    }

    function handlePointerMove(event) {
        if (
            pointerStartYRef.current === null ||
            isAnimatingRef.current
        ) {
            return;
        }

        const viewportHeight = event.currentTarget.clientHeight;
        const pointerDistance = event.clientY - pointerStartYRef.current;
        const nextOffset =
            pointerStartOffsetRef.current + pointerDistance;
        const minimumOffset =
            currentPageRef.current === lastPageIndex
                ? 0
                : -viewportHeight;
        const maximumOffset =
            currentPageRef.current === 0 ? 0 : viewportHeight;

        updateDragOffset(
            clamp(nextOffset, minimumOffset, maximumOffset),
        );
    }

    function finishPointerGesture(event) {
        if (pointerStartYRef.current === null) {
            return;
        }

        pointerStartYRef.current = null;

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }

        settleDrag(event.currentTarget.clientHeight);
    }

    function handleKeyDown(event) {
        if (isInteractiveElement(event.target)) {
            return;
        }

        if (event.key === "ArrowDown" || event.key === "PageDown") {
            event.preventDefault();
            changePage(1);
        }

        if (event.key === "ArrowUp" || event.key === "PageUp") {
            event.preventDefault();
            changePage(-1);
        }
    }

    const scrollerClassName = [
        styles.scroller,
        isWheelActive ? styles.isWheelActive : "",
        isAnimating ? styles.isAnimating : "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <main
            ref={scrollerRef}
            className={scrollerClassName}
            style={{ "--drag-offset": `${dragOffset}px` }}
            role="region"
            aria-label="首页全屏分页"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishPointerGesture}
            onPointerCancel={finishPointerGesture}
        >
            {pages.map((page, index) => {
                const pagePosition = (index - currentPage) * 100;
                const isCurrentPage = index === currentPage;

                return (
                    <div
                        key={page.key ?? index}
                        className={styles.page}
                        style={{
                            "--page-position": `${pagePosition}%`,
                        }}
                        aria-hidden={!isCurrentPage}
                        inert={!isCurrentPage}
                    >
                        {page}
                    </div>
                );
            })}

            <nav className={styles.controls} aria-label="首页分页控制">
                <button
                    type="button"
                    disabled={currentPage === 0 || isAnimating}
                    onClick={() => changePage(-1)}
                    aria-label="上一页"
                >
                    ↑
                </button>

                <span className={styles.pageStatus} aria-live="polite">
                    {String(currentPage + 1).padStart(2, "0")} /{" "}
                    {String(pageCount).padStart(2, "0")}
                </span>

                <button
                    type="button"
                    disabled={
                        currentPage === lastPageIndex || isAnimating
                    }
                    onClick={() => changePage(1)}
                    aria-label="下一页"
                >
                    ↓
                </button>
            </nav>
        </main>
    );
}
