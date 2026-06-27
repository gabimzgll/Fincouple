# FinCouple — Setup

## 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Clique em **New Project**
3. Escolha um nome (ex: `fincouple`) e uma senha forte
4. Aguarde o projeto ser criado (~1 min)

## 2. Criar as tabelas

No menu lateral do Supabase, vá em **SQL Editor** → **New query** e cole o SQL abaixo:

```sql
create table transactions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  mes int not null,
  ano int not null,
  tipo text not null,
  pessoa text not null,
  descricao text not null,
  valor_total numeric not null,
  forma_pagamento text not null,
  categoria text,
  parcelas int,
  mes_inicio int,
  ano_inicio int,
  para_pessoa text
);

create table acertos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  mes int not null,
  ano int not null,
  valor numeric not null,
  quem_pagou text not null,
  descricao text default 'Acerto de contas'
);

-- Habilitar acesso público (sem autenticação)
alter table transactions enable row level security;
alter table acertos enable row level security;

create policy "Public read" on transactions for select using (true);
create policy "Public insert" on transactions for insert with check (true);
create policy "Public delete" on transactions for delete using (true);
create policy "Public update" on transactions for update using (true);

create policy "Public read" on acertos for select using (true);
create policy "Public insert" on acertos for insert with check (true);
create policy "Public delete" on acertos for delete using (true);
```

Clique em **Run**.

## 3. Obter as credenciais

No menu do Supabase: **Settings → API**

Copie:
- **Project URL** → vai ser o `NEXT_PUBLIC_SUPABASE_URL`
- **anon / public key** → vai ser o `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 4. Configurar as variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## 5. Rodar localmente

```bash
npm install
npm run dev
```

Acesse: http://localhost:3000

## 6. Deploy no Vercel

1. Acesse [vercel.com](https://vercel.com) e entre com a conta do GitHub
2. Clique em **Add New Project**
3. Selecione o repositório `fincouple`
4. Em **Environment Variables**, adicione as duas variáveis do passo 4
5. Clique em **Deploy**

Pronto! O app estará disponível em uma URL pública que você pode compartilhar com o Rafa.
