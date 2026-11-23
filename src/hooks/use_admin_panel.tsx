"use client";

import { createContext, useContext, useState } from "react";

const AdminPanelContext = createContext({
  open: false,
  toggle: () => {},
});

export function AdminPanelProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <AdminPanelContext.Provider value={{ open, toggle: () => setOpen((prev) => !prev) }}>
      {children}
    </AdminPanelContext.Provider>
  );
}

export const useAdminPanel = () => useContext(AdminPanelContext);
