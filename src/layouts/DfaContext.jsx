/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext } from "react";

const DfaContext = createContext(null);

export function DfaProvider({ children }) {
  const [dfaData, setDfaData] = useState(null);

  return (
    <DfaContext.Provider value={{ dfaData, setDfaData }}>
      {children}
    </DfaContext.Provider>
  );
}

export function useDfa() {
  return useContext(DfaContext);
}
