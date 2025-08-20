import  { useMemo, useRef, useLayoutEffect, useState } from "react";
import { motion } from "framer-motion";
// import agentgif from '../assets/AgentStart.gif'

// import processgif from '../assets/process.gif'

type Anchor =
  | "top-left"
  | "top-center-left"
  | "top-center"
  | "top-center-right"
  | "top-right"
  | "center-left"
  | "center"
  | "center-right"
  | "bottom-left"
  | "bottom-center-left"
  | "bottom-center"
  | "bottom-center-right"
  | "bottom-right";

type NodeKey = "AGENT" | "PROC" | "AN" | "REP";

type NodeDef = {
  key: NodeKey;
  label: string;
  img: string;
  anchor: Anchor;
  dx?: number;
  dy?: number;
};

// Durations (seconds)
const T_NODE = 0.6; // node fade-in
const T_SEG = 1.2; // line segment
const GAP = 0.15;

const baseLine = {
  stroke: "#ffffff",
  strokeWidth: 2,
  vectorEffect: "non-scaling-stroke" as const,
};

// Icon/GIF rendering size (must match <img width/height>)
const ICON_W = 36;
const ICON_H = 36;
const HALF_W = ICON_W / 2;
const HALF_H = ICON_H / 2;




export default function AiFlowDiagram() {
  // Container reference to compute responsive layout
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 920, h: 560 });

  // Observe container size for responsive anchors
  useLayoutEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Define nodes with anchors (change these anchors later; lines adapt)
  const nodes: NodeDef[] = [
    {
      key: "AGENT",
      label: "Agent Started",
      img: "../assets/AgentStart.gif",
      anchor: "center-left",
      dx: 20, 
      dy: -20,
    },
    {
      key: "PROC",
      label: "Processing Data Source",
      img:"./assets/process.gif",
      anchor: "top-right",
      dx: -120, 
      dy: 30,
    },
    {
      key: "AN",
      label: "Analysing Incident",
      img: "./assets/process.gif",
      anchor: "center-right",
      dx: -108, 
      dy: -20, 
    },
    {
      key: "REP",
      label: "Generating Report",
      img: "/report.gif",
      anchor: "bottom-right",
      dx: -108, 
      dy: -60, 
    },
  ];

  // Compute absolute coordinates for each anchor
  const coords = useMemo(() => {
    const { w, h } = size;
    const mapAnchor = (a: Anchor): { x: number; y: number } => {
      switch (a) {
        case "top-left":
          return { x: 0, y: 0 };
        case "top-center-left":
          return { x: w * 0.33, y: 0 };
        case "top-center":
          return { x: w * 0.5, y: 0 };
        case "top-center-right":
          return { x: w * 0.67, y: 0 };
        case "top-right":
          return { x: w, y: 0 };
        case "center-left":
          return { x: 0, y: h * 0.5 };
        case "center":
          return { x: w * 0.5, y: h * 0.5 };
        case "center-right":
          return { x: w, y: h * 0.5 };
        case "bottom-left":
          return { x: 0, y: h };
        case "bottom-center-left":
          return { x: w * 0.33, y: h };
        case "bottom-center":
          return { x: w * 0.5, y: h };
        case "bottom-center-right":
          return { x: w * 0.67, y: h };
        case "bottom-right":
          return { x: w, y: h };
        default:
          return { x: w * 0.5, y: h * 0.5 };
      }
    };

    const dict: Record<NodeKey, { x: number; y: number; label: string; img: string }> = {
      AGENT: { x: 0, y: 0, label: "", img: "" },
      PROC: { x: 0, y: 0, label: "", img: "" },
      AN: { x: 0, y: 0, label: "", img: "" },
      REP: { x: 0, y: 0, label: "", img: "" },
    };

    nodes.forEach((n) => {
      const p = mapAnchor(n.anchor);
      dict[n.key] = {
        x: p.x + (n.dx ?? 0),
        y: p.y + (n.dy ?? 0),
        label: n.label,
        img: n.img,
      };
    });

    return dict;
  }, [nodes, size]);

  const AG = coords.AGENT;
  const PR = coords.PROC;
  const AN = coords.AN;
  const RE = coords.REP;

  // Timeline (based on flow)
  const t1_agent_in = 0;

  // 2) Agent → Processing (L: up then right)
  // animate as two segments: vertical then horizontal.
  // The vertical goes from Agent.y toward Processing.y directionally.
  const t2_up_start = t1_agent_in + T_NODE + GAP;
  const t2_up_end = t2_up_start + T_SEG;
  const t2_right_start = t2_up_end;
  const t2_right_end = t2_right_start + T_SEG;

  // 3) Processing appears
  const t3_proc_in = t2_right_end + GAP;

  // 4) Parallel: Processing↓Analyzing and Agent→Analyzing
  const t4_parallel_start = t3_proc_in + T_NODE + GAP;
  const t4_end = t4_parallel_start + T_SEG;

  // 5) Analysing appears
  const t5_an_in = t4_end + GAP;

  // 6) Parallel: Analysing↓Report and Agent L→Report (down then right)
  const t6_parallel_start = t5_an_in + T_NODE + GAP;
  const t6_agent_right_start = t6_parallel_start + T_SEG + 0.01;
  const t6_end = t6_agent_right_start + T_SEG;

  // 7) Report appears
  const t7_rep_in = t6_end + GAP;

  // Helpers to derive oriented segments from current positions:
  // Agent→Processing: vertical leg from AG.y to PR.y, but x at AG.x
  const distanceX = Math.abs(PR.x - AG.x);
  const distanceY = Math.abs(PR.y - AG.y);
  
  // If nodes are too close, adjust the line path
  const AtoP_vert = {
    x1: AG.x + HALF_W + 15, // Start slightly more towards the right side of Agent node
    y1: AG.y-10, // Start from center of Agent node
    x2: AG.x + HALF_W + 15, // Keep vertical line shorter
    y2: PR.y + HALF_H, // End at bottom of Processing node (lower position)
  };

  // then horizontal leg from AG.x to PR.x at y=PR.y
  const AtoP_horz = {
    x1: AG.x + HALF_W + 15, // Start from same X as line 1 ends
    y1: PR.y + HALF_H, // Start lower (at bottom of Processing node)
    x2: PR.x + 30, // End further to the right to extend the line
    y2: PR.y + HALF_H, // Same Y level as start
  };

  // Processing→Analyzing: vertical leg at PR.x from PR.y to AN.y
  const PtoA_vert = {
    x1: PR.x + 55, // Start more to the left of Processing node
    y1: AN.y - HALF_H,// Start even lower to make line shorter from top
    x2: PR.x + 55, // End more to the left of Analyzing node
    y2:  PR.y + HALF_H + 45, // End at top edge of Analyzing node
  };

  // Agent→Analyzing: horizontal at y=AN.y from AG.x to AN.x
  const distanceX_AN = Math.abs(AN.x - AG.x);
  const AtoA_horz = {
    x1: AG.x + HALF_W + 40, // Start even further to the right of Agent node
    y1: AN.y + 15, // Shift down from center Y of Analyzing node
    x2: AN.x - HALF_W + 30, // Extend even more to the right of Analyzing node
    y2: AN.y + 15, // Same Y level as start
  };

  // Analysing→Report: vertical at AN.x from AN.y to RE.y
  const AtoR_vert = {
    x1: AN.x + 45, // Shift slightly to the left
    y1: AN.y + HALF_H + 40,// Start from top (Analyzing node)
    x2: AN.x + 45, // Shift slightly to the left
    y2:  RE.y - HALF_H +10,// End at bottom (Report node)
  };

  // Agent→Report L: vertical at AG.x from AG.y to RE.y, then horizontal at y=RE.y from AG.x to RE.x
  const distanceX_RE = Math.abs(RE.x - AG.x);
  const AtoR_vert_fromAgent = {
    x1: AG.x + HALF_W + 13, // Start slightly more to the right
    y1: AG.y + 60, // Start much lower from Agent node
    x2: AG.x + HALF_W + 13, // Keep vertical line at same X
    y2: RE.y - HALF_H + 30, // End lower (more down)
  };
  const AtoR_horz_fromAgent = {
    x1: AG.x + HALF_W + 13, // Start from same X as line 6 ends
    y1: RE.y - HALF_H + 30, // At lower position (more down)
    x2: RE.x - HALF_W + 30, // Extend further to the right of Report node
    y2: RE.y - HALF_H + 30, // Same Y level as start
  };

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 400,
        maxHeight: 400,
        // aspectRatio: "920/800",
        margin: "0",
        borderRadius: 12,
        overflow: "hidden",
        color: "#fff",
        fontFamily: "Inter, ui-sans-serif, system-ui, Segoe UI, Roboto, Arial",
      }}
    >
      <svg viewBox={`0 0 ${size.w} ${size.h}`} width="100%" height="100%">
        {/* 2) Agent up then right to Processing */}
        <motion.line
          {...baseLine}
          x1={AtoP_vert.x1}
          y1={AtoP_vert.y1}
          x2={AtoP_vert.x2}
          y2={AtoP_vert.y2}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: T_SEG, delay: t2_up_start, ease: "easeInOut" }}
        />
        <motion.line
          {...baseLine}
          x1={AtoP_horz.x1}
          y1={AtoP_horz.y1}
          x2={AtoP_horz.x2}
          y2={AtoP_horz.y2}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: T_SEG, delay: t2_right_start, ease: "easeInOut" }}
        />

        {/* 4) Parallel: Processing↓Analyzing and Agent→Analyzing */}
        <motion.line
          {...baseLine}
          x1={PtoA_vert.x1}
          y1={PtoA_vert.y1}
          x2={PtoA_vert.x2}
          y2={PtoA_vert.y2}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: T_SEG, delay: t4_parallel_start, ease: "easeInOut" }}
        />
        <motion.line
          {...baseLine}
          x1={AtoA_horz.x1}
          y1={AtoA_horz.y1}
          x2={AtoA_horz.x2}
          y2={AtoA_horz.y2}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: T_SEG, delay: t4_parallel_start, ease: "easeInOut" }}
        />

        {/* 6) Parallel: Analysing↓Report and Agent L→Report */}
        <motion.line
          {...baseLine}
          x1={AtoR_vert.x1}
          y1={AtoR_vert.y1}
          x2={AtoR_vert.x2}
          y2={AtoR_vert.y2}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: T_SEG, delay: t6_parallel_start, ease: "easeInOut" }}
        />
        <motion.line
          {...baseLine}
          x1={AtoR_vert_fromAgent.x1}
          y1={AtoR_vert_fromAgent.y1}
          x2={AtoR_vert_fromAgent.x2}
          y2={AtoR_vert_fromAgent.y2}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: T_SEG, delay: t6_parallel_start, ease: "easeInOut" }}
        />
        <motion.line
          {...baseLine}
          x1={AtoR_horz_fromAgent.x1}
          y1={AtoR_horz_fromAgent.y1}
          x2={AtoR_horz_fromAgent.x2}
          y2={AtoR_horz_fromAgent.y2}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: T_SEG, delay: t6_agent_right_start, ease: "easeInOut" }}
        />

        {/* corner dots (work in progress) */}
        {[
          [PR.y + HALF_H , PR.x + 30],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={3} fill="#fff" opacity={0.9} />
        ))}
      </svg>

      {/* Nodes (GIFs + labels) with anchored placement */}
      <Node label={nodes[0].label} img={nodes[0].img} x={AG.x} y={AG.y} delay={t1_agent_in} />
      <Node label={nodes[1].label} img={nodes[1].img} x={PR.x} y={PR.y} delay={t3_proc_in} />
      <Node label={nodes[2].label} img={nodes[2].img} x={AN.x} y={AN.y} delay={t5_an_in} />
      <Node label={nodes[3].label} img={nodes[3].img} x={RE.x} y={RE.y} delay={t7_rep_in} />
    </div>
  );
}

type NodeProps = {
  label: string;
  img: string;
  x: number;
  y: number;
  delay: number;
};

function Node({ label, img, x, y, delay }: NodeProps) {
  return (
    <motion.div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        pointerEvents: "none",
        zIndex: 10, // Ensure nodes appear above SVG lines
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: T_NODE, ease: "easeOut" }}
    >
      <img
        src={img}
        alt={label}
        width={33}
        height={33}
        style={{ 
          objectFit: "contain", 
          //filter: "drop-shadow(0 0 16px rgba(120,160,255,.6))",
          display: "block" // Force display of GIF
        }}
        onError={(e) => {
          const el = e.currentTarget;
          el.style.display = "none";
          const fallback = el.nextElementSibling as HTMLElement | null;
          if (fallback) fallback.style.display = "block";
        }}
      />
      {/* Fallback glow if GIF missing */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          display: "none",
          background:
            "radial-gradient(circle at 50% 50%, rgba(120,160,255,.95), rgba(120,160,255,.25) 40%, rgba(120,160,255,0) 70%)",
          boxShadow: "0 0 22px rgba(120,160,255,.7), 0 0 46px rgba(120,160,255,.35)",
          animation: "pulse 2s ease-in-out infinite",
        }}
      />
      <div style={{ fontSize: 10, whiteSpace: "nowrap", opacity: 0.95 }}>{label}</div>
    </motion.div>
  );
}
