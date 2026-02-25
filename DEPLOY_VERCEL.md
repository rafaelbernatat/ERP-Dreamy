# 🚀 Guia de Deploy na Vercel

## ✅ Mudanças Realizadas para Compatibilidade com Vercel

### 1. **Criado `vercel.json`**
   - Configura o build command como `npm run build`
   - Define output directory como `dist`
   - Especifica framework como Vite
   - Mapeia variáveis de ambiente

### 2. **Atualizado `package.json`**
   - Removido `server.ts` do script `dev` → agora usa `vite` diretamente
   - Removido dependências incompatíveis com serverless:
     - ❌ `express`
     - ❌ `better-sqlite3`
     - ❌ `@types/express`
     - ❌ `tsx`

### 3. **Criado `.env.local`**
   - Template com todas as variáveis necessárias
   - Precisa ser atualizado com valores reais (não commitar!)

### 4. **Mantido `server.ts`**
   - Arquivo pode ser deletado se não for usado
   - Apenas para desenvolvimento local se necessário

---

## 📋 Checklist de Deploy

- [ ] **1. Push das mudanças para repositório**
  ```bash
  git add .
  git commit -m "chore: prepare for Vercel deployment"
  git push
  ```

- [ ] **2. Conectar repositório na Vercel**
  - Acesse: https://vercel.com/new
  - Selecione seu repositório GitHub
  - Vercel detectará automáticamente: `Vite + React`

- [ ] **3. Configurar Variáveis de Ambiente**
  
  No dashboard da Vercel, em **Settings → Environment Variables**, adicione:

  ```
  GEMINI_API_KEY = seu_gemini_api_key
  VITE_FIREBASE_API_KEY = AIzaSyCK29scNP3hyKdcLaKeMnc5yNFO8wfJJIo
  VITE_FIREBASE_AUTH_DOMAIN = erp-dreamy.firebaseapp.com
  VITE_FIREBASE_PROJECT_ID = erp-dreamy
  VITE_FIREBASE_STORAGE_BUCKET = erp-dreamy.firebasestorage.app
  VITE_FIREBASE_MESSAGING_SENDER_ID = 179895241110
  VITE_FIREBASE_APP_ID = 1:179895241110:web:d9a5a118c36a4421c7b5b7
  VITE_FIREBASE_DATABASE_URL = https://erp-dreamy-default-rtdb.firebaseio.com
  VITE_ALLOWED_EMAILS = rafaelbernatat@gmail.com
  ```

- [ ] **4. Deploy Automático**
  - O Vercel fará build automático
  - Acesse o site em `https://seu-projeto.vercel.app`

---

## 🔧 Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Iniciar desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

---

## 🚨 Problemas Comuns

### "Module not found: express"
- ✅ Resolvido: `express` foi removido do package.json

### "better-sqlite3 build failed"
- ✅ Resolvido: Dependência nativa removida (não funciona no Vercel)

### Variáveis de ambiente vazias
- Certifique-se que foram configuradas no Vercel Dashboard
- Não precisam estar no `.env.local`

### Erro ao build
- Verificar logs: `npm run lint`
- Verificar imports: `npm run build`

---

## 📝 Notas Importantes

1. **Segurança**: Nunca commitar `.env.local` ou variáveis sensíveis
2. **Firebase**: Já está configurado como backend
3. **SPA Static**: Projeto é entregue como site estático
4. **Domínios**: Após deploy, adicionar domínio custom no Vercel Settings

---

## 🎯 Próximos Passos (Opcional)

Se precisar de backend customizado no futuro:

1. Criar pasta `/api` para Vercel Functions
2. Usar Node.js serverless functions
3. Exemplos: 
   - Webhooks do Firebase
   - Processamento de dados
   - Autenticação customizada

---

**Deploy pronto! 🎉**
