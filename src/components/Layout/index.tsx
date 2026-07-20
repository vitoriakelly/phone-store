import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import { Header } from '../Header';
import { Sidebar } from '../Sidebar';

import './styles.scss';

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  function openSidebar() {
    setIsSidebarOpen(true);
  }

  function closeSidebar() {
    setIsSidebarOpen(false);
  }

  return (
    <div className="layout">
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {isSidebarOpen && (
        <button
          type="button"
          className="layout__overlay"
          onClick={closeSidebar}
          aria-label="Fechar menu"
        />
      )}

      <div className="layout__content">
        <Header onOpenMenu={openSidebar} />

        <div className="layout__page">
          <Outlet />
        </div>
      </div>
    </div>
  );
}