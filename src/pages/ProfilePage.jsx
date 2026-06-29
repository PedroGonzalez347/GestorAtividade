import { useState, useEffect } from "react";
import { useApp } from "../context/AppProvider";
import { Btn, Input, PageHeader } from "../components/SharedComponents";
import { normalizeDisciplineId } from "../constants";

export default function ProfilePage () {
  const { currentUser, tasks, disciplines, showToast, updateUserName, grantAdmin, revokeAdmin } = useApp();
  const [editing, setEditing] = useState(false);
  const [nome, setNome] = useState(currentUser?.nome || "");

  useEffect(() => {
    setNome(currentUser?.nome || "");
  }, [currentUser?.nome]);

  const pending = tasks.filter((t) => t.status === "pendente").length;
  const inProgress = tasks.filter((t) => t.status === "em andamento").length;
  const done = tasks.filter((t) => t.status === "concluída").length;
  const overdue = tasks.filter((t) => t.status !== "concluída" && new Date(t.dataEntrega) < new Date()).length;

  const save = async () => {
    const ok = await updateUserName(nome);
    if (ok) setEditing(false);
  };

  const requestAdminAccess = async () => {
    const typedPassword = window.prompt("Digite a senha para se tornar admin:");
    if (typedPassword === "aura67") {
      await grantAdmin(currentUser.id);
    } else {
      showToast("Senha incorreta.", "danger");
    }
  };

  const initials = currentUser?.nome?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div>
      <PageHeader title="Perfil" subtitle="Seus dados e estatísticas acadêmicas." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl font-bold mb-4">{initials}</div>
          {editing ? (
            <div className="w-full">
              <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
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
                {currentUser && !currentUser.isAdmin && <Btn onClick={requestAdminAccess}>Tornar-me admin</Btn>}
                {currentUser && currentUser.isAdmin && <Btn variant="secondary" onClick={() => revokeAdmin(currentUser.id)}>Revogar admin</Btn>}
              </div>
            </>
          )}
        </div>

        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {[
            { label: "Disciplinas", value: disciplines.length, icon: "📚" },
            { label: "Tarefas pendentes", value: pending, icon: "⏳" },
            { label: "Em andamento", value: inProgress, icon: "🔄" },
            { label: "Concluídas", value: done, icon: "✅" },
            { label: "Atrasadas", value: overdue, icon: "⚠️" },
            { label: "Total de tarefas", value: tasks.length, icon: "📋" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="text-2xl mb-2">{s.icon}</div>
              <p className="text-2xl font-bold text-gray-800">{s.value}</p>
              <p className="text-sm text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {disciplines.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mt-6">
          <h3 className="font-semibold text-gray-800 mb-4">Progresso por disciplina</h3>
          <div className="space-y-4">
            {disciplines.map((d) => {
              const total = tasks.filter((t) => normalizeDisciplineId(t.disciplinaId) === normalizeDisciplineId(d.id)).length;
              const doneCount = tasks.filter((t) => normalizeDisciplineId(t.disciplinaId) === normalizeDisciplineId(d.id) && t.status === "concluída").length;
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
