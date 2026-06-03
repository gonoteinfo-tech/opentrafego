# Guia de Instalação do Open Tráfego na Hostinger

Este guia orienta o processo de deploy da aplicação Open Tráfego (Next.js + Supabase) no ambiente da Hostinger. Você pode instalar tanto em **Hospedagem Compartilhada (com suporte a Node.js)** quanto em uma **VPS**.

---

## OPÇÃO 1: Hospedagem Compartilhada (hPanel / Node.js Selector)

Se o seu plano de hospedagem compartilhada da Hostinger possui suporte para aplicações Node.js no hPanel:

### 1. Criar o Aplicativo Node.js no hPanel
1. Acesse o **hPanel** da Hostinger.
2. Vá para **Websites** -> **Gerenciar** -> procure por **Aplicativo Node.js** (ou **Node.js Web App**).
3. Clique em **Criar Aplicativo**.
4. Configure os seguintes campos:
   - **Diretório do Aplicativo (App Directory)**: Ex: `public_html/opentrafego` ou apenas `opentrafego`.
   - **URL do Aplicativo (App URL)**: Selecione o seu domínio ou subdomínio (ex: `https://meudominio.com.br`).
   - **Arquivo de Inicialização (Application Startup File)**: Defina como `server.js` (incluído na raiz deste projeto).
   - **Versão do Node.js**: Selecione **20.x** ou superior.
5. Salve a configuração para criar o aplicativo.

### 2. Upload do Arquivo ZIP
1. Faça o upload do arquivo `opentrafego.zip` para a pasta que você definiu no hPanel (ex: `public_html/opentrafego`) usando o **Gerenciador de Arquivos** da Hostinger ou um cliente FTP (FileZilla).
2. Extraia o conteúdo do ZIP diretamente nessa pasta. Certifique-se de que os arquivos (como `package.json`, `server.js` e a pasta `src`) estejam na raiz da pasta do aplicativo.

### 3. Configurar as Variáveis de Ambiente
1. Crie ou edite o arquivo `.env.production` ou `.env.local` na raiz do projeto:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://kqtsmedwxmymlditsbfp.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdHNtZWR3eG15bWxkaXRzYmZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NzY1OTcsImV4cCI6MjA5NTQ1MjU5N30.pOGpaQFHlPK_JFFLCw1qLAWfdpyWDpdd2TfvuLiysVw
   CRON_SECRET=opentrafego-cron-secret-2026
   NEXT_PUBLIC_SITE_URL=https://seudominio.com.br
   NEXT_PUBLIC_SITE_NAME=Open Tráfego
   ```
   *(Substitua `NEXT_PUBLIC_SITE_URL` pela URL real do seu domínio configurado).*
2. No painel do **Aplicativo Node.js** da Hostinger, você também pode adicionar essas chaves de ambiente na seção **Environment Variables** (Variáveis de Ambiente) para garantir o carregamento em runtime.

### 4. Instalar Dependências e Fazer Build
1. No painel do **Aplicativo Node.js** do hPanel, localize o botão do terminal virtual ou de execução de scripts npm.
2. Em **Instalar Pacotes** (npm install), clique para rodar.
3. Se o painel permitir adicionar scripts customizados ou comandos, configure:
   - **Comando de Build**: `npm run build`
   - **Comando de Start**: `node server.js` (ou use o arquivo de inicialização `server.js` mapeado pelo painel).
4. Rode a build clicando em **Run Build** ou rodando pelo terminal ssh da hospedagem se disponível.
5. Inicie ou reinicie o aplicativo no hPanel.

---

## OPÇÃO 2: Hospedagem VPS (Servidor Virtual Privado)

Caso você esteja utilizando uma VPS KVM Node.js da Hostinger:

### 1. Upload e Extração do ZIP
1. Faça o upload de `opentrafego.zip` para `/var/www/opentrafego` na sua VPS via SFTP.
2. Acesse a VPS por SSH, navegue até a pasta e extraia o arquivo:
   ```bash
   unzip opentrafego.zip -d /var/www/opentrafego
   cd /var/www/opentrafego
   ```

### 2. Configurar as Variáveis de Ambiente
Crie o arquivo `.env.local` na raiz com suas chaves de produção (conforme exemplo da Opção 1).

### 3. Instalar Dependências e Compilar
Execute:
```bash
npm install
npm run build
```

### 4. Iniciar com PM2 (Modo de Produção)
Para manter o servidor ativo continuamente:
```bash
pm2 start npm --name "opentrafego" -- start
pm2 save
pm2 startup
```

### 5. Configurar o Nginx como Proxy Reverso
Aponte o tráfego HTTP/HTTPS do seu domínio para a porta `3000` interna do Next.js.

---

## Execução Automática do Cron de Tráfego
O sistema possui disparos automáticos integrados via `src/instrumentation.ts` e `node-cron`. 

Em **Hospedagem Compartilhada**, se o processo Node.js for colocado para dormir pelo servidor (inatividade), a melhor forma de garantir os disparos de tráfego minuto a minuto é configurar uma tarefa Cron externa:
1. No **hPanel** da Hostinger, vá para **Avançado** -> **Tarefas Cron (Cron Jobs)**.
2. Crie uma nova tarefa configurada para rodar **a cada minuto** (`* * * * *`).
3. Defina o comando para disparar o endpoint com a sua chave secreta:
   ```bash
   curl -s "https://seudominio.com.br/api/traffic?secret=opentrafego-cron-secret-2026" > /dev/null 2>&1
   ```
