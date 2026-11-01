import React, { useEffect, useRef, useState, useMemo } from 'react';
import { NetworkNode, NetworkEdge, MuleRing } from '../types/data';
import { ShieldAlert, Zap, Filter, ZoomIn, ZoomOut, RotateCcw, AlertTriangle, ArrowRight } from 'lucide-react';
import { sound } from '../utils/audio';

interface Props {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  muleRings: MuleRing[];
  onSelectAccount?: (accountId: string) => void;
  selectedAccountId?: string | null;
}

interface Particle {
  sourceId: string;
  targetId: string;
  progress: number; // 0 to 1
  speed: number;
  amount: number;
  color: string;
}

export function NetworkGraphCanvas({
  nodes,
  edges,
  muleRings,
  onSelectAccount,
  selectedAccountId
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [filterMode, setFilterMode] = useState<'ALL' | 'MULES_ONLY' | 'HIGH_RISK'>('ALL');
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Map of mule accounts for instant lookup
  const muleAccountSet = useMemo(() => {
    const set = new Set<string>();
    muleRings.forEach(r => r.accounts.forEach(acc => set.add(acc)));
    return set;
  }, [muleRings]);

  // Filtered nodes and edges
  const { filteredNodes, filteredEdges } = useMemo(() => {
    let n = nodes;
    if (filterMode === 'MULES_ONLY') {
      n = n.filter(node => node.is_mule || muleAccountSet.has(node.id));
    } else if (filterMode === 'HIGH_RISK') {
      n = n.filter(node => node.risk_score >= 65 || node.is_mule);
    }

    const nodeIds = new Set(n.map(node => node.id));
    const e = edges.filter(edge => nodeIds.has(edge.source) && nodeIds.has(edge.target));

    return { filteredNodes: n, filteredEdges: e };
  }, [nodes, edges, filterMode, muleAccountSet]);

  // Compute node 2D positions in a force-directed-like circular/cluster layout
  const nodePositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number; node: NetworkNode }>();
    const total = filteredNodes.length;
    if (total === 0) return positions;

    const width = 850;
    const height = 550;
    const centerX = width / 2;
    const centerY = height / 2;

    // Distribute nodes:
    // Place Mule Ring nodes in an inner high-lighted circle
    const muleList = filteredNodes.filter(nd => nd.is_mule || muleAccountSet.has(nd.id));
    const normalList = filteredNodes.filter(nd => !nd.is_mule && !muleAccountSet.has(nd.id));

    // Inner ring for mules
    muleList.forEach((nd, i) => {
      const angle = (i / Math.max(muleList.length, 1)) * 2 * Math.PI;
      const radius = 120 + (i % 2) * 25;
      positions.set(nd.id, {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        node: nd
      });
    });

    // Outer cluster for other nodes
    normalList.forEach((nd, i) => {
      const angle = (i / Math.max(normalList.length, 1)) * 2 * Math.PI + 0.3;
      const radius = 220 + ((i * 37) % 70);
      positions.set(nd.id, {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        node: nd
      });
    });

    return positions;
  }, [filteredNodes, muleAccountSet]);

  // Animated particles along edges
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    // Generate initial particles
    const list: Particle[] = [];
    filteredEdges.slice(0, 35).forEach(edge => {
      list.push({
        sourceId: edge.source,
        targetId: edge.target,
        progress: Math.random(),
        speed: 0.006 + Math.random() * 0.008,
        amount: edge.amount,
        color: edge.is_mule || muleAccountSet.has(edge.source) ? '#f43f5e' : '#38bdf8'
      });
    });
    particlesRef.current = list;
  }, [filteredEdges, muleAccountSet]);

  // Main canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.scale(dpr, dpr);

      // Apply Pan & Zoom
      ctx.translate(pan.x + width / 2, pan.y + height / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-425, -275); // Center baseline 850x550

      // Draw subtle background grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = -200; x <= 1050; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, -200);
        ctx.lineTo(x, 750);
        ctx.stroke();
      }
      for (let y = -200; y <= 750; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(-200, y);
        ctx.lineTo(1050, y);
        ctx.stroke();
      }

      // Draw Mule Ring Circular Danger Zone if rings exist
      if (muleRings.length > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(425, 275, 160, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.22)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        ctx.stroke();

        ctx.fillStyle = 'rgba(244, 63, 94, 0.04)';
        ctx.fill();
        ctx.restore();
      }

      // 1. Draw Edges
      filteredEdges.forEach(edge => {
        const p1 = nodePositions.get(edge.source);
        const p2 = nodePositions.get(edge.target);
        if (!p1 || !p2) return;

        const isMuleEdge = edge.is_mule || muleAccountSet.has(edge.source) || muleAccountSet.has(edge.target);
        const isSelectedEdge = selectedAccountId && (edge.source === selectedAccountId || edge.target === selectedAccountId);

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);

        if (isSelectedEdge) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 8;
        } else if (isMuleEdge) {
          ctx.strokeStyle = 'rgba(244, 63, 94, 0.65)';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#f43f5e';
          ctx.shadowBlur = 6;
        } else {
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
          ctx.lineWidth = 1;
          ctx.shadowBlur = 0;
        }

        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw directional arrowhead
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const targetRadius = (p2.node.is_mule || muleAccountSet.has(p2.node.id)) ? 18 : 13;
        const arrowX = p2.x - Math.cos(angle) * (targetRadius + 3);
        const arrowY = p2.y - Math.sin(angle) * (targetRadius + 3);

        ctx.save();
        ctx.translate(arrowX, arrowY);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-7, -4);
        ctx.lineTo(-7, 4);
        ctx.closePath();
        ctx.fillStyle = isMuleEdge ? '#f43f5e' : 'rgba(148, 163, 184, 0.5)';
        ctx.fill();
        ctx.restore();
      });

      // 2. Draw Moving Flow Particles
      particlesRef.current.forEach(p => {
        const p1 = nodePositions.get(p.sourceId);
        const p2 = nodePositions.get(p.targetId);
        if (!p1 || !p2) return;

        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;

        const curX = p1.x + (p2.x - p1.x) * p.progress;
        const curY = p1.y + (p2.y - p1.y) * p.progress;

        ctx.beginPath();
        ctx.arc(curX, curY, 3, 0, 2 * Math.PI);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 3. Draw Nodes
      nodePositions.forEach((pos, nodeId) => {
        const nd = pos.node;
        const isMule = nd.is_mule || muleAccountSet.has(nodeId);
        const isSelected = selectedAccountId === nodeId;
        const isHovered = hoveredNode?.id === nodeId;

        const baseRadius = isMule ? 17 : 12;
        const radius = isSelected || isHovered ? baseRadius + 3 : baseRadius;

        // Pulse glow for mules
        if (isMule) {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, radius + 7, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(244, 63, 94, 0.18)';
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);

        // Fill color based on role
        if (isMule) {
          ctx.fillStyle = '#e11d48';
          ctx.strokeStyle = '#fda4af';
        } else if (nd.risk_score >= 65) {
          ctx.fillStyle = '#f59e0b';
          ctx.strokeStyle = '#fde68a';
        } else {
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#38bdf8';
        }

        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.shadowColor = isMule ? '#f43f5e' : '#38bdf8';
        ctx.shadowBlur = isSelected || isMule ? 10 : 3;
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Node label
        ctx.font = isMule ? 'bold 10px JetBrains Mono, monospace' : '9px JetBrains Mono, monospace';
        ctx.fillStyle = isMule ? '#ffe4e6' : '#cbd5e1';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(nodeId, pos.x, pos.y + radius + 4);
      });

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [nodePositions, filteredEdges, muleAccountSet, selectedAccountId, hoveredNode, pan, zoom, muleRings]);

  // Handle resizing high-DPI canvas
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = 550 * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `550px`;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mouse interaction: Hover, Click, Pan
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    setMousePos({ x: e.clientX, y: e.clientY });

    // Transform mouse coordinate to canvas virtual coordinate
    const width = rect.width;
    const height = 550;
    const virtualX = (clientX - (pan.x + width / 2)) / zoom + 425;
    const virtualY = (clientY - (pan.y + height / 2)) / zoom + 275;

    // Check hit test
    let found: NetworkNode | null = null;
    nodePositions.forEach(pos => {
      const dist = Math.hypot(pos.x - virtualX, pos.y - virtualY);
      if (dist < 22) {
        found = pos.node;
      }
    });

    setHoveredNode(found);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredNode && onSelectAccount) {
      sound.playClick();
      onSelectAccount(hoveredNode.id);
    }
  };

  return (
    <div className="relative w-full rounded-2xl bg-slate-950/90 border border-slate-800/80 overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Top Overlay Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-xl backdrop-blur">
          <button
            onClick={() => { setFilterMode('ALL'); sound.playClick(); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filterMode === 'ALL'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Accounts ({nodes.length})
          </button>
          <button
            onClick={() => { setFilterMode('MULES_ONLY'); sound.playClick(); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              filterMode === 'MULES_ONLY'
                ? 'bg-rose-500/25 text-rose-400 border border-rose-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            Mule Nodes Only
          </button>
          <button
            onClick={() => { setFilterMode('HIGH_RISK'); sound.playClick(); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filterMode === 'HIGH_RISK'
                ? 'bg-amber-500/25 text-amber-400 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Risk &gt; 65
          </button>
        </div>
      </div>

      {/* Top Right Zoom Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-xl backdrop-blur">
        <button
          onClick={() => setZoom(z => Math.min(z + 0.2, 2.5))}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="w-full cursor-grab active:cursor-grabbing">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleClick}
          className="block w-full h-[550px]"
        />
      </div>

      {/* Hover Node Tooltip */}
      {hoveredNode && (
        <div
          className="pointer-events-none fixed z-50 px-3.5 py-2.5 bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl backdrop-blur-md text-xs"
          style={{
            left: `${mousePos.x + 15}px`,
            top: `${mousePos.y + 15}px`
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono font-bold text-white">{hoveredNode.id}</span>
            {hoveredNode.is_mule || muleAccountSet.has(hoveredNode.id) ? (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                MULE NODE
              </span>
            ) : (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-slate-800 text-slate-300">
                ACTIVE ACCOUNT
              </span>
            )}
          </div>
          <div className="text-slate-400 space-y-0.5 text-[11px]">
            <div>Connections: <strong className="text-slate-200">{hoveredNode.connections} directed paths</strong></div>
            <div>Risk Score: <strong className={hoveredNode.risk_score >= 70 ? "text-rose-400 font-mono" : "text-emerald-400 font-mono"}>{hoveredNode.risk_score}/100</strong></div>
            <div>Total Volume: <strong className="text-slate-200">₹{hoveredNode.total_volume.toLocaleString('en-IN')}</strong></div>
          </div>
          <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-[10px] text-sky-400 font-medium">
            Click to inspect account dossier &rarr;
          </div>
        </div>
      )}

      {/* Legend Footer */}
      <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-950/60 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
            <span>Mule Account Node</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span>High Risk Account (&gt;65)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-slate-900 border border-sky-400" />
            <span>Standard Consumer Node</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_6px_#f43f5e]" />
            <span>Laundering Flow Particle</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-500">
          Scroll to zoom · Drag to pan · Click any node to freeze or inspect
        </div>
      </div>
    </div>
  );
}
