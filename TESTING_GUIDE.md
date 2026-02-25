# 🧪 Guia de Testes - Novas Features do ERP Dreamy

## Setup Inicial

```bash
# Instale as dependências (se não tiver feito)
npm install

# Inicie o servidor de desenvolvimento
npm run dev

# A aplicação estará disponível em http://localhost:5173
```

---

## ✅ Checklist de Testes

### 1️⃣ Dashboard Melhorado

#### Teste 1.1: Contadores de Projetos
- [ ] Crie um novo projeto com status "won" (ganho)
- [ ] Crie um novo projeto com status "lost" (perdido)  
- [ ] Navegue para Dashboard
- [ ] Verifique se aparecem os cards:
  - [ ] "Projetos Ganhos" mostrando quantidade correta
  - [ ] "Projetos Perdidos" mostrando quantidade correta
  - [ ] "Oportunidades Fechadas" com valor total

#### Teste 1.2: Calendário de Prazos
- [ ] Na section "Calendário de Prazos" do Dashboard
- [ ] Veja os projetos exibidos no calendário
- [ ] Clique nas setas anterior/próximo para navegar entre meses
- [ ] Clique em um projeto no calendário
- [ ] Verifique se abre o modal de detalhes

---

### 2️⃣ Clientes com CPF/CNPJ

#### Teste 2.1: Adicionar CPF/CNPJ
- [ ] Clique em "Novo Cliente"
- [ ] Preencha os campos:
  - [ ] Nome
  - [ ] Email  
  - [ ] Telefone
  - [ ] Empresa
  - [ ] **CPF/CNPJ** (novo campo)
- [ ] Clique em "Salvar"
- [ ] Na aba Clientes, verifique se o CPF/CNPJ apareça no card

#### Teste 2.2: Botões de Contato
- [ ] No card do cliente, clique em:
  - [ ] **Email**: Deve abrir o cliente de email padrão
  - [ ] **WhatsApp**: Deve tentar abrir WhatsApp com o telefone

---

### 3️⃣ CRM Kanban Aprimorado

#### Teste 3.1: Botões de Contato nos Cards
- [ ] Na seção "CRM Kanban", em qualquer card de oportunidade
- [ ] Verifique se existem 2 novos botões na parte inferior:
  - [ ] 📧 (Email)
  - [ ] 💬 (WhatsApp)
- [ ] Clique no botão de Email e verifique se abre cliente de email
- [ ] Clique no botão de WhatsApp e verifique se abre WhatsApp

#### Teste 3.2: Modal de Detalhes da Oportunidade  
- [ ] No card de uma oportunidade, clique no ícone **"..."** (MoreVertical)
- [ ] Deve abrir um modal com:
  - [ ] Informações do cliente
  - [ ] Valor da oportunidade
  - [ ] Status da oportunidade
  - [ ] Descrição
  - [ ] **Histórico de Contato** (seção com histórico)
  - [ ] Botão "Adicionar" para novo contato
  - [ ] Botões de Email e WhatsApp

#### Teste 3.3: Histórico de Contato
- [ ] No modal de detalhes da oportunidade
- [ ] Clique em "Adicionar" no Histórico de Contato
- [ ] Um novo contato deve aparecer com:
  - [ ] Data atual
  - [ ] Tipo: "email" (padrão)
  - [ ] Notas: "Novo contato" (padrão)
- [ ] Você pode adicionar vários contatos
- [ ] Cada contato deve exibir:
  - [ ] Ícone do tipo (email, telefone, whatsapp, visita, etc)
  - [ ] Data do contato
  - [ ] Notas

---

### 4️⃣ Projetos com Datas e Kanban

#### Teste 4.1: Adicionar Data de Início
- [ ] Clique em "Novo Projeto"
- [ ] Verifique se existem 2 campos de data:
  - [ ] **Data Início** (novo)
  - [ ] **Data Término**
- [ ] Preencha ambas as datas
- [ ] Verifique os novos status:
  - [ ] "Ativo"
  - [ ] "Concluído"
  - [ ] "Em espera"
  - [ ] **"Ganho"** (novo)
  - [ ] **"Perdido"** (novo)
- [ ] Selecione status "Ganho" ou "Perdido"
- [ ] Salve o projeto

#### Teste 4.2: Modal de Detalhes do Projeto
- [ ] Na seção "Projetos", clique em "Detalhes" 
- [ ] Deve abrir um modal com:
  - [ ] Informações do projeto (Cliente, Orçamento, Datas)
  - [ ] **Kanban de Tarefas** com 4 colunas:
    - [ ] Backlog
    - [ ] Em Andamento
    - [ ] Concluídas  
    - [ ] Em Revisão
  - [ ] Contadores de tarefas por coluna
  - [ ] Botão "Fechar" e "Editar"

#### Teste 4.3: Tarefas por Coluna
- [ ] No modal de detalhes
- [ ] Verifique se as tarefas aparecem na coluna correta
- [ ] Cada tarefa deve exibir:
  - [ ] Título da tarefa (se houver)
  - [ ] Atribuição (se houver)
  - [ ] Prioridade com cor:
    - [ ] Verde: Baixa
    - [ ] Laranja: Média  
    - [ ] Vermelho: Alta

---

### 5️⃣ Integração Geral

#### Teste 5.1: Fluxo Completo
- [ ] Crie um cliente com nome, email, telefone e CPF
- [ ] Crie uma oportunidade vinculada ao cliente
- [ ] Abra detalhes da oportunidade
- [ ] Adicione alguns contatos no histórico  
- [ ] Teste os botões de email e WhatsApp
- [ ] Feche e edite a oportunidade
- [ ] Crie um projeto vinculado ao cliente com datas
- [ ] Abra detalhes do projeto
- [ ] Verifique as datas aparecendo corretamente

#### Teste 5.2: Dashboard Completo
- [ ] Navegue para o Dashboard
- [ ] Verifique se todos os dados novo estão visíveis:
  - [ ] Contadores de projetos (ganhos/perdidos)
  - [ ] Calendário com projetos
  - [ ] Próximas entregas

---

## 🐛 Possíveis Problemas e Soluções

### Problema: Modais não abrem
**Solução**: Limpe o cache do navegador (Ctrl+Shift+Delete) e recarregue

### Problema: Botões de email/WhatsApp não funcionam
**Solução**: Verifique se o email e telefone foram preenchidos corretamente no formulário

### Problema: Tarefas não aparecem no kanban
**Solução**: As tarefas são carregadas desde o Firebase. Se estiver vazio, adicione tarefas primeiro

### Problema: Calendário não mostra dias corretos
**Solução**: Verifique se os projetos têm data de término preenchida

---

## 📝 Notas de Teste

- Todas as mudanças são salvas no Firebase em tempo real
- Os dados persistem após recarregar a página
- Os modais podem ser fechados clicando fora ou no botão fechar
- As animações funcionam em dispositivos modernos

---

## ✨ Resultado Esperado

Após completar todos os testes:
- ✅ Dashboard mostra novas métricas
- ✅ Clientes têm CPF/CNPJ
- ✅ Oportunidades mostram contato direto  
- ✅ Histórico de contato funciona
- ✅ Projetos têm datas completas
- ✅ Modal de detalhes do projeto funciona
- ✅ Tudo persiste no Firebase

---

**Status**: Pronto para testar! 🚀
