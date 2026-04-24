import { useState } from 'react';
import { DALogo } from './DALogo';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`
        flex flex-col bg-sidebar border-r border-border transition-all duration-200
        ${collapsed ? 'w-14' : 'w-64'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 h-14">
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <DALogo />
            <span className="text-gray-900 font-semibold text-sm leading-tight whitespace-nowrap">
              Direct Assurances
            </span>
          </div>
        )}
        {collapsed && <DALogo />}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="text-muted hover:text-gray-900 p-1 rounded-md hover:bg-elevated transition-colors ml-auto"
          title={collapsed ? 'Ouvrir sidebar' : 'Réduire sidebar'}
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {collapsed
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
            }
          </svg>
        </button>
      </div>

      {/* New chat button */}
      <div className="px-2 pb-3">
        <button className="
          w-full flex items-center gap-3 px-3 py-2 rounded-lg
          text-sm text-gray-900 hover:bg-elevated transition-colors
        ">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {!collapsed && <span>Nouveau devis</span>}
        </button>
      </div>

      <div className="px-2 pb-1">
        {!collapsed && (
          <p className="text-xs text-muted px-2 pb-1 uppercase tracking-wider">Aujourd'hui</p>
        )}
        {/* Active conversation */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-elevated text-sm text-gray-900 cursor-pointer">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          {!collapsed && (
            <span className="truncate">Devis Santé</span>
          )}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer */}
      <div className="border-t border-border px-2 py-3">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-elevated cursor-pointer transition-colors">
          <div className="w-7 h-7 rounded-full bg-da-blue flex items-center justify-center text-xs text-white font-semibold shrink-0">
            U
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm text-gray-900 truncate">Utilisateur</p>
              <p className="text-xs text-muted truncate">Prospect</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
