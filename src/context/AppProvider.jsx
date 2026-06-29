import { useState, useEffect, createContext, useContext } from "react";
import { db, auth } from "../firebase";
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
  getDoc,
  setDoc,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { normalizeDisciplineId } from "../constants";

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const raw = localStorage.getItem("sistema_currentUser");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [page, setPage] = useState(() => {
    try {
      const raw = localStorage.getItem("sistema_page");
      return raw || "login";
    } catch {
      return "login";
    }
  });

  const defaultUsers = [
    {
      id: 1,
      nome: "Ana Silva",
      email: "ana@email.com",
      senha: "123456",
      createdAt: new Date().toISOString(),
      isAdmin: false,
    },
  ];

  const [users, setUsers] = useState(() => {
    try {
      const raw = localStorage.getItem("sistema_users");
      return raw ? JSON.parse(raw) : defaultUsers;
    } catch {
      return defaultUsers;
    }
  });

  const defaultDisciplines = [
    { id: 1, nome: "Cálculo I", descricao: "Derivadas, integrais e limites", userId: 1 },
    { id: 2, nome: "Física Geral", descricao: "Mecânica clássica", userId: 1 },
    { id: 3, nome: "POO", descricao: "Programação Orientada a Objetos", userId: 1 },
  ];

  const [disciplines, setDisciplines] = useState(() => {
    try {
      const raw = localStorage.getItem("sistema_disciplines");
      return raw ? JSON.parse(raw) : defaultDisciplines;
    } catch {
      return defaultDisciplines;
    }
  });

  const defaultTasks = [
    {
      id: 1,
      titulo: "Prova 1 — Cálculo",
      descricao: "Estudar capítulos 1 a 4",
      dataEntrega: "2025-06-25",
      prioridade: "alta",
      status: "pendente",
      disciplinaId: 1,
      userId: 1,
    },
    {
      id: 2,
      titulo: "Lista 3 — Física",
      descricao: "Exercícios de cinemática",
      dataEntrega: "2025-06-28",
      prioridade: "média",
      status: "em andamento",
      disciplinaId: 2,
      userId: 1,
    },
    {
      id: 3,
      titulo: "Trabalho final — POO",
      descricao: "Sistema de biblioteca em Java",
      dataEntrega: "2025-07-10",
      prioridade: "baixa",
      status: "concluída",
      disciplinaId: 3,
      userId: 1,
    },
    {
      id: 4,
      titulo: "Seminário — Física",
      descricao: "Apresentação sobre relatividade",
      dataEntrega: "2025-07-05",
      prioridade: "média",
      status: "pendente",
      disciplinaId: 2,
      userId: 1,
    },
  ];

  const [tasks, setTasks] = useState(() => {
    try {
      const raw = localStorage.getItem("sistema_tasks");
      return raw ? JSON.parse(raw) : defaultTasks;
    } catch {
      return defaultTasks;
    }
  });

  const [notifications, setNotifications] = useState([]);
  const [toast, setToast] = useState(null);
  const [registrations, setRegistrations] = useState(() => {
    try {
      const raw = localStorage.getItem("sistema_registrations");
      if (raw) return JSON.parse(raw);
      return users.map((u) => ({ id: u.id, userId: u.id, nome: u.nome, email: u.email, date: u.createdAt }));
    } catch {
      return users.map((u) => ({ id: u.id, userId: u.id, nome: u.nome, email: u.email, date: u.createdAt }));
    }
  });

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

  useEffect(() => {
    const usersQuery = collection(db, "users");
    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        const firebaseUsers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setUsers(firebaseUsers);
      },
      (error) => {
        console.error("Erro ao carregar usuários do Firestore:", error);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const tasksQuery = query(collection(db, "tasks"), where("userId", "==", currentUser.id));
    const unsubscribe = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const firebaseTasks = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setTasks(firebaseTasks);
      },
      (error) => {
        console.error("Erro ao carregar tarefas do Firestore:", error);
      }
    );
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const disciplinesQuery = query(collection(db, "disciplines"), where("userId", "==", currentUser.id));
    const unsubscribe = onSnapshot(
      disciplinesQuery,
      (snapshot) => {
        const firebaseDisciplines = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setDisciplines(firebaseDisciplines);
      },
      (error) => {
        console.error("Erro ao carregar disciplinas do Firestore:", error);
      }
    );
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const today = new Date();
    const soon = tasks.filter((t) => {
      if (t.userId !== currentUser.id || t.status === "concluída") return false;
      const diff = (new Date(t.dataEntrega) - today) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 3;
    });
    setNotifications(
      soon.map((t) => ({
        id: t.id,
        mensagem: `"${t.titulo}" vence em ${Math.ceil((new Date(t.dataEntrega) - today) / (1000 * 60 * 60 * 24))} dia(s)!`,
        dataEnvio: new Date().toISOString(),
      }))
    );
  }, [tasks, currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem("sistema_users", JSON.stringify(users));
    } catch {}
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem("sistema_disciplines", JSON.stringify(disciplines));
    } catch {}
  }, [disciplines]);

  useEffect(() => {
    try {
      localStorage.setItem("sistema_tasks", JSON.stringify(tasks));
    } catch {}
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem("sistema_registrations", JSON.stringify(registrations));
    } catch {}
  }, [registrations]);

  useEffect(() => {
    try {
      localStorage.setItem("sistema_currentUser", JSON.stringify(currentUser));
    } catch {}
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem("sistema_page", page);
    } catch {}
  }, [page]);

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
        const userData = userDoc.docs[0].data();
        if (userData?.isActive === false) {
          await signOut(auth);
          showToast("Esta conta foi removida pelo administrador.", "danger");
          return false;
        }
        setCurrentUser({ ...userData, id: userDoc.docs[0].id });
        setPage("dashboard");
        return true;
      }
      const userData = {
        firebaseId: firebaseUser.uid,
        nome: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Usuário",
        email: firebaseUser.email?.toLowerCase(),
        createdAt: new Date().toISOString(),
        isAdmin: false,
        isActive: true,
      };
      const userRef = doc(collection(db, "users"));
      await setDoc(userRef, userData);
      setCurrentUser({ ...userData, id: userRef.id });
      setPage("dashboard");
      return true;
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
      let firebaseUser;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, e, s);
        firebaseUser = userCredential.user;
      } catch (error) {
        if (error?.code === "auth/email-already-in-use") {
          const userCredential = await signInWithEmailAndPassword(auth, e, s);
          firebaseUser = userCredential.user;
        } else {
          throw error;
        }
      }
      const existingUserDoc = await getDocs(query(collection(db, "users"), where("firebaseId", "==", firebaseUser.uid)));
      let userRef;
      let userData;
      if (!existingUserDoc.empty) {
        userRef = existingUserDoc.docs[0].ref;
        userData = {
          ...existingUserDoc.docs[0].data(),
          nome: n,
          email: e,
          isActive: true,
        };
        await setDoc(userRef, userData, { merge: true });
      } else {
        userData = {
          firebaseId: firebaseUser.uid,
          nome: n,
          email: e,
          createdAt: new Date().toISOString(),
          isAdmin: false,
          isActive: true,
        };
        userRef = doc(collection(db, "users"));
        await setDoc(userRef, userData);
      }
      setCurrentUser({ ...userData, id: userRef.id });
      setPage("dashboard");
      setRegistrations((prev) => [
        ...prev,
        {
          id: userRef.id,
          userId: userRef.id,
          nome: n,
          email: e,
          date: new Date().toISOString(),
        },
      ]);
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
      await addDoc(collection(db, "disciplines"), {
        ...data,
        userId: currentUser.id,
        createdAt: new Date().toISOString(),
      });
      showToast("Disciplina cadastrada!");
    } catch (error) {
      console.error("Erro ao salvar disciplina no Firestore:", error);
      showToast("Erro ao cadastrar disciplina.", "danger");
    }
  };

  const updateDiscipline = async (id, data) => {
    try {
      await updateDoc(doc(db, "disciplines", id.toString()), data);
      setDisciplines((prev) => prev.map((d) => (d.id === id ? { ...d, ...data } : d)));
      showToast("Disciplina atualizada!");
    } catch (error) {
      console.error("Erro ao atualizar disciplina no Firestore:", error);
      showToast("Erro ao atualizar disciplina.", "danger");
    }
  };

  const deleteDiscipline = async (id) => {
    try {
      await deleteDoc(doc(db, "disciplines", id.toString()));
      setDisciplines((prev) => prev.filter((d) => d.id !== id));
      setTasks((prev) => prev.filter((t) => t.disciplinaId !== id));
      showToast("Disciplina excluída!", "danger");
    } catch (error) {
      console.error("Erro ao excluir disciplina no Firestore:", error);
      showToast("Erro ao excluir disciplina.", "danger");
    }
  };

  const addTask = async (data) => {
    try {
      await addDoc(collection(db, "tasks"), {
        ...data,
        status: "pendente",
        userId: currentUser.id,
        createdAt: new Date().toISOString(),
      });
      showToast("Tarefa cadastrada!");
    } catch (error) {
      console.error("Erro ao salvar tarefa no Firestore:", error);
      showToast("Erro ao cadastrar tarefa.", "danger");
    }
  };

  const updateTask = async (id, data) => {
    try {
      await updateDoc(doc(db, "tasks", id.toString()), data);
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
      showToast("Tarefa atualizada!");
    } catch (error) {
      console.error("Erro ao atualizar tarefa no Firestore:", error);
      showToast("Erro ao atualizar tarefa.", "danger");
    }
  };

  const deleteTask = async (id) => {
    try {
      await deleteDoc(doc(db, "tasks", id.toString()));
      setTasks((prev) => prev.filter((t) => t.id !== id));
      showToast("Tarefa excluída!", "danger");
    } catch (error) {
      console.error("Erro ao excluir tarefa no Firestore:", error);
      showToast("Erro ao excluir tarefa.", "danger");
    }
  };

  const toggleTask = async (id) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const nextStatus = task.status === "concluída" ? "pendente" : "concluída";
    try {
      await updateDoc(doc(db, "tasks", id.toString()), { status: nextStatus });
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: nextStatus } : t)));
    } catch (error) {
      console.error("Erro ao alternar status da tarefa no Firestore:", error);
      showToast("Erro ao atualizar tarefa.", "danger");
    }
  };

  const updateUserName = async (newName) => {
    if (!currentUser?.id) return false;
    try {
      const trimmedName = newName?.trim();
      if (!trimmedName) {
        showToast("O nome não pode ficar vazio.", "danger");
        return false;
      }
      await updateDoc(doc(db, "users", currentUser.id.toString()), { nome: trimmedName });
      setCurrentUser((prev) => (prev ? { ...prev, nome: trimmedName } : prev));
      setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? { ...u, nome: trimmedName } : u)));
      showToast("Nome atualizado!");
      return true;
    } catch (error) {
      console.error("Erro ao atualizar nome do usuário:", error);
      showToast("Erro ao atualizar nome.", "danger");
      return false;
    }
  };

  const resolveUserDoc = async (userId) => {
    const identifier = String(userId ?? "");
    if (!identifier) return null;
    const directRef = doc(db, "users", identifier);
    const directSnap = await getDoc(directRef);
    if (directSnap.exists()) {
      return { ref: directRef, doc: directSnap };
    }
    const querySnapshot = await getDocs(query(collection(db, "users"), where("firebaseId", "==", identifier)));
    if (!querySnapshot.empty) {
      return { ref: querySnapshot.docs[0].ref, doc: querySnapshot.docs[0] };
    }
    return null;
  };

  const grantAdmin = async (userId) => {
    try {
      const resolved = await resolveUserDoc(userId);
      if (!resolved) throw new Error("Usuário não encontrado");
      await updateDoc(resolved.ref, { isAdmin: true });
      setUsers((prev) => prev.map((u) => (String(u.id) === String(resolved.doc.id) ? { ...u, isAdmin: true } : u)));
      showToast("Permissão de administrador concedida!");
    } catch (error) {
      console.error("Erro ao conceder admin:", error);
      showToast("Erro ao conceder permissão de admin.", "danger");
    }
  };

  const revokeAdmin = async (userId) => {
    try {
      const resolved = await resolveUserDoc(userId);
      if (!resolved) throw new Error("Usuário não encontrado");
      await updateDoc(resolved.ref, { isAdmin: false });
      setUsers((prev) => prev.map((u) => (String(u.id) === String(resolved.doc.id) ? { ...u, isAdmin: false } : u)));
      showToast("Permissão de administrador removida!");
    } catch (error) {
      console.error("Erro ao revogar admin:", error);
      showToast("Erro ao revogar permissão de admin.", "danger");
    }
  };

  const deleteUserFromDatabase = async (userId) => {
    if (!userId) return false;
    if (String(userId) === String(currentUser?.id)) {
      showToast("Você não pode remover sua própria conta.", "danger");
      return false;
    }
    try {
      const resolved = await resolveUserDoc(userId);
      if (!resolved) {
        showToast("Usuário não encontrado no banco de dados.", "danger");
        return false;
      }
      const resolvedUserId = resolved.doc.id;
      await updateDoc(resolved.ref, { isActive: false });
      setUsers((prev) => prev.map((u) => (String(u.id) === String(resolvedUserId) ? { ...u, isActive: false } : u)));
      setRegistrations((prev) => prev.filter((r) => String(r.userId) !== String(resolvedUserId) && String(r.id) !== String(resolvedUserId)));
      showToast("Usuário removido do sistema.", "danger");
      return true;
    } catch (error) {
      console.error("Erro ao remover usuário:", error);
      showToast("Erro ao remover usuário.", "danger");
      return false;
    }
  };

  const userDisciplines = disciplines.filter((d) => currentUser && d.userId === currentUser.id);
  const userTasks = tasks.filter((t) => currentUser && t.userId === currentUser.id);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        page,
        setPage,
        login,
        register,
        logout,
        disciplines: userDisciplines,
        addDiscipline,
        updateDiscipline,
        deleteDiscipline,
        tasks: userTasks,
        addTask,
        updateTask,
        deleteTask,
        toggleTask,
        notifications,
        toast,
        showToast,
        users,
        registrations,
        updateUserName,
        grantAdmin,
        revokeAdmin,
        deleteUserFromDatabase,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export default AppProvider;
