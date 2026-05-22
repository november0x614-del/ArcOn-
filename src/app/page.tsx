"use client";

import App from "../App";
import { AppProvider } from "../context/AppContext";

export default function Home() {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
}
