# Guia de Instalação do Open Tráfego na Hostinger

Este guia orienta o processo de deploy da aplicação Open Tráfego (Next.js + Supabase) no ambiente da Hostinger (VPS Node.js ou VPS com painel hPanel).

---

## Requisitos Prévios

1. **Node.js**: Certifique-se de que a VPS possui o Node.js instalado (versão recomendada: **20.x** ou superior).
2. **PM2**: Gerenciador de processos do Node.js (recomendado para manter o Next.js rodando continuamente).
3. **Projeto Supabase**: Um banco de dados Supabase ativo (com as variáveis de ambiente corretas).

---

## Passo a Passo para Instalação

### 1. Upload do Arquivo ZIP
Faça o upload do arquivo `opentrafego.zip` para a pasta de destino na sua VPS (geralmente sob `/var/www/opentrafego` ou na pasta do usuário) usando SFTP ou o gerenciador de arquivos do painel da Hostinger.

### 2. Extrair os Arquivos
No terminal da VPS (via SSH), extraia o arquivo:
```bash
unzip opentrafego.zip -d opentrafego
cd opentrafego
```

### 3. Configurar as Variáveis de Ambiente
Crie ou edite o arquivo `.env.production` ou `.env.local` na raiz do projeto com as chaves corretas:
```env
NEXT_PUBLIC_SUPABASE_URL=https://kqtsmedwxmymlditsbfp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdHNtZWR3eG15bWxkaXRzYmZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NzY1OTcsImV4cCI6MjA5NTQ1MjU5N30.pOGpaQFHlPK_JFFLCw1qLAWfdpyWDpdd2TfvuLiysVw
CRON_SECRET=opentrafego-cron-secret-2026
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=Open Tráfego
```

*Nota: Substitua `NEXT_PUBLIC_SITE_URL` pela URL do seu domínio final (ex: `https://meusite.com.br`).*

### 4. Instalar Dependências e Compilar
Execute os comandos para instalar os pacotes necessários e fazer a build de produção do Next.js:
```bash
npm install
npm run build
```

### 5. Iniciar com PM2 (Modo de Produção)
Para garantir que a aplicação continue rodando em segundo plano mesmo após desconectar do SSH:
```bash
pm2 start npm --name "opentrafego" -- start
pm2 save
pm2 startup
```

Isso fará o Next.js rodar na porta `3000` (ou na porta especificada por padrão).

---

## Configuração do Proxy Reverso (Nginx)

Se você estiver usando uma VPS limpa, configure o Nginx para redirecionar o tráfego da porta `80/443` (HTTP/HTTPS) para a porta interna `3000` do Next.js.

Exemplo de bloco de servidor Nginx (`/etc/nginx/sites-available/default`):
```nginx
server {
    listen 80;
    server_name seudominio.com.br;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Após editar, teste e reinicie o Nginx:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## Execução Automática do Cron de Tráfego
A engine de tráfego já está configurada para rodar em background a cada minuto de forma autônoma assim que o Next.js é iniciado, graças ao arquivo `src/instrumentation.ts` e à biblioteca `node-cron`.

Se você preferir executar o disparo de forma externa via Cron do sistema (crontab da Hostinger/VPS) para garantir maior confiabilidade, você pode adicionar a seguinte linha no seu crontab (`crontab -e`):
```cron
* * * * * curl -s "http://localhost:3000/api/traffic?secret=opentrafego-cron-secret-2026" > /dev/null 2>&1
```


