import { useApp } from "../context/AppProvider";
import { Btn, PageHeader } from "../components/SharedComponents";

export default function AdminPanel() {
  const { users, registrations, currentUser, grantAdmin, revokeAdmin, deleteUserFromDatabase } = useApp();
  const activeUsers = users.filter((u) => u.isActive !== false);

  return (
    <div>
      <PageHeader title="Admin" subtitle="Registros de cadastros e contas." />

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Contas</h3>
          <div className="space-y-2">
            {activeUsers.map((u) => (
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
                  {String(u.id) !== String(currentUser?.id) && (
                    <Btn variant="danger" onClick={() => deleteUserFromDatabase(u.id)}>Remover usuário</Btn>
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
              registrations.map((r) => (
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
