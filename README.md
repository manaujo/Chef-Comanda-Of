# ChefComanda

Sistema completo de gestão para restaurantes, bares e lanchonetes. Controle total do seu negócio em uma única plataforma.

## 🚀 Funcionalidades

- ✅ **Autenticação com Supabase** - Login e registro seguros
- ✅ **Dashboard Responsivo** - Interface moderna e intuitiva
- ✅ **Gestão de Restaurantes** - Cadastro completo de estabelecimentos
- 🔄 **Mesas e Comandas** - Em desenvolvimento
- 🔄 **Controle de Produtos** - Em desenvolvimento
- 🔄 **Relatórios** - Em desenvolvimento
- 🔄 **Estoque** - Em desenvolvimento

## 🛠️ Tecnologias

- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth)
- **Roteamento**: React Router
- **Estado**: React Query

## 📦 Instalação

1. **Clone o repositório**

```bash
git clone https://github.com/manaujo/chefcomanda-pro.git
cd chefcomanda-pro
```

2. **Instale as dependências**

```bash
npm install
```

3. **Configure as variáveis de ambiente**

```bash
cp env.example .env.local
```

Edite o arquivo `.env.local` com suas credenciais do Supabase:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

4. **Configure o Supabase**

### Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Copie a URL e a chave anônima para o arquivo `.env.local`

### Criar tabela de perfis

Execute o seguinte SQL no SQL Editor do Supabase:

```sql
-- Criar tabela de perfis
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nome_completo TEXT NOT NULL,
  nome_restaurante TEXT NOT NULL,
  cpf TEXT NOT NULL,
  telefone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Criar política para usuários verem apenas seus próprios dados
CREATE POLICY "Usuários podem ver seus próprios dados" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Criar política para usuários inserirem seus próprios dados
CREATE POLICY "Usuários podem inserir seus próprios dados" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Criar política para usuários atualizarem seus próprios dados
CREATE POLICY "Usuários podem atualizar seus próprios dados" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

5. **Execute o projeto**

```bash
npm run dev
```

## 🔐 Autenticação

O sistema utiliza Supabase Auth para autenticação segura:

- **Registro**: Email, senha e dados do restaurante
- **Login**: Email e senha
- **Sessão**: Gerenciamento automático de sessão
- **Logout**: Desconexão segura

## 📱 Como usar

1. **Registro**: Acesse `/registro` para criar uma conta
2. **Login**: Acesse `/login` para entrar no sistema
3. **Dashboard**: Após o login, você será redirecionado para `/dashboard`

## 🎨 Personalização

O sistema usa Tailwind CSS com tema personalizado. As cores principais são:

- **Primary**: Vermelho (#dc2626)
- **Secondary**: Âmbar (#f59e0b)
- **Background**: Gradientes suaves

## 📄 Licença

Este projeto está sob a licença MIT.

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## 📞 Suporte

Para suporte, entre em contato através dos canais oficiais do projeto.
