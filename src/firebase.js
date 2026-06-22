import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// ═══════════════════════════════════════════════════════════════════════════
// INSTRUÇÕES PARA PREENCHER AS CREDENCIAIS:
// ═══════════════════════════════════════════════════════════════════════════
// 1. Acesse https://console.firebase.google.com/
// 2. Selecione o projeto "GestaoAtividade"
// 3. Vá em ⚙️ Configurações do projeto > Geral
// 4. Procure por "Seus aplicativos" > Web
// 5. Copie os valores abaixo:
//    - apiKey: campo "apiKey"
//    - messagingSenderId: campo "messagingSenderId"
//    - appId: campo "appId"
// ═══════════════════════════════════════════════════════════════════════════

const firebaseConfig = {
  apiKey: "AIzaSyAyaIV82ya1Ts45N000IyeOFKFDn_O8MrQ",
  authDomain: "gestaoatividade-8c815.firebaseapp.com",
  projectId: "gestaoatividade-8c815",
  storageBucket: "gestaoatividade-8c815.firebasestorage.app",
  messagingSenderId: "908662574751",
  appId: "1:908662574751:web:675527ce6f5ab903161caa"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);