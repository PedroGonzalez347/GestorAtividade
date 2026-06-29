import { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppProvider";
import { Btn, Input, PageHeader } from "../components/SharedComponents";
import { normalizeDisciplineId } from "../constants";

const IMGBB_API_KEY = "73c04c33870ac84d34a3714d530ab064";

export default function ProfilePage() {
  const { currentUser, tasks, disciplines, showToast, updateUserName, updateUserPhoto, grantAdmin, revokeAdmin } = useApp();
  const [editing, setEditing] = useState(false);
  const [nome, setNome] = useState(currentUser?.nome || "");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

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

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      showToast("Formato inválido. Use JPG, PNG, GIF ou WEBP.", "danger");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Imagem muito grande. Máximo 5MB.", "danger");
      return;
    }

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error?.message || "Falha no upload");

      const url = data.data.display_url;
      await updateUserPhoto(url);
    } catch (err) {
      console.error(err);
      showToast("Erro ao fazer upload da foto.", "danger");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const initials = currentUser?.nome?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div>
      <PageHeader title="Perfil" subtitle="Seus dados e estatísticas acadêmicas." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center text-center">

          {/* Avatar com botão de troca de foto */}
          <div className="relative mb-4 group">
            {currentUser?.photoUrl ? (
              <img
                src={currentUser.photoUrl}
                alt="Foto de perfil"
                className="w-20 h-20 rounded-full object-cover border-2 border-indigo-100"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl font-bold">
                {initials}
              </div>
            )}

            {/* Overlay de troca */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute inset-0 w-20 h-20 rounded-full bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-wait"
              title="Trocar foto"
            >
              {uploadingPhoto ? (
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-xs mt-0.5">Foto</span>
                </>
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

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
              <div className="mt-4 flex flex-col items-center gap-2">
                <button onClick={() => setEditing(true)} className="text-sm text-indigo-600 hover:underline">✏️ Editar nome</button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="text-sm text-indigo-600 hover:underline disabled:opacity-50"
                >
                  {uploadingPhoto ? "Enviando foto..." : "📷 Alterar foto"}
                </button>
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
