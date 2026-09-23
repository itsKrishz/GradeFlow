import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { ToastContainer } from '../common/ToastContainer';
import { CopilotDrawer } from '../copilot/CopilotDrawer';
import { useApp } from '../../context/AppContext';
import { Sparkles } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { currentUser, openCopilot, isCopilotOpen } = useApp();
  const location = useLocation();

  const isFullCopilotPage = location.pathname === '/teacher/copilot';

  return (
    <div className="min-h-screen flex bg-academic-lightBg dark:bg-academic-navy text-academic-lightText dark:text-academic-darkText font-sans transition-colors duration-150">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <TopNavbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>


      </div>

      {/* Global Slide-Over Copilot Drawer */}
      <CopilotDrawer />

      {/* Global notifications */}
      <ToastContainer />
    </div>
  );
};
