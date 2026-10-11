import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDfa } from "../layouts/DfaContext";

export default function MoorePage() {
  const navigate = useNavigate();
  const { dfaData } = useDfa();

  // Initialize state directly to avoid cascading renders
  const [stateOutputs, setStateOutputs] = useState(() => {
    if (!dfaData) return {};
    const initialOutputs = {};
    dfaData.states.forEach((st) => {
      initialOutputs[st] = dfaData.finalStates.includes(st) ? "1" : "0";
    });
    return initialOutputs;
  });

  const [isConverted, setIsConverted] = useState(false);

  if (!dfaData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-slate-200">
          <h2 className="text-xl font-bold mb-4 text-slate-800">
            No DFA Data Found
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Please build and save a DFA on the home page first.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  const handleOutputChange = (stateId, value) => {
    setStateOutputs((prev) => ({ ...prev, [stateId]: value }));
  };

  const handleGenerate = () => {
    // Ensure no outputs are left blank
    const hasEmpty = Object.values(stateOutputs).some(
      (val) => val.trim() === "",
    );
    if (hasEmpty) {
      return alert("Please provide an output for every state.");
    }
    setIsConverted(true);
  };

  // Get unique output alphabet (Δ) to display in the 6-tuple
  const outputAlphabet = Array.from(
    new Set(Object.values(stateOutputs).map((v) => v.trim())),
  ).sort();

  const renderMooreEdges = () => {
    const groupedEdges = {};
    dfaData.edges.forEach((e) => {
      const key = `${e.from}->${e.to}`;
      if (!groupedEdges[key]) {
        groupedEdges[key] = { from: e.from, to: e.to, inputs: [e.input] };
      } else if (!groupedEdges[key].inputs.includes(e.input)) {
        groupedEdges[key].inputs.push(e.input);
        groupedEdges[key].inputs.sort();
      }
    });

    return Object.values(groupedEdges).map((group) => {
      const fromN = dfaData.nodes.find((n) => n.id === group.from);
      const toN = dfaData.nodes.find((n) => n.id === group.to);
      if (!fromN || !toN) return null;

      const label = group.inputs.join(", ");
      const R = 26;

      // A: Self Loop
      if (group.from === group.to) {
        const startX = fromN.x - R * 0.5;
        const startY = fromN.y - R * 0.866;
        const endX = fromN.x + R * 0.5;
        const endY = fromN.y - R * 0.866;

        const d = `M ${startX} ${startY} C ${fromN.x - 55} ${fromN.y - 110}, ${fromN.x + 55} ${fromN.y - 110}, ${endX} ${endY}`;
        return (
          <g key={`loop-${group.from}`}>
            <path
              d={d}
              fill="none"
              stroke="#4f46e5"
              strokeWidth="2.5"
              markerEnd="url(#arrowMoore)"
            />
            <rect
              x={fromN.x - 20}
              y={fromN.y - 90}
              width="40"
              height="20"
              fill="#f8fafc"
              rx="4"
            />
            <text
              x={fromN.x}
              y={fromN.y - 75}
              fill="#4338ca"
              fontSize="13"
              fontWeight="bold"
              textAnchor="middle"
            >
              {label}
            </text>
          </g>
        );
      }

      // B: Reciprocal Edge Curve
      const isReciprocal =
        groupedEdges[`${group.to}->${group.from}`] !== undefined;

      if (isReciprocal) {
        const dx = toN.x - fromN.x;
        const dy = toN.y - fromN.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const nx = -(dy / dist);
        const ny = dx / dist;

        const midX = (fromN.x + toN.x) / 2;
        const midY = (fromN.y + toN.y) / 2;
        const cx = midX + nx * 40;
        const cy = midY + ny * 40;

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
              stroke="#4f46e5"
              strokeWidth="2.5"
              markerEnd="url(#arrowMoore)"
            />
            <rect
              x={textX - 20}
              y={textY - 10}
              width="40"
              height="20"
              fill="#f8fafc"
              rx="4"
            />
            <text
              x={textX}
              y={textY + 4}
              fill="#4338ca"
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
              stroke="#4f46e5"
              strokeWidth="2.5"
              markerEnd="url(#arrowMoore)"
            />
            <rect
              x={midX - 20}
              y={midY - 10}
              width="40"
              height="20"
              fill="#f8fafc"
              rx="4"
            />
            <text
              x={midX}
              y={midY + 4}
              fill="#4338ca"
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
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-indigo-700">
              Moore Machine Conversion
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Bind specific outputs to every individual state.
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-bold transition"
          >
            ← Back to Builder
          </button>
        </div>

        {!isConverted ? (
          <div className="py-10 px-6 bg-indigo-50 border border-indigo-100 rounded-xl shadow-inner max-w-2xl mx-auto text-center">
            <h3 className="text-lg font-bold text-indigo-900 mb-2">
              Define Output for Each State (Δ)
            </h3>
            <p className="mb-6 text-indigo-700 text-sm">
              Assign the exact output produced when the machine enters each
              state.
            </p>

            <div className="flex flex-col gap-3 max-w-sm mx-auto mb-8">
              {dfaData.states.map((st) => (
                <div key={st} className="flex items-center gap-3">
                  <label className="font-bold text-indigo-800 text-sm w-20 text-right">
                    State {st}:
                  </label>
                  <input
                    type="text"
                    value={stateOutputs[st] || ""}
                    onChange={(e) => handleOutputChange(st, e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-center shadow-sm"
                    placeholder="e.g. A, 0, or 1"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handleGenerate}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg transition transform hover:-translate-y-0.5"
            >
              Generate Moore Machine ➔
            </button>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* SVG Canvas */}
            <div className="h-[400px] bg-slate-100 border border-slate-300 rounded-xl relative mb-6 overflow-hidden shadow-inner">
              <svg className="w-full h-full select-none">
                <defs>
                  <marker
                    id="arrowMoore"
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#4f46e5" />
                  </marker>
                </defs>

                {renderMooreEdges()}

                {/* Render Nodes with Output Split */}
                {dfaData.nodes.map((n) => (
                  <g key={n.id}>
                    {n.isInitial && (
                      <path
                        d={`M ${n.x - 60} ${n.y} L ${n.x - 28} ${n.y}`}
                        stroke="#10b981"
                        strokeWidth="3"
                        markerEnd="url(#arrowMoore)"
                      />
                    )}

                    <circle
                      cx={n.x}
                      cy={n.y}
                      r="26"
                      fill="#ffffff"
                      stroke="#4f46e5"
                      strokeWidth="2.5"
                    />
                    <line
                      x1={n.x - 26}
                      y1={n.y}
                      x2={n.x + 26}
                      y2={n.y}
                      stroke="#c7d2fe"
                      strokeWidth="2"
                    />

                    <text
                      x={n.x}
                      y={n.y - 5}
                      fill="#312e81"
                      fontSize="12"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {n.id}
                    </text>
                    <text
                      x={n.x}
                      y={n.y + 16}
                      fill="#ea580c"
                      fontSize="13"
                      fontWeight="900"
                      textAnchor="middle"
                    >
                      {stateOutputs[n.id]}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            {/* 6-Tuple Definition */}
            <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg mb-6 shadow-sm">
              <h2 className="text-lg font-bold mb-3 text-slate-800">
                Moore 6-Tuple: M = (Q, Σ, Δ, δ, λ, q₀)
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-mono text-slate-700">
                <p>
                  <b className="text-indigo-600">Q (States):</b>{" "}
                  {`{${dfaData.states.join(", ")}}`}
                </p>
                <p>
                  <b className="text-indigo-600">Σ (Inputs):</b>{" "}
                  {`{${dfaData.alphabet.join(", ")}}`}
                </p>
                <p>
                  <b className="text-indigo-600">Δ (Outputs):</b>{" "}
                  {`{${outputAlphabet.join(", ")}}`}
                </p>
                <p>
                  <b className="text-indigo-600">q₀ (Initial):</b>{" "}
                  {dfaData.initialState}
                </p>
              </div>
            </div>

            {/* Transition Matrix */}
            <h3 className="text-sm font-bold text-slate-600 mb-2 uppercase tracking-wide">
              Moore Transition Matrix
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <thead>
                  <tr className="bg-indigo-100 border-b border-indigo-200 text-indigo-900">
                    <th className="p-3 font-semibold">Current State</th>
                    {dfaData.alphabet.map((sym) => (
                      <th key={sym} className="p-3 font-semibold text-center">
                        Next State (In = {sym})
                      </th>
                    ))}
                    <th className="p-3 font-semibold text-center border-l border-indigo-200">
                      Output (Δ)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dfaData.states.map((st) => (
                    <tr
                      key={st}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="p-3 font-bold text-indigo-700">
                        {st}
                        {st === dfaData.initialState && (
                          <span className="text-emerald-500 text-xs font-normal ml-1">
                            (Start)
                          </span>
                        )}
                      </td>
                      {dfaData.alphabet.map((sym) => (
                        <td key={sym} className="p-3 font-mono text-center">
                          {dfaData.transitions[st]?.[sym] || "-"}
                        </td>
                      ))}
                      <td className="p-3 font-mono font-bold text-center border-l border-slate-100 bg-orange-50 text-orange-600">
                        {stateOutputs[st]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
