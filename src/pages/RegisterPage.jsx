import { useState } from "react";
import { useApp } from "../context/AppProvider";
import { Btn, Input } from "../components/SharedComponents";

export default function RegisterPage() {
  const { register, setPage } = useApp();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const success = await register(nome.trim(), email.trim(), senha.trim());
    if (!success) setError("Este email já está cadastrado.");
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
            <Input label="Nome completo" placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
            <Input label="Email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="Senha" type="password" placeholder="Mínimo 6 caracteres" value={senha} onChange={(e) => setSenha(e.target.value)} minLength={6} required />
            {error && <p className="text-red-500 text-sm mb-4 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <Btn type="submit" className="w-full justify-center py-2.5">Criar conta</Btn>
          </form>
          <p className="text-center text-sm text-gray-500 mt-5">
            Já tem conta?{' '}
            <button onClick={() => setPage("login")} className="text-indigo-600 hover:underline font-medium">Entrar</button>
          </p>
        </div>
      </div>
    </div>
  );
}
