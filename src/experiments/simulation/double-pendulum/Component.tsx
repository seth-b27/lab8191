"use client";

import React, { useEffect, useRef, useCallback } from "react";


export interface PendulumConfig {
    theta1: number;
    theta2: number;
    m1: number;
    m2: number;
    l1: number;
    l2: number;
    gravity: number;
    dt: number;
    substeps: number;
    scale: number;
    bobBaseRadius: number;
    bobMassScale: number;
    pivotColor: string;
    arm1Color: string;
    arm2Color: string;
    bob1Color: string;
    bob2Color: string;
    armStrokeWidth: number;
    pivotRadius: number;
}

type StateVector = [number, number, number, number];

const DEFAULT_CONFIG: PendulumConfig = {
    theta1: 90,
    theta2: 180,
    m1: 0.6,
    m2: 0.6,
    l1: 0.6,
    l2: 0.6,
    gravity: 9.81,
    dt: 0.008,
    substeps: 2,
    scale: 100,
    bobBaseRadius: 6,
    bobMassScale: 3,
    pivotColor: "#000000",
    arm1Color: "#1a1a1a",
    arm2Color: "#1a1a1a",
    bob1Color: "#0000ee",
    bob2Color: "#0000ee",
    armStrokeWidth: 2.5,
    pivotRadius: 6,
};

function derivatives(
    [th1, th2, w1, w2]: StateVector,
    cfg: PendulumConfig
): StateVector {
    const { m1, m2, l1, l2, gravity: g } = cfg;
    const d = th1 - th2;
    const sinD = Math.sin(d);
    const cosD = Math.cos(d);
    const denom = 2 * m1 + m2 - m2 * Math.cos(2 * d);

    const a1 =
        (
            -g * (2 * m1 + m2) * Math.sin(th1)
            - m2 * g * Math.sin(th1 - 2 * th2)
            - 2 * sinD * m2 * (w2 * w2 * l2 + w1 * w1 * l1 * cosD)
        ) / (l1 * denom);

    const a2 =
        (
            2 * sinD * (
                w1 * w1 * l1 * (m1 + m2)
                + g * (m1 + m2) * Math.cos(th1)
                + w2 * w2 * l2 * m2 * cosD
            )
        ) / (l2 * denom);

    return [w1, w2, a1, a2];
}


function rk4(y: StateVector, cfg: PendulumConfig): StateVector {
    const { dt } = cfg;
    const k1 = derivatives(y, cfg);
    const k2 = derivatives(y.map((v, i) => v + 0.5 * dt * k1[i]) as StateVector, cfg);
    const k3 = derivatives(y.map((v, i) => v + 0.5 * dt * k2[i]) as StateVector, cfg);
    const k4 = derivatives(y.map((v, i) => v + dt * k3[i]) as StateVector, cfg);
    return y.map(
        (v, i) => v + (dt * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])) / 6
    ) as StateVector;
}

function getPositions(
    th1: number,
    th2: number,
    pivotX: number,
    pivotY: number,
    cfg: PendulumConfig
) {
    const { l1, l2, scale } = cfg;
    const x1 = pivotX + l1 * scale * Math.sin(th1);
    const y1 = pivotY + l1 * scale * Math.cos(th1);
    const x2 = x1 + l2 * scale * Math.sin(th2);
    const y2 = y1 + l2 * scale * Math.cos(th2);
    return { x1, y1, x2, y2 };
}

interface DoublePendulumProps {
    config?: Partial<PendulumConfig>;
    className?: string;
    style?: React.CSSProperties;
}

export default function DoublePendulum({
    config: configOverride,
    className,
    style,
}: DoublePendulumProps) {

    const cfg: PendulumConfig = { ...DEFAULT_CONFIG, ...configOverride };

    const svgRef = useRef<SVGSVGElement>(null);
    const arm1Ref = useRef<SVGLineElement>(null);
    const arm2Ref = useRef<SVGLineElement>(null);
    const pivotRef = useRef<SVGCircleElement>(null);
    const bob1Ref = useRef<SVGCircleElement>(null);
    const bob2Ref = useRef<SVGCircleElement>(null);

    const stateRef = useRef<StateVector>([
        (cfg.theta1 * Math.PI) / 180,
        (cfg.theta2 * Math.PI) / 180,
        0,
        0,
    ]);
    const rafRef = useRef<number>(0);
    const sizeRef = useRef({ w: 0, h: 0 });

    const handleResize = useCallback(() => {
        const svg = svgRef.current;
        if (!svg) return;

        const parent = svg.parentElement
        const w = parent instanceof HTMLElement ? parent.offsetWidth : svg.clientWidth
        const h = parent instanceof HTMLElement ? parent.offsetHeight : svg.clientHeight

        sizeRef.current = { w, h };

        svg.setAttribute("width", String(w));
        svg.setAttribute("height", String(h));
        svg.setAttribute("viewBox", `0 0 ${w} ${h}`);

        // Reposition the static pivot to the centre
        const px = w / 2;
        const py = h / 2;
        pivotRef.current?.setAttribute("cx", String(px));
        pivotRef.current?.setAttribute("cy", String(py));
    }, []);

    const tick = useCallback(() => {
        for (let i = 0; i < cfg.substeps; i++) {
            stateRef.current = rk4(stateRef.current, cfg);
        }

        const { w, h } = sizeRef.current;
        const [th1, th2] = stateRef.current;
        const { x1, y1, x2, y2 } = getPositions(th1, th2, w / 2, h / 2, cfg);

        const a1 = arm1Ref.current;
        const a2 = arm2Ref.current;
        const b1 = bob1Ref.current;
        const b2 = bob2Ref.current;

        if (a1) {
            a1.setAttribute("x1", String(w / 2)); a1.setAttribute("y1", String(h / 2));
            a1.setAttribute("x2", String(x1)); a1.setAttribute("y2", String(y1));
        }
        if (a2) {
            a2.setAttribute("x1", String(x1)); a2.setAttribute("y1", String(y1));
            a2.setAttribute("x2", String(x2)); a2.setAttribute("y2", String(y2));
        }
        if (b1) { b1.setAttribute("cx", String(x1)); b1.setAttribute("cy", String(y1)); }
        if (b2) { b2.setAttribute("cx", String(x2)); b2.setAttribute("cy", String(y2)); }

        rafRef.current = requestAnimationFrame(tick);
    }, [cfg]);

    useEffect(() => {
        handleResize();

        const ro = new ResizeObserver(handleResize);
        if (svgRef.current?.parentElement) {
            ro.observe(svgRef.current.parentElement);
        }

        rafRef.current = requestAnimationFrame(tick);

        return () => {
            ro.disconnect();
            cancelAnimationFrame(rafRef.current);
        };
    }, [handleResize, tick]);

    const r1 = cfg.bobBaseRadius + cfg.m1 * cfg.bobMassScale;
    const r2 = cfg.bobBaseRadius + cfg.m2 * cfg.bobMassScale;


    return (
        <svg
            ref={svgRef}
            className={className}
            style={style}
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Double pendulum animation"
            aria-hidden="true"
        >
            {/* Arm 1 — pivot to bob 1 */}
            <line
                ref={arm1Ref}
                stroke={cfg.arm1Color}
                strokeWidth={cfg.armStrokeWidth}
                strokeLinecap="round"
            />

            {/* Arm 2 — bob 1 to bob 2 */}
            <line
                ref={arm2Ref}
                stroke={cfg.arm2Color}
                strokeWidth={cfg.armStrokeWidth}
                strokeLinecap="round"
            />

            {/* Fixed pivot */}
            <circle
                ref={pivotRef}
                r={cfg.pivotRadius}
                fill={cfg.pivotColor}
            />

            {/* Bob 1 */}
            <circle
                ref={bob1Ref}
                r={r1}
                fill={cfg.bob1Color}
            />

            {/* Bob 2 */}
            <circle
                ref={bob2Ref}
                r={r2}
                fill={cfg.bob2Color}
            />
        </svg>
    );
}