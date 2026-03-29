import React, { createContext } from "react";

export const IPContext = createContext();

export const IPProvider = ({ children }) => {
  const ip = import.meta.env.VITE_API_URL || "http://localhost:3000";

  return <IPContext.Provider value={{ ip }}>{children}</IPContext.Provider>;
};