import React, { createContext, useState, useEffect } from "react";

// 1. Create context
export const IPContext = createContext();

// 2. Create provider
export const IPProvider = ({ children }) => {
  const [ip, setIp] = useState("");

  // Optional: dynamically get local IP if needed
  useEffect(() => {
    // If your backend IP changes manually, you can store it in an environment variable
    // or you can try to fetch it from a small config endpoint
    const currentIP = "http://172.20.10.2"; // Example local backend IP
    setIp(currentIP);
  }, []);

  return <IPContext.Provider value={{ ip }}>{children}</IPContext.Provider>;
};