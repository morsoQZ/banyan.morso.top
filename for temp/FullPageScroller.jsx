"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./FullPageScroller.module.css";

const PHASE = {
    IDLE: "idle",
    WHEEL: "wheel",
    DRAGGING: "dragging",
    SETTLING: "settling",
};

const WHEEL_IGNORE_SELECTOR = [
    "input",
    "textarea",
    "select",
    "[contenteditable='true']",
    "[data-fps-ignore]",
].join(", ");

const POINTER_IGNORE_SELECTOR = [
    "a",
    "button",
    "input",
    "textarea",
    "select",
    "summary",
    "[contenteditable='true']",
    "[data-fps-ignore]",
].join(", ");

function clamp(value, minimum, maximum) {
    return Math.min(Math.max(value, minimum), maximum);
}

function getInitialPage(initialPage, pageCount) {
    if (pageCount === 0) {
        return 0;
    }

    const pageIndex = Number.isFinite(initialPage)
        ? Math.trunc(initialPage)
        : 0;

    return clamp(pageIndex, 0, pageCount - 1);
}

function normalizeWheelDelta(event, viewportHeight) {
    if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
        return event.deltaY * 16;
    }

    if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
        return event.deltaY * viewportHeight;
    }

    return event.deltaY;
}

function matchesClosest(target, selector) {
    return Boolean(target.closest?.(selector));
}

function findScrollableAncestor(target, boundary) {
    let element = target instanceof Element ? target : null;

    while (element && element !== boundary) {
        const { overflowY } = window.getComputedStyle(element);
        const hasScrollableOverflow = /(auto|scroll|overlay)/.test(overflowY);

        if (
            hasScrollableOverflow &&
            element.scrollHeight > element.clientHeight
        ) {
            return element;
        }

        element = element.parentElement;
    }

    return null;
}

function canScrollInDirection(element, deltaY) {
    if (!element) {
        return false;
    }

    const isAtTop = element.scrollTop <= 0;
    const isAtBottom =
        element.scrollTop + element.clientHeight >= element.scrollHeight - 1;

    return (deltaY < 0 && !isAtTop) || (deltaY > 0 && !isAtBottom);
}

export default function FullPageScroller({
    pages = [],
    className,
    style,
    initialPage = 0,
    wheelSensitivity = 0.75,
    wheelEndDelay = 140,
    threshold = 0.18,
    settleDuration = 420,
    onPageChange,
    role = "region",
    tabIndex = 0,
    onKeyDown,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onTransitionEnd,
    ...rootProps
}) {
    const pageCount = pages.length;
    const lastPageIndex = pageCount - 1;
    const startingPage = getInitialPage(initialPage, pageCount);

    const [currentPage, setCurrentPage] = useState(startingPage);
    const [dragOffset, setDragOffset] = useState(0);
    const [phase, setPhase] = useState(PHASE.IDLE);

    const scrollerRef = useRef(null);
    const currentPageRef = useRef(startingPage);
    const dragOffsetRef = useRef(0);
    const phaseRef = useRef(PHASE.IDLE);
    const pendingPageRef = useRef(null);

    const wheelDeltaRef = useRef(0);
    const wheelFrameRef = useRef(null);
    const wheelEndTimerRef = useRef(null);
    const settleFallbackTimerRef = useRef(null);

    const pointerIdRef = useRef(null);
    const pointerStartYRef = useRef(0);
    const pointerStartOffsetRef = useRef(0);

    const updateCurrentPage = useCallback((pageIndex) => {
        currentPageRef.current = pageIndex;
        setCurrentPage(pageIndex);
    }, []);

    const updateDragOffset = useCallback((offset) => {
        dragOffsetRef.current = offset;
        setDragOffset(offset);
    }, []);

    const updatePhase = useCallback((nextPhase) => {
        phaseRef.current = nextPhase;
        setPhase(nextPhase);
    }, []);

    const finishSettle = useCallback(() => {
        if (phaseRef.current !== PHASE.SETTLING) {
            return;
        }

        window.clearTimeout(settleFallbackTimerRef.current);

        const nextPage = pendingPageRef.current;
        pendingPageRef.current = null;

        if (nextPage !== null) {
            updateCurrentPage(nextPage);
        }

        updateDragOffset(0);
        updatePhase(PHASE.IDLE);

        if (nextPage !== null) {
            onPageChange?.(nextPage, pages[nextPage]);
        }
    }, [onPageChange, pages, updateCurrentPage, updateDragOffset, updatePhase]);

    const beginSettle = useCallback(
        (targetOffset, nextPage = null) => {
            const duration = Math.max(0, settleDuration);
            const prefersReducedMotion = window.matchMedia(
                "(prefers-reduced-motion: reduce)",
            ).matches;

            if (duration === 0 || prefersReducedMotion) {
                pendingPageRef.current = null;

                if (nextPage !== null) {
                    updateCurrentPage(nextPage);
                }

                updateDragOffset(0);
                updatePhase(PHASE.IDLE);

                if (nextPage !== null) {
                    onPageChange?.(nextPage, pages[nextPage]);
                }

                return;
            }

            pendingPageRef.current = nextPage;
            updatePhase(PHASE.SETTLING);
            updateDragOffset(targetOffset);

            window.clearTimeout(settleFallbackTimerRef.current);
            settleFallbackTimerRef.current = window.setTimeout(
                finishSettle,
                duration + 100,
            );
        },
        [
            finishSettle,
            onPageChange,
            pages,
            settleDuration,
            updateCurrentPage,
            updateDragOffset,
            updatePhase,
        ],
    );

    const settleDrag = useCallback(
        (viewportHeight) => {
            if (viewportHeight <= 0 || phaseRef.current === PHASE.SETTLING) {
                return;
            }

            const offset = dragOffsetRef.current;

            if (Math.abs(offset) < 0.5) {
                updateDragOffset(0);
                updatePhase(PHASE.IDLE);
                return;
            }

            const direction = offset < 0 ? 1 : -1;
            const nextPage = currentPageRef.current + direction;
            const pageExists = nextPage >= 0 && nextPage <= lastPageIndex;
            const thresholdRatio = clamp(threshold, 0, 1);
            const shouldChangePage =
                pageExists &&
                Math.abs(offset) >= viewportHeight * thresholdRatio;

            beginSettle(
                shouldChangePage ? -direction * viewportHeight : 0,
                shouldChangePage ? nextPage : null,
            );
        },
        [beginSettle, lastPageIndex, threshold, updateDragOffset, updatePhase],
    );

    const changePage = useCallback(
        (direction) => {
            const scroller = scrollerRef.current;

            if (!scroller || phaseRef.current !== PHASE.IDLE) {
                return;
            }

            const nextPage = currentPageRef.current + direction;

            if (nextPage < 0 || nextPage > lastPageIndex) {
                return;
            }

            beginSettle(-direction * scroller.clientHeight, nextPage);
        },
        [beginSettle, lastPageIndex],
    );

    useEffect(() => {
        const scroller = scrollerRef.current;

        if (!scroller || pageCount < 2) {
            return undefined;
        }

        function handleWheel(event) {
            if (
                event.ctrlKey ||
                matchesClosest(event.target, WHEEL_IGNORE_SELECTOR)
            ) {
                return;
            }

            const viewportHeight = scroller.clientHeight;
            const wheelDelta = normalizeWheelDelta(event, viewportHeight);

            if (wheelDelta === 0) {
                return;
            }

            const scrollableAncestor = findScrollableAncestor(
                event.target,
                scroller,
            );

            if (canScrollInDirection(scrollableAncestor, wheelDelta)) {
                return;
            }

            const currentPageIndex = currentPageRef.current;
            const currentOffset = dragOffsetRef.current;
            const leavingFirstPage =
                currentPageIndex === 0 && currentOffset >= 0 && wheelDelta < 0;
            const leavingLastPage =
                currentPageIndex === lastPageIndex &&
                currentOffset <= 0 &&
                wheelDelta > 0;

            if (leavingFirstPage || leavingLastPage) {
                return;
            }

            event.preventDefault();

            if (
                phaseRef.current === PHASE.SETTLING ||
                phaseRef.current === PHASE.DRAGGING
            ) {
                return;
            }

            updatePhase(PHASE.WHEEL);
            wheelDeltaRef.current += wheelDelta * Math.max(0, wheelSensitivity);

            if (wheelFrameRef.current === null) {
                wheelFrameRef.current = window.requestAnimationFrame(() => {
                    const nextOffset =
                        dragOffsetRef.current - wheelDeltaRef.current;
                    const minimumOffset =
                        currentPageRef.current === lastPageIndex
                            ? 0
                            : -viewportHeight;
                    const maximumOffset =
                        currentPageRef.current === 0 ? 0 : viewportHeight;

                    wheelDeltaRef.current = 0;
                    wheelFrameRef.current = null;

                    updateDragOffset(
                        clamp(nextOffset, minimumOffset, maximumOffset),
                    );
                });
            }

            window.clearTimeout(wheelEndTimerRef.current);
            wheelEndTimerRef.current = window.setTimeout(
                () => settleDrag(scroller.clientHeight),
                Math.max(0, wheelEndDelay),
            );
        }

        scroller.addEventListener("wheel", handleWheel, {
            passive: false,
        });

        return () => {
            scroller.removeEventListener("wheel", handleWheel);
            window.clearTimeout(wheelEndTimerRef.current);

            if (wheelFrameRef.current !== null) {
                window.cancelAnimationFrame(wheelFrameRef.current);
            }

            wheelFrameRef.current = null;
            wheelDeltaRef.current = 0;
        };
    }, [
        lastPageIndex,
        pageCount,
        settleDrag,
        updateDragOffset,
        updatePhase,
        wheelEndDelay,
        wheelSensitivity,
    ]);

    useEffect(() => {
        return () => {
            window.clearTimeout(settleFallbackTimerRef.current);
        };
    }, []);

    function handlePointerDown(event) {
        const scrollableAncestor = findScrollableAncestor(
            event.target,
            event.currentTarget,
        );

        if (
            pageCount < 2 ||
            phaseRef.current === PHASE.SETTLING ||
            matchesClosest(event.target, POINTER_IGNORE_SELECTOR) ||
            scrollableAncestor ||
            (event.pointerType === "mouse" && event.button !== 0)
        ) {
            return;
        }

        window.clearTimeout(wheelEndTimerRef.current);

        if (wheelFrameRef.current !== null) {
            window.cancelAnimationFrame(wheelFrameRef.current);
            wheelFrameRef.current = null;
        }

        wheelDeltaRef.current = 0;
        pointerIdRef.current = event.pointerId;
        pointerStartYRef.current = event.clientY;
        pointerStartOffsetRef.current = dragOffsetRef.current;

        updatePhase(PHASE.DRAGGING);
        event.currentTarget.setPointerCapture(event.pointerId);
    }

    function handlePointerMove(event) {
        if (
            pointerIdRef.current !== event.pointerId ||
            phaseRef.current !== PHASE.DRAGGING
        ) {
            return;
        }

        const viewportHeight = event.currentTarget.clientHeight;
        const pointerDistance = event.clientY - pointerStartYRef.current;
        const nextOffset = pointerStartOffsetRef.current + pointerDistance;
        const minimumOffset =
            currentPageRef.current === lastPageIndex ? 0 : -viewportHeight;
        const maximumOffset = currentPageRef.current === 0 ? 0 : viewportHeight;

        updateDragOffset(clamp(nextOffset, minimumOffset, maximumOffset));
    }

    function finishPointerGesture(event) {
        if (pointerIdRef.current !== event.pointerId) {
            return;
        }

        pointerIdRef.current = null;

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }

        settleDrag(event.currentTarget.clientHeight);
    }

    function cancelPointerGesture(event) {
        if (pointerIdRef.current !== event.pointerId) {
            return;
        }

        pointerIdRef.current = null;

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }

        if (Math.abs(dragOffsetRef.current) < 0.5) {
            updatePhase(PHASE.IDLE);
            return;
        }

        beginSettle(0);
    }

    function handleKeyDown(event) {
        if (matchesClosest(event.target, POINTER_IGNORE_SELECTOR)) {
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

    function handleTransitionEnd(event) {
        if (
            event.propertyName === "transform" &&
            phaseRef.current === PHASE.SETTLING
        ) {
            finishSettle();
        }
    }

    function handleRootKeyDown(event) {
        onKeyDown?.(event);

        if (!event.defaultPrevented) {
            handleKeyDown(event);
        }
    }

    function handleRootPointerDown(event) {
        onPointerDown?.(event);

        if (!event.defaultPrevented) {
            handlePointerDown(event);
        }
    }

    function handleRootPointerMove(event) {
        onPointerMove?.(event);

        if (!event.defaultPrevented) {
            handlePointerMove(event);
        }
    }

    function handleRootPointerUp(event) {
        onPointerUp?.(event);

        if (!event.defaultPrevented) {
            finishPointerGesture(event);
        }
    }

    function handleRootPointerCancel(event) {
        onPointerCancel?.(event);

        if (!event.defaultPrevented) {
            cancelPointerGesture(event);
        }
    }

    function handleRootTransitionEnd(event) {
        onTransitionEnd?.(event);

        if (!event.defaultPrevented) {
            handleTransitionEnd(event);
        }
    }

    const scrollerClassName = [styles.scroller, className]
        .filter(Boolean)
        .join(" ");

    return (
        <div
            {...rootProps}
            ref={scrollerRef}
            className={scrollerClassName}
            style={{
                ...style,
                "--fps-drag-offset": `${dragOffset}px`,
                "--fps-settle-duration": `${Math.max(0, settleDuration)}ms`,
            }}
            data-phase={phase}
            role={role}
            tabIndex={pageCount > 0 ? tabIndex : -1}
            onKeyDown={handleRootKeyDown}
            onPointerDown={handleRootPointerDown}
            onPointerMove={handleRootPointerMove}
            onPointerUp={handleRootPointerUp}
            onPointerCancel={handleRootPointerCancel}
            onTransitionEnd={handleRootTransitionEnd}
        >
            {pages.map((page, index) => {
                const pagePosition = (index - currentPage) * 100;
                const isCurrentPage = index === currentPage;

                return (
                    <div
                        key={page.id}
                        className={styles.page}
                        style={{
                            "--fps-page-position": `${pagePosition}%`,
                        }}
                        aria-hidden={!isCurrentPage}
                        inert={!isCurrentPage}
                    >
                        {page.content}
                    </div>
                );
            })}
        </div>
    );
}
