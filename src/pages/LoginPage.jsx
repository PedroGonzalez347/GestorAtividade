import { useState } from "react";
import { useApp } from "../context/AppProvider";
import { Btn, Input } from "../components/SharedComponents";

export default function LoginPage() {
  const { login, setPage } = useApp();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const success = await login(email.trim(), senha.trim());
    if (!success) setError("Email ou senha incorretos.");
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
            <Input label="Email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="Senha" type="password" placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} required />
            {error && <p className="text-red-500 text-sm mb-4 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <Btn type="submit" className="w-full justify-center py-2.5">Entrar</Btn>
          </form>
          <p className="text-center text-sm text-gray-500 mt-5">
            Não tem conta?{' '}
            <button onClick={() => setPage("register")} className="text-indigo-600 hover:underline font-medium">Cadastrar-se</button>
          </p>
          <p className="text-center text-xs text-gray-400 mt-4">Demo: ana@email.com / 123456</p>
        </div>
      </div>
    </div>
  );
}
