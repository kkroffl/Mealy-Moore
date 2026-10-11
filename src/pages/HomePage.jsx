import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDfa } from "../layouts/DfaContext";

export default function HomePage() {
  const navigate = useNavigate();
  const { setDfaData } = useDfa();

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  // Interaction modes: 'select', 'addTransition', 'setInitial', 'toggleFinal'
  const [mode, setMode] = useState("select");
  const [selectedSource, setSelectedSource] = useState(null);
  const [draggingNode, setDraggingNode] = useState(null);
  const [savedDfa, setSavedDfa] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === "Backspace" || e.key === "Delete") && selectedNode) {
        setNodes((prevNodes) => prevNodes.filter((n) => n.id !== selectedNode));
        setEdges((prevEdges) =>
          prevEdges.filter(
            (edge) => edge.from !== selectedNode && edge.to !== selectedNode,
          ),
        );
        setSelectedNode(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNode]);

  // 1. Add a State to Canvas
  const handleAddState = () => {
    const id = `q${nodes.length}`;
    setNodes([
      ...nodes,
      {
        id,
        x: 150 + (nodes.length % 4) * 120,
        y: 150 + Math.floor(nodes.length / 4) * 100,
        isInitial: nodes.length === 0,
        isFinal: false,
      },
    ]);
  };

  // 2. Handle Clicking on a Node (Depends on current mode)
  const handleNodeClick = (nodeId) => (e) => {
    e.stopPropagation();

    if (mode === "select") {
      // Toggle selection (click once to select, click again to unselect)
      setSelectedNode(nodeId === selectedNode ? null : nodeId);

      // Keep your existing dragging logic here so you can still drag it
      setDraggingNode(nodeId);
      return;
    }

    if (mode === "setInitial") {
      setNodes(nodes.map((n) => ({ ...n, isInitial: n.id === nodeId })));
      setMode("select");
      return;
    }

    if (mode === "toggleFinal") {
      setNodes(
        nodes.map((n) => (n.id === nodeId ? { ...n, isFinal: !n.isFinal } : n)),
      );
      setMode("select");
      return;
    }

    if (mode === "addTransition") {
      if (!selectedSource) {
        setSelectedSource(nodeId); // First click selects source
      } else {
        // Second click selects target and asks for Input Symbol
        const inputSymbol = prompt(
          `Enter Input symbol for transition ${selectedSource} ➔ ${nodeId}:`,
          "0",
        );
        if (inputSymbol !== null && inputSymbol.trim() !== "") {
          setEdges([
            ...edges,
            {
              id: `e_${Date.now()}`,
              from: selectedSource,
              to: nodeId,
              input: inputSymbol.trim(),
            },
          ]);
        }
        setSelectedSource(null);
        setMode("select");
      }
      return;
    }

    // Default mode: start dragging
    setDraggingNode(nodeId);
  };

  // 3. Dragging logic
  const handleMouseMove = (e) => {
    if (!draggingNode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setNodes(nodes.map((n) => (n.id === draggingNode ? { ...n, x, y } : n)));
  };

  // 4. Save and Generate 5-Tuple
  const handleSave = () => {
    if (nodes.length === 0) return alert("Please add at least one state.");

    const states = nodes.map((n) => n.id);
    const alphabet = Array.from(new Set(edges.map((e) => e.input))).sort();
    const initialState = nodes.find((n) => n.isInitial)?.id || states[0];
    const finalStates = nodes.filter((n) => n.isFinal).map((n) => n.id);

    const transitions = {};
    states.forEach((s) => (transitions[s] = {}));
    edges.forEach((e) => (transitions[e.from][e.input] = e.to));

    const dfa = {
      states,
      alphabet: alphabet.length > 0 ? alphabet : ["0", "1"],
      initialState,
      finalStates,
      transitions,
      nodes,
      edges,
    };

    setSavedDfa(dfa);
    setDfaData(dfa); // Save to global context
  };

  const handleClear = () => {
    setNodes([]);
    setEdges([]);
    setSavedDfa(null);
    setDfaData(null);
  };

  // Group Edges to handle multiple inputs and reciprocals cleanly
  const renderEdges = () => {
    const groupedEdges = {};
    edges.forEach((e) => {
      const key = `${e.from}->${e.to}`;
      if (!groupedEdges[key]) {
        groupedEdges[key] = { from: e.from, to: e.to, inputs: [e.input] };
      } else if (!groupedEdges[key].inputs.includes(e.input)) {
        groupedEdges[key].inputs.push(e.input);
        groupedEdges[key].inputs.sort();
      }
    });

    return Object.values(groupedEdges).map((group) => {
      const fromN = nodes.find((n) => n.id === group.from);
      const toN = nodes.find((n) => n.id === group.to);
      if (!fromN || !toN) return null;

      const label = group.inputs.join(", ");
      const R = 22; // Radius of the state circle

      // A: Self Loop (Perfect teardrop starting and ending on the circumference)
      if (group.from === group.to) {
        // Start top-left, end top-right
        const startX = fromN.x - R * 0.5;
        const startY = fromN.y - R * 0.866;
        const endX = fromN.x + R * 0.5;
        const endY = fromN.y - R * 0.866;

        // Cubic bezier curve for self loop
        const d = `M ${startX} ${startY} C ${fromN.x - 50} ${fromN.y - 100}, ${fromN.x + 50} ${fromN.y - 100}, ${endX} ${endY}`;
        return (
          <g key={`loop-${group.from}`}>
            <path
              d={d}
              fill="none"
              stroke="#64748b"
              strokeWidth="2.5"
              markerEnd="url(#arrow)"
            />
            <rect
              x={fromN.x - 15}
              y={fromN.y - 85}
              width="30"
              height="20"
              fill="#f8fafc"
              rx="4"
            />
            <text
              x={fromN.x}
              y={fromN.y - 70}
              fill="#0284c7"
              fontSize="13"
              fontWeight="bold"
              textAnchor="middle"
            >
              {label}
            </text>
          </g>
        );
      }

      // B: Check if reciprocal edge exists (A->B and B->A)
      const isReciprocal =
        groupedEdges[`${group.to}->${group.from}`] !== undefined;

      if (isReciprocal) {
        // Draw Curved Arc
        const dx = toN.x - fromN.x;
        const dy = toN.y - fromN.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const nx = -(dy / dist);
        const ny = dx / dist;

        const midX = (fromN.x + toN.x) / 2;
        const midY = (fromN.y + toN.y) / 2;
        const cx = midX + nx * 40; // Control point pushes curve outwards
        const cy = midY + ny * 40;

        // Calculate exact border intersection for curved target
        const angleTarget = Math.atan2(toN.y - cy, toN.x - cx);
        const targetX = toN.x - R * Math.cos(angleTarget);
        const targetY = toN.y - R * Math.sin(angleTarget);

        const angleSource = Math.atan2(cy - fromN.y, cx - fromN.x);
        const sourceX = fromN.x + R * Math.cos(angleSource);
        const sourceY = fromN.y + R * Math.sin(angleSource);

        const d = `M ${sourceX} ${sourceY} Q ${cx} ${cy} ${targetX} ${targetY}`;

        const textX = 0.25 * sourceX + 0.5 * cx + 0.25 * targetX;
        const textY = 0.25 * sourceY + 0.5 * cy + 0.25 * targetY;

        return (
          <g key={`curve-${group.from}-${group.to}`}>
            <path
              d={d}
              fill="none"
              stroke="#64748b"
              strokeWidth="2.5"
              markerEnd="url(#arrow)"
            />
            <rect
              x={textX - 15}
              y={textY - 10}
              width="30"
              height="20"
              fill="#f8fafc"
              rx="4"
            />
            <text
              x={textX}
              y={textY + 4}
              fill="#0284c7"
              fontSize="13"
              fontWeight="bold"
              textAnchor="middle"
            >
              {label}
            </text>
          </g>
        );
      } else {
        // C: Standard Straight Line
        const dx = toN.x - fromN.x;
        const dy = toN.y - fromN.y;
        const angle = Math.atan2(dy, dx);

        // Calculate exact border intersections
        const sourceX = fromN.x + R * Math.cos(angle);
        const sourceY = fromN.y + R * Math.sin(angle);
        const targetX = toN.x - R * Math.cos(angle);
        const targetY = toN.y - R * Math.sin(angle);

        const midX = (sourceX + targetX) / 2;
        const midY = (sourceY + targetY) / 2;

        const d = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
        return (
          <g key={`line-${group.from}-${group.to}`}>
            <path
              d={d}
              fill="none"
              stroke="#64748b"
              strokeWidth="2.5"
              markerEnd="url(#arrow)"
            />
            <rect
              x={midX - 15}
              y={midY - 10}
              width="30"
              height="20"
              fill="#f8fafc"
              rx="4"
            />
            <text
              x={midX}
              y={midY + 4}
              fill="#0284c7"
              fontSize="13"
              fontWeight="bold"
              textAnchor="middle"
            >
              {label}
            </text>
          </g>
        );
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-800">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">
          1. Draw DFA
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Add states, connect them with inputs, and set the initial state.
        </p>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={handleAddState}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold shadow-sm transition"
          >
            + Add State
          </button>
          <button
            onClick={() => {
              setMode("addTransition");
              setSelectedSource(null);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-bold text-white shadow-sm transition ${mode === "addTransition" ? "bg-sky-700 ring-4 ring-sky-200" : "bg-sky-500 hover:bg-sky-600"}`}
          >
            ➔ Add Transition {selectedSource && "(Select Target)"}
          </button>
          <button
            onClick={() => setMode("setInitial")}
            className={`px-4 py-2 rounded-lg text-sm font-bold text-white shadow-sm transition ${mode === "setInitial" ? "bg-emerald-700 ring-4 ring-emerald-200" : "bg-emerald-500 hover:bg-emerald-600"}`}
          >
            ▶ Set Initial
          </button>
          <button
            onClick={() => setMode("toggleFinal")}
            className={`px-4 py-2 rounded-lg text-sm font-bold text-white shadow-sm transition ${mode === "toggleFinal" ? "bg-pink-700 ring-4 ring-pink-200" : "bg-pink-500 hover:bg-pink-600"}`}
          >
            ◎ Toggle Final
          </button>

          <div className="flex-grow"></div>

          <button
            onClick={handleClear}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-bold transition"
          >
            🗑 Clear
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md transition"
          >
            💾 Save & Generate Table
          </button>
        </div>

        {/* SVG Canvas */}
        <div className="h-[400px] bg-slate-100 border border-slate-300 rounded-xl relative mb-6 overflow-hidden shadow-inner">
          <svg
            className="w-full h-full cursor-crosshair select-none"
            onMouseMove={handleMouseMove}
            onMouseUp={() => setDraggingNode(null)}
            onMouseLeave={() => setDraggingNode(null)}
          >
            <defs>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
              </marker>
            </defs>

            {/* Render Edges */}
            {renderEdges()}

            {/* Render Nodes */}
            {nodes.map((n) => {
              // Check if this specific node is the one currently selected
              const isSelected = n.id === selectedNode;

              return (
                <g
                  key={n.id}
                  onMouseDown={handleNodeClick(n.id)}
                  className="cursor-pointer"
                >
                  {/* Initial state arrow */}
                  {n.isInitial && (
                    <line
                      x1={n.x - 45}
                      y1={n.y}
                      x2={n.x - 22}
                      y2={n.y}
                      stroke="#10b981"
                      strokeWidth="3"
                      markerEnd="url(#arrow)"
                    />
                  )}

                  {/* Main State Circle with Highlight Logic */}
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r="20"
                    // 1. Change fill to light blue if selected
                    fill={isSelected ? "#e0e7ff" : "#ffffff"}
                    // 2. Change border color and thickness if selected
                    stroke={
                      n.isFinal ? "#ec4899" : isSelected ? "#4f46e5" : "#3b82f6"
                    }
                    strokeWidth={isSelected ? "3.5" : "2.5"}
                    className="transition-all duration-200"
                  />

                  {/* Final state inner circle */}
                  {n.isFinal && (
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r="15"
                      fill="none"
                      stroke="#ec4899"
                      strokeWidth="1.5"
                    />
                  )}

                  {/* State Text */}
                  <text
                    x={n.x}
                    y={n.y + 4}
                    fontSize="12"
                    fontWeight="bold"
                    textAnchor="middle"
                    fill="#1e293b"
                  >
                    {n.id}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* 5-Tuple Output Table (Appears after saving) */}
        {savedDfa && (
          <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-lg font-bold mb-4">
              DFA 5-Tuple: M = (Q, Σ, δ, q₀, F)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-mono mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p>
                <b className="text-blue-600">Q (States):</b>{" "}
                {`{${savedDfa.states.join(", ")}}`}
              </p>
              <p>
                <b className="text-blue-600">Σ (Alphabet):</b>{" "}
                {`{${savedDfa.alphabet.join(", ")}}`}
              </p>
              <p>
                <b className="text-blue-600">q₀ (Initial):</b>{" "}
                {savedDfa.initialState}
              </p>
              <p>
                <b className="text-blue-600">F (Final):</b>{" "}
                {`{${savedDfa.finalStates.join(", ") || "None"}}`}
              </p>
            </div>

            <h3 className="text-sm font-bold text-slate-600 mb-2 uppercase tracking-wide">
              Transition Matrix (δ)
            </h3>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-left text-sm border-collapse bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300">
                    <th className="p-3 font-semibold text-slate-700">
                      Current State
                    </th>
                    {savedDfa.alphabet.map((sym) => (
                      <th
                        key={sym}
                        className="p-3 font-semibold text-slate-700"
                      >
                        Input = {sym}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {savedDfa.states.map((st) => (
                    <tr
                      key={st}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="p-3 font-bold text-sky-600">
                        {st}
                        {st === savedDfa.initialState && (
                          <span className="text-emerald-500 text-xs ml-1">
                            (Start)
                          </span>
                        )}
                        {savedDfa.finalStates.includes(st) && (
                          <span className="text-pink-500 text-xs ml-1">
                            (Final)
                          </span>
                        )}
                      </td>
                      {savedDfa.alphabet.map((sym) => (
                        <td key={sym} className="p-3 font-mono">
                          {savedDfa.transitions[st]?.[sym] || "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-100">
              <button
                onClick={() => navigate("/mealy")}
                className="flex-1 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-lg transition transform hover:-translate-y-0.5"
              >
                Convert to Mealy Machine ➔
              </button>
              <button
                onClick={() => navigate("/moore")}
                className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg transition transform hover:-translate-y-0.5"
              >
                Convert to Moore Machine ➔
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
