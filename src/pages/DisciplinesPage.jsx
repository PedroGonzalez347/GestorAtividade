import { useState } from "react";
import { useApp } from "../context/AppProvider";
import { Btn, Modal, PageHeader } from "../components/SharedComponents";
import { normalizeDisciplineId } from "../constants";

function DisciplineForm({ initial, onSave, onClose }) {
  const [nome, setNome] = useState(initial?.nome || "");
  const [descricao, setDescricao] = useState(initial?.descricao || "");

  const submit = (e) => {
    e.preventDefault();
    onSave({ nome, descricao });
    onClose();
  };

  return (
    <form onSubmit={submit}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome da disciplina</label>
        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder:text-gray-400 bg-gray-50" value={nome} onChange={(e) => setNome(e.target.value)} required />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
        <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder:text-gray-400 bg-gray-50 resize-none" rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </div>
      <div className="flex gap-2 justify-end mt-2">
        <Btn type="button" variant="secondary" onClick={onClose}>Cancelar</Btn>
        <Btn type="submit">{initial ? "Salvar alterações" : "Cadastrar"}</Btn>
      </div>
    </form>
  );
}

export default function DisciplinesPage() {
  const { disciplines, tasks, addDiscipline, updateDiscipline, deleteDiscipline } = useApp();
  const [modal, setModal] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const getTaskCount = (id) => tasks.filter((t) => normalizeDisciplineId(t.disciplinaId) === normalizeDisciplineId(id)).length;
  const getDoneCount = (id) => tasks.filter((t) => normalizeDisciplineId(t.disciplinaId) === normalizeDisciplineId(id) && t.status === "concluída").length;

  return (
    <div>
      <PageHeader title="Disciplinas" subtitle="Organize suas matérias do semestre." action={<Btn onClick={() => setModal("add")}>+ Nova disciplina</Btn>} />

      {disciplines.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">📚</div>
          <p className="font-medium">Nenhuma disciplina cadastrada.</p>
          <p className="text-sm mt-1">Comece adicionando uma matéria.</p>
          <Btn className="mt-4" onClick={() => setModal("add")}>+ Adicionar disciplina</Btn>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {disciplines.map((d) => {
            const total = getTaskCount(d.id);
            const done = getDoneCount(d.id);
            const pct = total ? Math.round((done / total) * 100) : 0;
            return (
              <div key={d.id} className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-3 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">{d.nome.charAt(0)}</div>
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
