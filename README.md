# 🧮 Finite State Automata Simulator

**Live Demo:** [https://kkroffl.github.io/Mealy-Moore/]

A mathematically rigorous, interactive web application built to visualize Deterministic Finite Automata (DFA) and automatically convert them into equivalent **Mealy** and **Moore** machines. Designed as an educational tool for Theory of Computation and Automata theory presentations, it features dynamic SVG graph rendering and real-time transition matrix generation.

## ✨ Key Features

- **Interactive Graph Builder:** Draw states, define transitions, and toggle initial/final states using an intuitive click-and-point interface.
- **Dynamic SVG Rendering:** Automatically calculates node geometry, self-loops, and reciprocal edge curves to generate clean, readable automata diagrams.
- **Global State Persistence:** Built with React Context API to ensure your drawn DFA is preserved seamlessly as you navigate between conversion pages.
- **Formal Mealy Conversion:** Mathematically binds outputs to transition edges based on the destination state's accepting status.
- **Formal Moore Conversion:** Dynamically generates input fields based on the exact number of states drawn, binding outputs directly to the states.
- **Automated Formal Definitions:** Instantly generates the standard 5-tuple for DFAs and the 6-tuple ($Q, \Sigma, \Delta, \delta, \lambda, q_0$) for converted machines, alongside their complete transition matrices.

## 🛠️ Tech Stack

- **Framework:** React JS
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (for modern, responsive, utility-first UI)
- **Routing:** React Router v6 (`HashRouter` implemented for static host compatibility)
- **State Management:** React Context API (`DfaProvider`)
- **Deployment:** GitHub Pages (`gh-pages`)

## 🚀 Local Installation

1. **Clone the repository:**
   git clone [https://github.com/kkroffl/Mealy-Moore.git]
   cd Mealy-Moore

2. **Install dependencies:**
   npm install

3. **Start the development server:**
   npm run dev
   Open http://localhost:5173/Mealy-Moore/ in your browser.

## 📖 How to Use

1. **Build a DFA:** Use the Home Page builder to add states ($q_0, q_1$, etc.). Click **Add Transition** to link them with inputs (e.g., `0` or `1`).
2. **Define State Status:** Select a state and use the **Set Initial** or **Toggle Final** buttons to define the machine's entry and exit points.
3. **Save:** Click **Save & Generate Table** to lock the DFA into the global context and view its transition matrix.
4. **Convert:** Navigate to the **Mealy** or **Moore** pages. Input your desired formal outputs ($\Delta$) to instantly generate the equivalent mathematical models and SVG diagrams.
