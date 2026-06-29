import { useApp } from "../context/AppProvider";
import { PageHeader } from "../components/SharedComponents";
import { PRIORITY_COLORS, normalizeDisciplineId } from "../constants";

export default function DashboardPage() {
  const { tasks, disciplines, currentUser, setPage } = useApp();
  const pending = tasks.filter((t) => t.status !== "concluída");
  const done = tasks.filter((t) => t.status === "concluída");
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

  const getDisciplineName = (id) => disciplines.find((d) => normalizeDisciplineId(d.id) === normalizeDisciplineId(id))?.nome || "—";

  const byDiscipline = disciplines
    .map((d) => ({
      ...d,
      total: tasks.filter((t) => normalizeDisciplineId(t.disciplinaId) === normalizeDisciplineId(d.id)).length,
      done: tasks.filter(
        (t) => normalizeDisciplineId(t.disciplinaId) === normalizeDisciplineId(d.id) && t.status === "concluída"
      ).length,
    }))
    .filter((d) => d.total > 0);

  return (
    <div>
      <PageHeader title={`Olá, ${currentUser?.nome?.split(" ")[0]} 👋`} subtitle="Aqui está um resumo das suas atividades acadêmicas." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Pendentes", value: pending.length, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Concluídas", value: done.length, color: "text-green-600", bg: "bg-green-50" },
          { label: "Disciplinas", value: disciplines.length, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Total de tarefas", value: tasks.length, color: "text-gray-700", bg: "bg-gray-50" },
        ].map((m) => (
          <div key={m.label} className={`${m.bg} rounded-2xl p-5`}>
            <p className="text-xs text-gray-500 font-medium mb-1">{m.label}</p>
            <p className={`text-3xl font-bold ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              {byDiscipline.map((d) => {
                const pct = d.total ? Math.round((d.done / d.total) * 100) : 0;
                return (
                  <div key={d.id}>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{d.nome}</span>
                      <span>{d.done}/{d.total}</span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-1.5">
                      <div className="bg-indigo-400 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

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
              {upcoming.map((t) => {
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
