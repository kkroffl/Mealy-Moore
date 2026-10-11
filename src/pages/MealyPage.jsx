import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDfa } from "../layouts/DfaContext";

export default function MealyPage() {
  const navigate = useNavigate();
  const { dfaData } = useDfa();

  // Dynamic Output Alphabet (Default 2 boxes: '0' and '1')
  const [outputAlphabet, setOutputAlphabet] = useState(["0", "1"]);
  const [mealyEdges, setMealyEdges] = useState([]);
  const [isConverted, setIsConverted] = useState(false);

  // Fallback if user navigates here without saving a DFA first
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

  // --- Output Alphabet Input Handlers ---
  const handleOutputChange = (index, value) => {
    const newAlphabet = [...outputAlphabet];
    newAlphabet[index] = value;
    setOutputAlphabet(newAlphabet);
  };

  const addOutputBox = () => setOutputAlphabet([...outputAlphabet, ""]);

  const removeOutputBox = (index) => {
    if (outputAlphabet.length > 1) {
      setOutputAlphabet(outputAlphabet.filter((_, i) => i !== index));
    }
  };

  // --- Auto-Generate Mealy Machine (Logically mapped to Final States) ---
  const handleGenerate = () => {
    const validOutputs = outputAlphabet.filter((out) => out.trim() !== "");
    if (validOutputs.length === 0)
      return alert("Please provide at least one valid output symbol.");

    // Map outputs logically: index 0 for Non-Final destinations, index 1 (if provided) for Final destinations.
    const nonFinalOutput = validOutputs[0];
    const finalOutput =
      validOutputs.length > 1 ? validOutputs[1] : validOutputs[0];

    const updatedEdges = dfaData.edges.map((e) => {
      // Check if the target state (e.to) is in the DFA's list of final states
      const isTargetFinal = dfaData.finalStates.includes(e.to);

      // Assign output based on destination status
      const assignedOutput = isTargetFinal ? finalOutput : nonFinalOutput;

      return { ...e, output: assignedOutput };
    });

    setOutputAlphabet(validOutputs);
    setMealyEdges(updatedEdges);
    setIsConverted(true);
  };

  // --- Render Perfect Geometry SVG Edges ---
  const renderMealyEdges = () => {
    const groupedEdges = {};
    mealyEdges.forEach((e) => {
      const key = `${e.from}->${e.to}`;
      const labelStr = `${e.input} / ${e.output}`;
      if (!groupedEdges[key]) {
        groupedEdges[key] = { from: e.from, to: e.to, labels: [labelStr] };
      } else if (!groupedEdges[key].labels.includes(labelStr)) {
        groupedEdges[key].labels.push(labelStr);
        groupedEdges[key].labels.sort();
      }
    });

    return Object.values(groupedEdges).map((group) => {
      const fromN = dfaData.nodes.find((n) => n.id === group.from);
      const toN = dfaData.nodes.find((n) => n.id === group.to);
      if (!fromN || !toN) return null;

      const label = group.labels.join(", ");
      const R = 22; // State circle radius

      // A: Self Loop (Perfect Teardrop)
      if (group.from === group.to) {
        const startX = fromN.x - R * 0.5;
        const startY = fromN.y - R * 0.866;
        const endX = fromN.x + R * 0.5;
        const endY = fromN.y - R * 0.866;

        const d = `M ${startX} ${startY} C ${fromN.x - 50} ${fromN.y - 100}, ${fromN.x + 50} ${fromN.y - 100}, ${endX} ${endY}`;
        return (
          <g key={`loop-${group.from}`}>
            <path
              d={d}
              fill="none"
              stroke="#a855f7"
              strokeWidth="2.5"
              markerEnd="url(#arrowMealy)"
            />
            <rect
              x={fromN.x - 25}
              y={fromN.y - 85}
              width="50"
              height="20"
              fill="#f8fafc"
              rx="4"
            />
            <text
              x={fromN.x}
              y={fromN.y - 70}
              fill="#9333ea"
              fontSize="13"
              fontWeight="bold"
              textAnchor="middle"
            >
              {label}
            </text>
          </g>
        );
      }

      // B: Check if reciprocal edge exists
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
              stroke="#a855f7"
              strokeWidth="2.5"
              markerEnd="url(#arrowMealy)"
            />
            <rect
              x={textX - 25}
              y={textY - 10}
              width="50"
              height="20"
              fill="#f8fafc"
              rx="4"
            />
            <text
              x={textX}
              y={textY + 4}
              fill="#9333ea"
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
              stroke="#a855f7"
              strokeWidth="2.5"
              markerEnd="url(#arrowMealy)"
            />
            <rect
              x={midX - 25}
              y={midY - 10}
              width="50"
              height="20"
              fill="#f8fafc"
              rx="4"
            />
            <text
              x={midX}
              y={midY + 4}
              fill="#9333ea"
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
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-purple-700">
              Mealy Machine Conversion
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Outputs are generated during state transitions.
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-bold transition"
          >
            ← Back to Builder
          </button>
        </div>

        {/* SETUP UI: Define Output Alphabet */}
        {!isConverted ? (
          <div className="py-10 px-6 bg-purple-50 border border-purple-100 rounded-xl shadow-inner max-w-2xl mx-auto text-center">
            <h3 className="text-lg font-bold text-purple-900 mb-2">
              Define Output Alphabet (Δ)
            </h3>
            <p className="mb-6 text-purple-700 text-sm">
              Provide the valid output variables for your machine. We will
              auto-map these to your transition edges.
            </p>

            <div className="flex flex-col gap-3 max-w-sm mx-auto mb-6">
              {outputAlphabet.map((out, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="font-bold text-purple-600 text-sm">
                    O{idx + 1}:
                  </span>
                  <input
                    type="text"
                    value={out}
                    onChange={(e) => handleOutputChange(idx, e.target.value)}
                    className="flex-1 px-3 py-2 rounded border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-center"
                    placeholder="e.g. 0, a, or off"
                  />
                  <button
                    onClick={() => removeOutputBox(idx)}
                    disabled={outputAlphabet.length === 1}
                    className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 disabled:opacity-50 transition"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={addOutputBox}
                className="px-4 py-2 bg-purple-200 hover:bg-purple-300 text-purple-800 rounded font-bold transition"
              >
                + Add Output Variable
              </button>
              <button
                onClick={handleGenerate}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold shadow-md transition"
              >
                Convert Machine ➔
              </button>
            </div>
          </div>
        ) : (
          /* RESULT UI: Diagram, Tuple, Table */
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Mealy SVG Canvas (Read-Only) */}
            <div className="h-[400px] bg-slate-100 border border-slate-300 rounded-xl relative mb-6 overflow-hidden shadow-inner">
              <svg className="w-full h-full select-none">
                <defs>
                  <marker
                    id="arrowMealy"
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#a855f7" />
                  </marker>
                </defs>

                {renderMealyEdges()}

                {dfaData.nodes.map((n) => (
                  <g key={n.id}>
                    {n.isInitial && (
                      <path
                        d={`M ${n.x - 55} ${n.y} L ${n.x - 22} ${n.y}`}
                        stroke="#10b981"
                        strokeWidth="3"
                        markerEnd="url(#arrowMealy)"
                      />
                    )}
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r="20"
                      fill="#ffffff"
                      stroke="#9333ea"
                      strokeWidth="2.5"
                    />
                    <text
                      x={n.x}
                      y={n.y + 4}
                      fill="#4c1d95"
                      fontSize="12"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {n.id}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            {/* 6-Tuple Definition Box */}
            <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg mb-6 shadow-sm">
              <h2 className="text-lg font-bold mb-3 text-slate-800">
                Mealy 6-Tuple: M = (Q, Σ, Δ, δ, λ, q₀)
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-mono text-slate-700">
                <p>
                  <b className="text-purple-600">Q (States):</b>{" "}
                  {`{${dfaData.states.join(", ")}}`}
                </p>
                <p>
                  <b className="text-purple-600">Σ (Inputs):</b>{" "}
                  {`{${dfaData.alphabet.join(", ")}}`}
                </p>
                <p>
                  <b className="text-purple-600">Δ (Outputs):</b>{" "}
                  {`{${outputAlphabet.join(", ")}}`}
                </p>
                <p>
                  <b className="text-purple-600">q₀ (Initial):</b>{" "}
                  {dfaData.initialState}
                </p>
              </div>
            </div>

            {/* Mealy Transition Table */}
            <h3 className="text-sm font-bold text-slate-600 mb-2 uppercase tracking-wide">
              Mealy Transition Matrix
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <thead>
                  <tr className="bg-purple-100 border-b border-purple-200 text-purple-900">
                    <th className="p-3 font-semibold">Current State</th>
                    {dfaData.alphabet.map((sym) => (
                      <th key={sym} className="p-3 font-semibold text-center">
                        Next State / Output (In = {sym})
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dfaData.states.map((st) => (
                    <tr
                      key={st}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="p-3 font-bold text-purple-700">
                        {st}
                        {st === dfaData.initialState && (
                          <span className="text-emerald-500 text-xs font-normal ml-1">
                            (Start)
                          </span>
                        )}
                      </td>
                      {dfaData.alphabet.map((sym) => {
                        const edge = mealyEdges.find(
                          (e) => e.from === st && e.input === sym,
                        );
                        return (
                          <td key={sym} className="p-3 font-mono text-center">
                            {edge ? (
                              <span className="bg-purple-50 px-3 py-1 rounded border border-purple-100">
                                {edge.to}{" "}
                                <span className="text-amber-600 font-bold mx-1">
                                  /
                                </span>{" "}
                                <span className="text-purple-700 font-bold">
                                  {edge.output}
                                </span>
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                        );
                      })}
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
