import { useApp } from "../context/AppProvider";
import { STATUS_LABELS, PRIORITY_COLORS } from "../constants";

export function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  const colors = {
    success: "bg-emerald-500",
    danger: "bg-rose-500",
    warning: "bg-amber-500",
  };
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-white text-sm font-semibold shadow-2xl shadow-slate-900/10 transition-all ${colors[toast.type] || "bg-slate-700"}`}>
      {toast.msg}
    </div>
  );
}

export function PriorityBadge({ prioridade }) {
  const c = PRIORITY_COLORS[prioridade] || PRIORITY_COLORS.baixa;
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {prioridade.charAt(0).toUpperCase() + prioridade.slice(1)}
    </span>
  );
}

export function StatusBadge({ status }) {
  const map = {
    pendente: "bg-gray-100 text-gray-600 border border-gray-200",
    "em andamento": "bg-blue-50 text-blue-700 border border-blue-200",
    concluída: "bg-green-50 text-green-700 border border-green-200",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status] || map.pendente}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Input({ label, ...props }) {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder:text-gray-400 bg-gray-50" {...props} />
    </div>
  );
}

export function Textarea({ label, ...props }) {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder:text-gray-400 bg-gray-50 resize-none" rows={3} {...props} />
    </div>
  );
}

export function Select({ label, children, ...props }) {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50" {...props}>
        {children}
      </select>
    </div>
  );
}

export function Btn({ children, variant = "primary", className = "", ...props }) {
  const base = "inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-semibold transition-all active:scale-[0.98] shadow-sm";
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/10",
    secondary: "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-slate-200/60",
    danger: "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/10",
    ghost: "text-gray-500 hover:bg-gray-100",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

const NAV = [
  { id: "dashboard", icon: "⊞", label: "Dashboard" },
  { id: "disciplines", icon: "📚", label: "Disciplinas" },
  { id: "tasks", icon: "✅", label: "Tarefas" },
  { id: "calendar", icon: "📅", label: "Calendário" },
  { id: "profile", icon: "👤", label: "Perfil" },
];

export function Sidebar() {
  const { page, setPage, logout, notifications, currentUser } = useApp();
  return (
    <aside className="w-56 min-h-screen bg-white/95 backdrop-blur-xl border-r border-slate-200 shadow-lg shadow-slate-900/10 flex flex-col py-6 px-4 fixed top-0 left-0 z-30">
      <div className="px-2 mb-8">
        <div className="text-indigo-600 font-bold text-lg leading-tight">Acadêmico</div>
        <div className="text-gray-400 text-xs">Gestão de Tarefas</div>
      </div>
      <nav className="flex-1 space-y-1">
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => setPage(n.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${page === n.id ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-gray-600 hover:bg-gray-50"}`}>
            <span className="text-base">{n.icon}</span>
            <span>{n.label}</span>
            {n.id === "dashboard" && notifications.length > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{notifications.length}</span>
            )}
          </button>
        ))}
      </nav>
      {currentUser?.isAdmin && (
        <div className="mt-4 px-1">
          <button
            onClick={() => setPage("admin")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${page === "admin" ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-gray-600 hover:bg-gray-50"}`}>
            <span className="text-base">🔐</span>
            <span>Admin</span>
          </button>
        </div>
      )}
      <button
        onClick={logout}
        className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all mt-4">
        <span>🚪</span> Sair
      </button>
    </aside>
  );
}

export function Layout({ children }) {
  const { notifications } = useApp();
  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="ml-56 flex-1 flex flex-col">
        {notifications.length > 0 && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center gap-2 flex-wrap">
            <span className="text-amber-600 text-sm font-semibold">🔔 Lembretes:</span>
            {notifications.map((n) => (
              <span key={n.id} className="text-amber-700 text-xs bg-amber-100 px-2 py-0.5 rounded-full">{n.mensagem}</span>
            ))}
          </div>
        )}
        <div className="flex-1 p-8">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
