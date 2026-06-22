import { useState, useEffect, createContext, useContext } from "react";
import { db, auth } from "./firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  getDocs,
  setDoc,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

// ─── CONTEXT ────────────────────────────────────────────────────────────────
const AppContext = createContext(null);

const useApp = () => useContext(AppContext);

const PRIORITY_COLORS = {
  alta: { bg: "#FEE2E2", text: "#B91C1C", border: "#FCA5A5", dot: "#EF4444" },
  média: { bg: "#FEF9C3", text: "#92400E", border: "#FCD34D", dot: "#F59E0B" },
  baixa: { bg: "#DCFCE7", text: "#166534", border: "#86EFAC", dot: "#22C55E" },
};

const STATUS_LABELS = { pendente: "Pendente", "em andamento": "Em andamento", concluída: "Concluída" };

function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try { const raw = localStorage.getItem('sistema_currentUser'); return raw ? JSON.parse(raw) : null; } catch { return null; }
  });
  const [page, setPage] = useState(() => {
    try { const raw = localStorage.getItem('sistema_page'); return raw || 'login'; } catch { return 'login'; }
  });

  const defaultUsers = [
    { id: 1, nome: "Ana Silva", email: "ana@email.com", senha: "123456", createdAt: new Date().toISOString(), isAdmin: false },
  ];

  const [users, setUsers] = useState(() => {
    try { const raw = localStorage.getItem('sistema_users'); return raw ? JSON.parse(raw) : defaultUsers; } catch { return defaultUsers; }
  });

  const defaultDisciplines = [
    { id: 1, nome: "Cálculo I", descricao: "Derivadas, integrais e limites", userId: 1 },
    { id: 2, nome: "Física Geral", descricao: "Mecânica clássica", userId: 1 },
    { id: 3, nome: "POO", descricao: "Programação Orientada a Objetos", userId: 1 },
  ];

  const [disciplines, setDisciplines] = useState(() => {
    try { const raw = localStorage.getItem('sistema_disciplines'); return raw ? JSON.parse(raw) : defaultDisciplines; } catch { return defaultDisciplines; }
  });

  const defaultTasks = [
    { id: 1, titulo: "Prova 1 — Cálculo", descricao: "Estudar capítulos 1 a 4", dataEntrega: "2025-06-25", prioridade: "alta", status: "pendente", disciplinaId: 1, userId: 1 },
    { id: 2, titulo: "Lista 3 — Física", descricao: "Exercícios de cinemática", dataEntrega: "2025-06-28", prioridade: "média", status: "em andamento", disciplinaId: 2, userId: 1 },
    { id: 3, titulo: "Trabalho final — POO", descricao: "Sistema de biblioteca em Java", dataEntrega: "2025-07-10", prioridade: "baixa", status: "concluída", disciplinaId: 3, userId: 1 },
    { id: 4, titulo: "Seminário — Física", descricao: "Apresentação sobre relatividade", dataEntrega: "2025-07-05", prioridade: "média", status: "pendente", disciplinaId: 2, userId: 1 },
  ];

  const [tasks, setTasks] = useState(() => {
    try { const raw = localStorage.getItem('sistema_tasks'); return raw ? JSON.parse(raw) : defaultTasks; } catch { return defaultTasks; }
  });

  const [notifications, setNotifications] = useState([]);
  
  // Monitorar autenticação do Firebase
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDocs(query(collection(db, "users"), where("firebaseId", "==", firebaseUser.uid)));
          if (!userDoc.empty) {
            setCurrentUser({ ...userDoc.docs[0].data(), id: userDoc.docs[0].id });
            setPage("dashboard");
          }
        } catch (error) {
          console.error("Erro ao carregar usuário do Firestore:", error);
        }
      } else {
        setCurrentUser(null);
        setPage("login");
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Carregar tarefas do Firestore em tempo real
  useEffect(() => {
    if (!currentUser) return;

    const tasksQuery = query(
      collection(db, "tasks"),
      where("userId", "==", currentUser.id)
    );

    const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
      const firebaseTasks = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTasks(firebaseTasks);
    }, (error) => {
      console.error("Erro ao carregar tarefas do Firestore:", error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Carregar disciplinas do Firestore em tempo real
  useEffect(() => {
    if (!currentUser) return;

    const disciplinesQuery = query(
      collection(db, "disciplines"),
      where("userId", "==", currentUser.id)
    );

    const unsubscribe = onSnapshot(disciplinesQuery, (snapshot) => {
      const firebaseDisciplines = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setDisciplines(firebaseDisciplines);
    }, (error) => {
      console.error("Erro ao carregar disciplinas do Firestore:", error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const [toast, setToast] = useState(null);
  const [registrations, setRegistrations] = useState(() => {
    try { const raw = localStorage.getItem('sistema_registrations'); if (raw) return JSON.parse(raw); return users.map(u => ({ id: u.id, userId: u.id, nome: u.nome, email: u.email, date: u.createdAt })); } catch { return users.map(u => ({ id: u.id, userId: u.id, nome: u.nome, email: u.email, date: u.createdAt })); }
  });

  useEffect(() => {
    if (!currentUser) return;
    const today = new Date();
    const soon = tasks.filter(t => {
      if (t.userId !== currentUser.id || t.status === "concluída") return false;
      const diff = (new Date(t.dataEntrega) - today) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 3;
    });
    setNotifications(soon.map(t => ({
      id: t.id,
      mensagem: `"${t.titulo}" vence em ${Math.ceil((new Date(t.dataEntrega) - today) / (1000 * 60 * 60 * 24))} dia(s)!`,
      dataEnvio: new Date().toISOString(),
    })));
  }, [tasks, currentUser]);

  // Persist data to localStorage
  useEffect(() => {
    try { localStorage.setItem('sistema_users', JSON.stringify(users)); } catch {}
  }, [users]);
  useEffect(() => { try { localStorage.setItem('sistema_disciplines', JSON.stringify(disciplines)); } catch {} }, [disciplines]);
  useEffect(() => { try { localStorage.setItem('sistema_tasks', JSON.stringify(tasks)); } catch {} }, [tasks]);
  useEffect(() => { try { localStorage.setItem('sistema_registrations', JSON.stringify(registrations)); } catch {} }, [registrations]);
  useEffect(() => { try { localStorage.setItem('sistema_currentUser', JSON.stringify(currentUser)); } catch {} }, [currentUser]);
  useEffect(() => { try { localStorage.setItem('sistema_page', page); } catch {} }, [page]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const login = async (email, senha) => {
    try {
      const e = email?.trim().toLowerCase();
      const s = senha?.trim();
      const userCredential = await signInWithEmailAndPassword(auth, e, s);
      const firebaseUser = userCredential.user;

      const userDoc = await getDocs(query(collection(db, "users"), where("firebaseId", "==", firebaseUser.uid)));
      if (!userDoc.empty) {
        setCurrentUser({ ...userDoc.docs[0].data(), id: userDoc.docs[0].id });
        setPage("dashboard");
        return true;
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      showToast("Email ou senha incorretos.", "danger");
      return false;
    }
  };

  const register = async (nome, email, senha) => {
    try {
      const e = email?.trim().toLowerCase();
      const s = senha?.trim();
      const n = nome?.trim();

      // Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, e, s);
      const firebaseUser = userCredential.user;

      // Salvar dados do usuário no Firestore
      const userData = {
        firebaseId: firebaseUser.uid,
        nome: n,
        email: e,
        createdAt: new Date().toISOString(),
        isAdmin: false,
      };

      const userRef = doc(collection(db, "users"));
      await setDoc(userRef, userData);

      setCurrentUser({ ...userData, id: userRef.id });
      setPage("dashboard");

      // Adicionar aos registrations
      setRegistrations(prev => [...prev, {
        id: userRef.id,
        userId: userRef.id,
        nome: n,
        email: e,
        date: new Date().toISOString()
      }]);

      return true;
    } catch (error) {
      console.error("Erro ao registrar:", error);
      showToast(error.message || "Erro ao registrar.", "danger");
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setPage("login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      showToast("Erro ao fazer logout.", "danger");
    }
  };

  const addDiscipline = async (data) => {
    try {
      const docRef = await addDoc(collection(db, "disciplines"), {
        ...data,
        userId: currentUser.id,
        createdAt: new Date().toISOString(),
      });
      setDisciplines(prev => [...prev, { id: docRef.id, ...data, userId: currentUser.id }]);
      showToast("Disciplina cadastrada!");
    } catch (error) {
      console.error("Erro ao salvar disciplina no Firestore:", error);
      showToast("Erro ao cadastrar disciplina.", "danger");
    }
  };

  const updateDiscipline = async (id, data) => {
    try {
      await updateDoc(doc(db, "disciplines", id.toString()), data);
      setDisciplines(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
      showToast("Disciplina atualizada!");
    } catch (error) {
      console.error("Erro ao atualizar disciplina no Firestore:", error);
      showToast("Erro ao atualizar disciplina.", "danger");
    }
  };

  const deleteDiscipline = async (id) => {
    try {
      await deleteDoc(doc(db, "disciplines", id.toString()));
      setDisciplines(prev => prev.filter(d => d.id !== id));
      setTasks(prev => prev.filter(t => t.disciplinaId !== id));
      showToast("Disciplina excluída!", "danger");
    } catch (error) {
      console.error("Erro ao excluir disciplina no Firestore:", error);
      showToast("Erro ao excluir disciplina.", "danger");
    }
  };

  const addTask = async (data) => {
    try {
      const docRef = await addDoc(collection(db, "tasks"), {
        ...data,
        status: "pendente",
        userId: currentUser.id,
        createdAt: new Date().toISOString(),
      });

      setTasks(prev => [...prev, { id: docRef.id, ...data, status: "pendente", userId: currentUser.id, createdAt: new Date().toISOString() }]);
      showToast("Tarefa cadastrada!");
    } catch (error) {
      console.error("Erro ao salvar tarefa no Firestore:", error);
      showToast("Erro ao cadastrar tarefa.", "danger");
    }
  };

  const updateTask = async (id, data) => {
    try {
      await updateDoc(doc(db, "tasks", id.toString()), data);
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
      showToast("Tarefa atualizada!");
    } catch (error) {
      console.error("Erro ao atualizar tarefa no Firestore:", error);
      showToast("Erro ao atualizar tarefa.", "danger");
    }
  };

  const deleteTask = async (id) => {
    try {
      await deleteDoc(doc(db, "tasks", id.toString()));
      setTasks(prev => prev.filter(t => t.id !== id));
      showToast("Tarefa excluída!", "danger");
    } catch (error) {
      console.error("Erro ao excluir tarefa no Firestore:", error);
      showToast("Erro ao excluir tarefa.", "danger");
    }
  };

  const toggleTask = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const nextStatus = task.status === "concluída" ? "pendente" : "concluída";
    try {
      await updateDoc(doc(db, "tasks", id.toString()), { status: nextStatus });
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: nextStatus } : t));
    } catch (error) {
      console.error("Erro ao alternar status da tarefa no Firestore:", error);
      showToast("Erro ao atualizar tarefa.", "danger");
    }
  };

  const grantAdmin = async (userId) => {
    try {
      await updateDoc(doc(db, "users", userId.toString()), { isAdmin: true });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isAdmin: true } : u));
      showToast("Permissão de administrador concedida!");
    } catch (error) {
      console.error("Erro ao conceder admin:", error);
      showToast("Erro ao conceder permissão de admin.", "danger");
    }
  };

  const revokeAdmin = async (userId) => {
    try {
      await updateDoc(doc(db, "users", userId.toString()), { isAdmin: false });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isAdmin: false } : u));
      showToast("Permissão de administrador removida!");
    } catch (error) {
      console.error("Erro ao revogar admin:", error);
      showToast("Erro ao revogar permissão de admin.", "danger");
    }
  };

  const userDisciplines = disciplines.filter(d => currentUser && d.userId === currentUser.id);
  const userTasks = tasks.filter(t => currentUser && t.userId === currentUser.id);

  return (
    <AppContext.Provider value={{
      currentUser, page, setPage, login, register, logout,
      disciplines: userDisciplines, addDiscipline, updateDiscipline, deleteDiscipline,
      tasks: userTasks, addTask, updateTask, deleteTask, toggleTask,
      notifications, toast, showToast,
      users, registrations, grantAdmin, revokeAdmin,
    }}>
      {children}
    </AppContext.Provider>
  );
}

// ─── COMPONENTS ─────────────────────────────────────────────────────────────

function Toast() {
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

function PriorityBadge({ prioridade }) {
  const c = PRIORITY_COLORS[prioridade] || PRIORITY_COLORS.baixa;
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {prioridade.charAt(0).toUpperCase() + prioridade.slice(1)}
    </span>
  );
}

function StatusBadge({ status }) {
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

function Modal({ title, onClose, children }) {
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

function Input({ label, ...props }) {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder:text-gray-400 bg-gray-50" {...props} />
    </div>
  );
}

function Textarea({ label, ...props }) {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder:text-gray-400 bg-gray-50 resize-none" rows={3} {...props} />
    </div>
  );
}

function Select({ label, children, ...props }) {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50" {...props}>
        {children}
      </select>
    </div>
  );
}

function Btn({ children, variant = "primary", className = "", ...props }) {
  const base = "inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-semibold transition-all active:scale-[0.98] shadow-sm";
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/10",
    secondary: "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-slate-200/60",
    danger: "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/10",
    ghost: "text-gray-500 hover:bg-gray-100",
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props}>{children}</button>;
}

// ─── SIDEBAR ────────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", icon: "⊞", label: "Dashboard" },
  { id: "disciplines", icon: "📚", label: "Disciplinas" },
  { id: "tasks", icon: "✅", label: "Tarefas" },
  { id: "calendar", icon: "📅", label: "Calendário" },
  { id: "profile", icon: "👤", label: "Perfil" },
];

function Sidebar() {
  const { page, setPage, logout, notifications, currentUser } = useApp();
  return (
    <aside className="w-56 min-h-screen bg-white/95 backdrop-blur-xl border-r border-slate-200 shadow-lg shadow-slate-900/10 flex flex-col py-6 px-4 fixed top-0 left-0 z-30">
      <div className="px-2 mb-8">
        <div className="text-indigo-600 font-bold text-lg leading-tight">Acadêmico</div>
        <div className="text-gray-400 text-xs">Gestão de Tarefas</div>
      </div>
      <nav className="flex-1 space-y-1">
        {NAV.map(n => (
          <button key={n.id} onClick={() => setPage(n.id)}
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
          <button onClick={() => setPage('admin')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${page === 'admin' ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-gray-600 hover:bg-gray-50"}`}>
            <span className="text-base">🔐</span>
            <span>Admin</span>
          </button>
        </div>
      )}
      <button onClick={logout} className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all mt-4">
        <span>🚪</span> Sair
      </button>
    </aside>
  );
}

function Layout({ children }) {
  const { notifications } = useApp();
  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="ml-56 flex-1 flex flex-col">
        {notifications.length > 0 && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center gap-2 flex-wrap">
            <span className="text-amber-600 text-sm font-semibold">🔔 Lembretes:</span>
            {notifications.map(n => (
              <span key={n.id} className="text-amber-700 text-xs bg-amber-100 px-2 py-0.5 rounded-full">{n.mensagem}</span>
            ))}
          </div>
        )}
        <div className="flex-1 p-8">{children}</div>
      </main>
    </div>
  );
}

function PageHeader({ title, subtitle, action }) {
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

// ─── LOGIN ───────────────────────────────────────────────────────────────────
function LoginPage() {
  const { login, setPage } = useApp();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!login(email.trim(), senha.trim())) setError("Email ou senha incorretos.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🎓</div>
          <h1 className="text-2xl font-bold text-gray-900">Bem-vindo</h1>
          <p className="text-gray-500 text-sm mt-1">Sistema de Gestão de Tarefas Acadêmicas</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={submit}>
            <Input label="Email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            <Input label="Senha" type="password" placeholder="••••••••" value={senha} onChange={e => setSenha(e.target.value)} required />
            {error && <p className="text-red-500 text-sm mb-4 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <Btn type="submit" className="w-full justify-center py-2.5">Entrar</Btn>
          </form>
          <p className="text-center text-sm text-gray-500 mt-5">
            Não tem conta?{" "}
            <button onClick={() => setPage("register")} className="text-indigo-600 hover:underline font-medium">Cadastrar-se</button>
          </p>
          <p className="text-center text-xs text-gray-400 mt-4">Demo: ana@email.com / 123456</p>
        </div>
      </div>
    </div>
  );
}

// ─── REGISTER ────────────────────────────────────────────────────────────────
function RegisterPage() {
  const { register, setPage } = useApp();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!register(nome.trim(), email.trim(), senha.trim())) setError("Este email já está cadastrado.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">📝</div>
          <h1 className="text-2xl font-bold text-gray-900">Criar conta</h1>
          <p className="text-gray-500 text-sm mt-1">Comece a organizar sua vida acadêmica</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={submit}>
            <Input label="Nome completo" placeholder="Seu nome" value={nome} onChange={e => setNome(e.target.value)} required />
            <Input label="Email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            <Input label="Senha" type="password" placeholder="Mínimo 6 caracteres" value={senha} onChange={e => setSenha(e.target.value)} minLength={6} required />
            {error && <p className="text-red-500 text-sm mb-4 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <Btn type="submit" className="w-full justify-center py-2.5">Criar conta</Btn>
          </form>
          <p className="text-center text-sm text-gray-500 mt-5">
            Já tem conta?{" "}
            <button onClick={() => setPage("login")} className="text-indigo-600 hover:underline font-medium">Entrar</button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function DashboardPage() {
  const { tasks, disciplines, currentUser, setPage } = useApp();
  const pending = tasks.filter(t => t.status !== "concluída");
  const done = tasks.filter(t => t.status === "concluída");
  const progress = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0;

  const today = new Date();
  const upcoming = [...pending]
    .sort((a, b) => new Date(a.dataEntrega) - new Date(b.dataEntrega))
    .slice(0, 5);

  const getDaysLeft = (date) => {
    const diff = Math.ceil((new Date(date) - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return <span className="text-red-500 text-xs font-semibold">Atrasada!</span>;
    if (diff === 0) return <span className="text-red-500 text-xs font-semibold">Hoje!</span>;
    return <span className="text-gray-400 text-xs">{diff} dia{diff > 1 ? "s" : ""}</span>;
  };

  const getDisciplineName = (id) => disciplines.find(d => d.id === id)?.nome || "—";

  const byDiscipline = disciplines.map(d => ({
    ...d,
    total: tasks.filter(t => t.disciplinaId === d.id).length,
    done: tasks.filter(t => t.disciplinaId === d.id && t.status === "concluída").length,
  })).filter(d => d.total > 0);

  return (
    <div>
      <PageHeader
        title={`Olá, ${currentUser?.nome?.split(" ")[0]} 👋`}
        subtitle="Aqui está um resumo das suas atividades acadêmicas."
      />

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Pendentes", value: pending.length, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Concluídas", value: done.length, color: "text-green-600", bg: "bg-green-50" },
          { label: "Disciplinas", value: disciplines.length, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Total de tarefas", value: tasks.length, color: "text-gray-700", bg: "bg-gray-50" },
        ].map(m => (
          <div key={m.label} className={`${m.bg} rounded-2xl p-5`}>
            <p className="text-xs text-gray-500 font-medium mb-1">{m.label}</p>
            <p className={`text-3xl font-bold ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Progresso geral</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 bg-gray-100 rounded-full h-3">
              <div className="bg-indigo-500 h-3 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-sm font-bold text-indigo-600 w-10 text-right">{progress}%</span>
          </div>
          <p className="text-sm text-gray-500">{done.length} de {tasks.length} tarefa{tasks.length !== 1 ? "s" : ""} concluída{done.length !== 1 ? "s" : ""}.</p>

          {byDiscipline.length > 0 && (
            <div className="mt-4 space-y-3">
              {byDiscipline.map(d => (
                <div key={d.id}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{d.nome}</span>
                    <span>{d.done}/{d.total}</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-1.5">
                    <div className="bg-indigo-400 h-1.5 rounded-full" style={{ width: `${d.total ? (d.done / d.total) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Próximos prazos</h2>
            <button onClick={() => setPage("tasks")} className="text-indigo-600 text-xs hover:underline">Ver todas →</button>
          </div>
          {upcoming.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-3xl mb-2">🎉</div>
              <p className="text-sm">Sem tarefas pendentes!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map(t => {
                const c = PRIORITY_COLORS[t.prioridade] || PRIORITY_COLORS.baixa;
                return (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: c.dot }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{t.titulo}</p>
                      <p className="text-xs text-gray-400">{getDisciplineName(t.disciplinaId)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {getDaysLeft(t.dataEntrega)}
                      <p className="text-xs text-gray-400">{new Date(t.dataEntrega + "T00:00").toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── DISCIPLINES ─────────────────────────────────────────────────────────────
function DisciplineForm({ initial, onSave, onClose }) {
  const [nome, setNome] = useState(initial?.nome || "");
  const [descricao, setDescricao] = useState(initial?.descricao || "");
  const submit = (e) => { e.preventDefault(); onSave({ nome, descricao }); onClose(); };
  return (
    <form onSubmit={submit}>
      <Input label="Nome da disciplina" placeholder="Ex: Cálculo I" value={nome} onChange={e => setNome(e.target.value)} required />
      <Textarea label="Descrição" placeholder="Conteúdo, professor, turma..." value={descricao} onChange={e => setDescricao(e.target.value)} />
      <div className="flex gap-2 justify-end mt-2">
        <Btn type="button" variant="secondary" onClick={onClose}>Cancelar</Btn>
        <Btn type="submit">{initial ? "Salvar alterações" : "Cadastrar"}</Btn>
      </div>
    </form>
  );
}

function DisciplinesPage() {
  const { disciplines, tasks, addDiscipline, updateDiscipline, deleteDiscipline } = useApp();
  const [modal, setModal] = useState(null); // null | "add" | {edit: disc}
  const [confirmDel, setConfirmDel] = useState(null);

  const getTaskCount = (id) => tasks.filter(t => t.disciplinaId === id).length;
  const getDoneCount = (id) => tasks.filter(t => t.disciplinaId === id && t.status === "concluída").length;

  return (
    <div>
      <PageHeader title="Disciplinas" subtitle="Organize suas matérias do semestre."
        action={<Btn onClick={() => setModal("add")}>+ Nova disciplina</Btn>} />

      {disciplines.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">📚</div>
          <p className="font-medium">Nenhuma disciplina cadastrada.</p>
          <p className="text-sm mt-1">Comece adicionando uma matéria.</p>
          <Btn className="mt-4" onClick={() => setModal("add")}>+ Adicionar disciplina</Btn>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {disciplines.map(d => {
            const total = getTaskCount(d.id);
            const done = getDoneCount(d.id);
            const pct = total ? Math.round((done / total) * 100) : 0;
            return (
              <div key={d.id} className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-3 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">
                    {d.nome.charAt(0)}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setModal({ edit: d })} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-indigo-600 transition-colors">✏️</button>
                    <button onClick={() => setConfirmDel(d)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">🗑️</button>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{d.nome}</h3>
                  {d.descricao && <p className="text-sm text-gray-400 mt-0.5 line-clamp-2">{d.descricao}</p>}
                </div>
                <div className="mt-auto">
                  <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                    <span>{total} tarefa{total !== 1 ? "s" : ""}</span>
                    <span>{done} concluída{done !== 1 ? "s" : ""} · {pct}%</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-1.5">
                    <div className="bg-indigo-400 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal === "add" && (
        <Modal title="Nova disciplina" onClose={() => setModal(null)}>
          <DisciplineForm onSave={addDiscipline} onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal?.edit && (
        <Modal title="Editar disciplina" onClose={() => setModal(null)}>
          <DisciplineForm initial={modal.edit} onSave={(data) => updateDiscipline(modal.edit.id, data)} onClose={() => setModal(null)} />
        </Modal>
      )}
      {confirmDel && (
        <Modal title="Excluir disciplina" onClose={() => setConfirmDel(null)}>
          <p className="text-gray-600 text-sm mb-2">Tem certeza que deseja excluir <strong>{confirmDel.nome}</strong>?</p>
          <p className="text-red-500 text-xs mb-5">Todas as tarefas desta disciplina também serão excluídas.</p>
          <div className="flex gap-2 justify-end">
            <Btn variant="secondary" onClick={() => setConfirmDel(null)}>Cancelar</Btn>
            <Btn variant="danger" onClick={() => { deleteDiscipline(confirmDel.id); setConfirmDel(null); }}>Excluir</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── TASKS ───────────────────────────────────────────────────────────────────
function TaskForm({ initial, onSave, onClose }) {
  const { disciplines } = useApp();
  const [titulo, setTitulo] = useState(initial?.titulo || "");
  const [descricao, setDescricao] = useState(initial?.descricao || "");
  const [dataEntrega, setDataEntrega] = useState(initial?.dataEntrega || "");
  const [prioridade, setPrioridade] = useState(initial?.prioridade || "média");
  const [status, setStatus] = useState(initial?.status || "pendente");
  const [disciplinaId, setDisciplinaId] = useState(initial?.disciplinaId || (disciplines[0]?.id || ""));

  const submit = (e) => {
    e.preventDefault();
    onSave({ titulo, descricao, dataEntrega, prioridade, status, disciplinaId: Number(disciplinaId) });
    onClose();
  };

  return (
    <form onSubmit={submit}>
      <Input label="Título" placeholder="Nome da tarefa" value={titulo} onChange={e => setTitulo(e.target.value)} required />
      <Textarea label="Descrição" placeholder="Detalhes da atividade..." value={descricao} onChange={e => setDescricao(e.target.value)} />
      <Select label="Disciplina" value={disciplinaId} onChange={e => setDisciplinaId(e.target.value)}>
        {disciplines.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
      </Select>
      <div className="grid grid-cols-2 gap-3">
        <Select label="Prioridade" value={prioridade} onChange={e => setPrioridade(e.target.value)}>
          <option value="alta">Alta</option>
          <option value="média">Média</option>
          <option value="baixa">Baixa</option>
        </Select>
        <Select label="Status" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="pendente">Pendente</option>
          <option value="em andamento">Em andamento</option>
          <option value="concluída">Concluída</option>
        </Select>
      </div>
      <Input label="Data de entrega" type="date" value={dataEntrega} onChange={e => setDataEntrega(e.target.value)} required />
      <div className="flex gap-2 justify-end mt-2">
        <Btn type="button" variant="secondary" onClick={onClose}>Cancelar</Btn>
        <Btn type="submit">{initial ? "Salvar alterações" : "Cadastrar"}</Btn>
      </div>
    </form>
  );
}

function TasksPage() {
  const { tasks, disciplines, addTask, updateTask, deleteTask, toggleTask } = useApp();
  const [modal, setModal] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("todas");
  const [filterStatus, setFilterStatus] = useState("todas");
  const [filterDisc, setFilterDisc] = useState("todas");

  const getDisciplineName = (id) => disciplines.find(d => d.id === id)?.nome || "—";

  const filtered = tasks.filter(t => {
    const matchSearch = t.titulo.toLowerCase().includes(search.toLowerCase()) ||
      t.descricao.toLowerCase().includes(search.toLowerCase());
    const matchP = filterPriority === "todas" || t.prioridade === filterPriority;
    const matchS = filterStatus === "todas" || t.status === filterStatus;
    const matchD = filterDisc === "todas" || t.disciplinaId === Number(filterDisc);
    return matchSearch && matchP && matchS && matchD;
  }).sort((a, b) => {
    const order = { alta: 0, média: 1, baixa: 2 };
    return order[a.prioridade] - order[b.prioridade];
  });

  const today = new Date();
  const getDaysLeft = (date) => {
    const diff = Math.ceil((new Date(date) - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { label: "Atrasada!", cls: "text-red-500" };
    if (diff === 0) return { label: "Hoje!", cls: "text-red-500 font-semibold" };
    if (diff <= 2) return { label: `${diff}d`, cls: "text-orange-500" };
    return { label: `${diff}d`, cls: "text-gray-400" };
  };

  return (
    <div>
      <PageHeader title="Tarefas" subtitle="Gerencie todas as suas atividades acadêmicas."
        action={<Btn onClick={() => setModal("add")} disabled={disciplines.length === 0}>+ Nova tarefa</Btn>} />

      {disciplines.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-sm mb-6">
          ⚠️ Cadastre ao menos uma disciplina antes de criar tarefas.
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px]">
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50 placeholder:text-gray-400"
            placeholder="🔍  Buscar tarefas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700" value={filterDisc} onChange={e => setFilterDisc(e.target.value)}>
          <option value="todas">Todas as disciplinas</option>
          {disciplines.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
        </select>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="todas">Todas as prioridades</option>
          <option value="alta">Alta</option>
          <option value="média">Média</option>
          <option value="baixa">Baixa</option>
        </select>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="todas">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="em andamento">Em andamento</option>
          <option value="concluída">Concluída</option>
        </select>
        {(search || filterPriority !== "todas" || filterStatus !== "todas" || filterDisc !== "todas") && (
          <button onClick={() => { setSearch(""); setFilterPriority("todas"); setFilterStatus("todas"); setFilterDisc("todas"); }}
            className="text-xs text-gray-400 hover:text-gray-600 underline">Limpar filtros</button>
        )}
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">🔍</div>
          <p className="font-medium">{tasks.length === 0 ? "Nenhuma tarefa cadastrada." : "Nenhuma tarefa encontrada."}</p>
          {tasks.length === 0 && <Btn className="mt-4" onClick={() => setModal("add")}>+ Adicionar tarefa</Btn>}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(t => {
            const c = PRIORITY_COLORS[t.prioridade] || PRIORITY_COLORS.baixa;
            const dl = getDaysLeft(t.dataEntrega);
            const isDone = t.status === "concluída";
            return (
              <div key={t.id} className={`bg-white rounded-2xl border transition-all ${isDone ? "border-green-100 opacity-70" : "border-gray-100 hover:shadow-sm"}`}>
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Priority bar */}
                  <div className="w-1.5 h-12 rounded-full flex-shrink-0" style={{ background: c.dot }} />
                  {/* Checkbox */}
                  <button onClick={() => toggleTask(t.id)}
                    className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${isDone ? "bg-green-500 border-green-500 text-white" : "border-gray-300 hover:border-indigo-400"}`}>
                    {isDone && <span className="text-xs">✓</span>}
                  </button>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${isDone ? "line-through text-gray-400" : "text-gray-800"}`}>{t.titulo}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      <span className="text-xs text-gray-400">{getDisciplineName(t.disciplinaId)}</span>
                      {t.descricao && <span className="text-gray-200 text-xs">·</span>}
                      {t.descricao && <span className="text-xs text-gray-400 truncate max-w-[200px]">{t.descricao}</span>}
                    </div>
                  </div>
                  {/* Badges + date */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="hidden sm:flex flex-col items-end gap-1">
                      <PriorityBadge prioridade={t.prioridade} />
                      <StatusBadge status={t.status} />
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-medium ${dl.cls}`}>{dl.label}</p>
                      <p className="text-xs text-gray-400">{new Date(t.dataEntrega + "T00:00").toLocaleDateString("pt-BR")}</p>
                    </div>
                    {/* Actions */}
                    <div className="flex gap-1">
                      <button onClick={() => setModal({ edit: t })} className="p-1.5 rounded-lg text-gray-300 hover:bg-gray-100 hover:text-indigo-600 transition-colors">✏️</button>
                      <button onClick={() => setConfirmDel(t)} className="p-1.5 rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors">🗑️</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {filtered.length > 0 && (
        <p className="text-xs text-gray-400 mt-4 text-center">
          Mostrando {filtered.length} de {tasks.length} tarefa{tasks.length !== 1 ? "s" : ""}
        </p>
      )}

      {modal === "add" && (
        <Modal title="Nova tarefa" onClose={() => setModal(null)}>
          <TaskForm onSave={addTask} onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal?.edit && (
        <Modal title="Editar tarefa" onClose={() => setModal(null)}>
          <TaskForm initial={modal.edit} onSave={(data) => updateTask(modal.edit.id, data)} onClose={() => setModal(null)} />
        </Modal>
      )}
      {confirmDel && (
        <Modal title="Excluir tarefa" onClose={() => setConfirmDel(null)}>
          <p className="text-gray-600 text-sm mb-5">Tem certeza que deseja excluir <strong>{confirmDel.titulo}</strong>?</p>
          <div className="flex gap-2 justify-end">
            <Btn variant="secondary" onClick={() => setConfirmDel(null)}>Cancelar</Btn>
            <Btn variant="danger" onClick={() => { deleteTask(confirmDel.id); setConfirmDel(null); }}>Excluir</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── CALENDAR ────────────────────────────────────────────────────────────────
function CalendarPage() {
  const { tasks, disciplines } = useApp();
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthNames = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const getTasksForDay = (day) => tasks.filter(t => {
    const d = new Date(t.dataEntrega + "T00:00");
    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
  });

  const getDisciplineName = (id) => disciplines.find(d => d.id === id)?.nome || "—";

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = (d) => d && today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
  const selectedTasks = selectedDay ? getTasksForDay(selectedDay) : [];

  return (
    <div>
      <PageHeader title="Calendário" subtitle="Visualize suas tarefas por data." />

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">◀</button>
          <h2 className="font-semibold text-gray-800 text-lg">{monthNames[month]} {year}</h2>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">▶</button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            const dayTasks = day ? getTasksForDay(day) : [];
            const dots = dayTasks.slice(0, 3);
            return (
              <div key={i}
                onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
                className={`min-h-[52px] p-1 rounded-xl flex flex-col items-center transition-colors cursor-pointer
                  ${!day ? "" : isToday(day) ? "bg-indigo-100 ring-2 ring-indigo-400" : day === selectedDay ? "bg-indigo-50" : "hover:bg-gray-50"}`}>
                {day && (
                  <>
                    <span className={`text-sm w-7 h-7 flex items-center justify-center rounded-full font-medium
                      ${isToday(day) ? "bg-indigo-600 text-white" : "text-gray-700"}`}>{day}</span>
                    <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                      {dots.map((t, ti) => (
                        <div key={ti} className="w-1.5 h-1.5 rounded-full" style={{ background: PRIORITY_COLORS[t.prioridade]?.dot || "#6366f1" }} />
                      ))}
                      {dayTasks.length > 3 && <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
          {Object.entries(PRIORITY_COLORS).map(([label, c]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.dot }} />
              <span className="text-xs text-gray-500 capitalize">{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">H</span>
            </div>
            <span className="text-xs text-gray-500">Hoje</span>
          </div>
        </div>
      </div>

      {/* Selected day tasks */}
      {selectedDay && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">
            Tarefas em {String(selectedDay).padStart(2,"0")}/{String(month+1).padStart(2,"0")}/{year}
          </h3>
          {selectedTasks.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Nenhuma tarefa neste dia.</p>
          ) : (
            <div className="space-y-3">
              {selectedTasks.map(t => {
                const c = PRIORITY_COLORS[t.prioridade] || PRIORITY_COLORS.baixa;
                return (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: c.dot }} />
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${t.status === "concluída" ? "line-through text-gray-400" : "text-gray-800"}`}>{t.titulo}</p>
                      <p className="text-xs text-gray-400">{getDisciplineName(t.disciplinaId)}</p>
                    </div>
                    <div className="flex gap-2">
                      <PriorityBadge prioridade={t.prioridade} />
                      <StatusBadge status={t.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── PROFILE ─────────────────────────────────────────────────────────────────
function ProfilePage() {
  const { currentUser, tasks, disciplines, showToast, grantAdmin, revokeAdmin } = useApp();
  const [editing, setEditing] = useState(false);
  const [nome, setNome] = useState(currentUser?.nome || "");

  const pending = tasks.filter(t => t.status === "pendente").length;
  const inProgress = tasks.filter(t => t.status === "em andamento").length;
  const done = tasks.filter(t => t.status === "concluída").length;
  const overdue = tasks.filter(t => t.status !== "concluída" && new Date(t.dataEntrega) < new Date()).length;

  const save = () => {
    setEditing(false);
    showToast("Perfil atualizado!");
  };

  const initials = currentUser?.nome?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div>
      <PageHeader title="Perfil" subtitle="Seus dados e estatísticas acadêmicas." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl font-bold mb-4">
            {initials}
          </div>
          {editing ? (
            <div className="w-full">
              <Input label="Nome" value={nome} onChange={e => setNome(e.target.value)} />
              <div className="flex gap-2 justify-center">
                <Btn variant="secondary" onClick={() => setEditing(false)}>Cancelar</Btn>
                <Btn onClick={save}>Salvar</Btn>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-800">{currentUser?.nome}</h2>
              <p className="text-gray-400 text-sm mt-1">{currentUser?.email}</p>
              <span className="mt-2 text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium">Estudante</span>
              <div className="mt-4 flex items-center gap-3 justify-center">
                <button onClick={() => setEditing(true)} className="text-sm text-indigo-600 hover:underline">✏️ Editar nome</button>
                {currentUser && !currentUser.isAdmin && (
                  <Btn onClick={() => grantAdmin(currentUser.id)}>Tornar-me admin</Btn>
                )}
                {currentUser && currentUser.isAdmin && (
                  <Btn variant="secondary" onClick={() => revokeAdmin(currentUser.id)}>Revogar admin</Btn>
                )}
              </div>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {[
            { label: "Disciplinas", value: disciplines.length, icon: "📚", color: "indigo" },
            { label: "Tarefas pendentes", value: pending, icon: "⏳", color: "orange" },
            { label: "Em andamento", value: inProgress, icon: "🔄", color: "blue" },
            { label: "Concluídas", value: done, icon: "✅", color: "green" },
            { label: "Atrasadas", value: overdue, icon: "⚠️", color: "red" },
            { label: "Total de tarefas", value: tasks.length, icon: "📋", color: "purple" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="text-2xl mb-2">{s.icon}</div>
              <p className="text-2xl font-bold text-gray-800">{s.value}</p>
              <p className="text-sm text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Disciplines summary */}
      {disciplines.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mt-6">
          <h3 className="font-semibold text-gray-800 mb-4">Progresso por disciplina</h3>
          <div className="space-y-4">
            {disciplines.map(d => {
              const total = tasks.filter(t => t.disciplinaId === d.id).length;
              const doneCount = tasks.filter(t => t.disciplinaId === d.id && t.status === "concluída").length;
              const pct = total ? Math.round((doneCount / total) * 100) : 0;
              return (
                <div key={d.id}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-gray-700">{d.nome}</span>
                    <span className="text-gray-400">{doneCount}/{total} tarefas · {pct}%</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all ${pct === 100 ? "bg-green-500" : "bg-indigo-400"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ADMIN PANEL ───────────────────────────────────────────────────────────
function AdminPanel() {
  const { users, registrations, grantAdmin, revokeAdmin } = useApp();

  return (
    <div>
      <PageHeader title="Admin" subtitle="Registros de cadastros e contas." />

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Contas</h3>
          <div className="space-y-2">
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between p-3 rounded-md hover:bg-gray-50">
                <div>
                  <div className="font-medium text-gray-800">{u.nome} <span className="text-xs text-gray-400">({u.email})</span></div>
                  <div className="text-xs text-gray-400">Criado em: {u.createdAt ? new Date(u.createdAt).toLocaleString() : "-"}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${u.isAdmin ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>{u.isAdmin ? 'Admin' : 'Usuário'}</span>
                  {u.isAdmin ? (
                    <Btn variant="secondary" onClick={() => revokeAdmin(u.id)}>Remover admin</Btn>
                  ) : (
                    <Btn onClick={() => grantAdmin(u.id)}>Tornar admin</Btn>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Registros de cadastro</h3>
          <div className="space-y-2 text-sm text-gray-600">
            {registrations.length === 0 ? (
              <p className="text-gray-400">Nenhum registro encontrado.</p>
            ) : (
              registrations.map(r => (
                <div key={r.id} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50">
                  <div>
                    <div className="font-medium text-gray-800">{r.nome} <span className="text-xs text-gray-400">({r.email})</span></div>
                    <div className="text-xs text-gray-400">{r.date ? new Date(r.date).toLocaleString() : '-'}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────
function AppRouter() {
  const { currentUser, page } = useApp();

  if (!currentUser) {
    if (page === "register") return <RegisterPage />;
    return <LoginPage />;
  }

  const pages = {
    dashboard: <DashboardPage />,
    disciplines: <DisciplinesPage />,
    tasks: <TasksPage />,
    calendar: <CalendarPage />,
    profile: <ProfilePage />,
    admin: <AdminPanel />,
  };

  return (
    <Layout>
      {pages[page] || <DashboardPage />}
    </Layout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
      <Toast />
    </AppProvider>
  );
}
