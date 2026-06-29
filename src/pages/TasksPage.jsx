import { useState } from "react";
import { useApp } from "../context/AppProvider";
import { Btn, Modal, PageHeader, PriorityBadge, StatusBadge } from "../components/SharedComponents";
import { normalizeDisciplineId, PRIORITY_COLORS } from "../constants";

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
    onSave({ titulo, descricao, dataEntrega, prioridade, status, disciplinaId: normalizeDisciplineId(disciplinaId) });
    onClose();
  };

  return (
    <form onSubmit={submit}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder:text-gray-400 bg-gray-50" placeholder="Nome da tarefa" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
        <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder:text-gray-400 bg-gray-50 resize-none" rows={3} placeholder="Detalhes da atividade..." value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Disciplina</label>
        <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50" value={disciplinaId} onChange={(e) => setDisciplinaId(e.target.value)}>
          {disciplines.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
          <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50" value={prioridade} onChange={(e) => setPrioridade(e.target.value)}>
            <option value="alta">Alta</option>
            <option value="média">Média</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="pendente">Pendente</option>
            <option value="em andamento">Em andamento</option>
            <option value="concluída">Concluída</option>
          </select>
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Data de entrega</label>
        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-gray-50" type="date" value={dataEntrega} onChange={(e) => setDataEntrega(e.target.value)} required />
      </div>
      <div className="flex gap-2 justify-end mt-2">
        <Btn type="button" variant="secondary" onClick={onClose}>Cancelar</Btn>
        <Btn type="submit">{initial ? "Salvar alterações" : "Cadastrar"}</Btn>
      </div>
    </form>
  );
}

export default function TasksPage() {
  const { tasks, disciplines, addTask, updateTask, deleteTask, toggleTask } = useApp();
  const [modal, setModal] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("todas");
  const [filterStatus, setFilterStatus] = useState("todas");
  const [filterDisc, setFilterDisc] = useState("todas");

  const getDisciplineName = (id) => disciplines.find((d) => normalizeDisciplineId(d.id) === normalizeDisciplineId(id))?.nome || "—";

  const filtered = tasks
    .filter((t) => {
      const matchSearch = t.titulo.toLowerCase().includes(search.toLowerCase()) || t.descricao.toLowerCase().includes(search.toLowerCase());
      const matchP = filterPriority === "todas" || t.prioridade === filterPriority;
      const matchS = filterStatus === "todas" || t.status === filterStatus;
      const matchD = filterDisc === "todas" || normalizeDisciplineId(t.disciplinaId) === normalizeDisciplineId(filterDisc);
      return matchSearch && matchP && matchS && matchD;
    })
    .sort((a, b) => {
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
      <PageHeader title="Tarefas" subtitle="Gerencie todas as suas atividades acadêmicas." action={<Btn onClick={() => setModal("add")} disabled={disciplines.length === 0}>+ Nova tarefa</Btn>} />

      {disciplines.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-sm mb-6">
          ⚠️ Cadastre ao menos uma disciplina antes de criar tarefas.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px]">
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50 placeholder:text-gray-400"
            placeholder="🔍  Buscar tarefas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700" value={filterDisc} onChange={(e) => setFilterDisc(e.target.value)}>
          <option value="todas">Todas as disciplinas</option>
          {disciplines.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
        </select>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
          <option value="todas">Todas as prioridades</option>
          <option value="alta">Alta</option>
          <option value="média">Média</option>
          <option value="baixa">Baixa</option>
        </select>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="todas">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="em andamento">Em andamento</option>
          <option value="concluída">Concluída</option>
        </select>
        {(search || filterPriority !== "todas" || filterStatus !== "todas" || filterDisc !== "todas") && (
          <button onClick={() => { setSearch(""); setFilterPriority("todas"); setFilterStatus("todas"); setFilterDisc("todas"); }} className="text-xs text-gray-400 hover:text-gray-600 underline">Limpar filtros</button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">🔍</div>
          <p className="font-medium">{tasks.length === 0 ? "Nenhuma tarefa cadastrada." : "Nenhuma tarefa encontrada."}</p>
          {tasks.length === 0 && <Btn className="mt-4" onClick={() => setModal("add")}>+ Adicionar tarefa</Btn>}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => {
            const c = PRIORITY_COLORS[t.prioridade] || PRIORITY_COLORS.baixa;
            const dl = getDaysLeft(t.dataEntrega);
            const isDone = t.status === "concluída";
            return (
              <div key={t.id} className={`bg-white rounded-2xl border transition-all ${isDone ? "border-green-100 opacity-70" : "border-gray-100 hover:shadow-sm"}`}>
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="w-1.5 h-12 rounded-full flex-shrink-0" style={{ background: c.dot }} />
                  <button onClick={() => toggleTask(t.id)} className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${isDone ? "bg-green-500 border-green-500 text-white" : "border-gray-300 hover:border-indigo-400"}`}>
                    {isDone && <span className="text-xs">✓</span>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${isDone ? "line-through text-gray-400" : "text-gray-800"}`}>{t.titulo}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      <span className="text-xs text-gray-400">{getDisciplineName(t.disciplinaId)}</span>
                      {t.descricao && <span className="text-gray-200 text-xs">·</span>}
                      {t.descricao && <span className="text-xs text-gray-400 truncate max-w-[200px]">{t.descricao}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="hidden sm:flex flex-col items-end gap-1">
                      <PriorityBadge prioridade={t.prioridade} />
                      <StatusBadge status={t.status} />
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-medium ${dl.cls}`}>{dl.label}</p>
                      <p className="text-xs text-gray-400">{new Date(t.dataEntrega + "T00:00").toLocaleDateString("pt-BR")}</p>
                    </div>
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

      {filtered.length > 0 && (
        <p className="text-xs text-gray-400 mt-4 text-center">Mostrando {filtered.length} de {tasks.length} tarefa{tasks.length !== 1 ? "s" : ""}</p>
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
