# RealMadrink – Squadre di calcetto

Web app per creare due squadre di calcetto in modo casuale, con grafica sportiva e ottimizzata per iPhone.

## Funzionalità

- **Gestione giocatori**: aggiungi i nomi e contrassegna chi fa il portiere (🧤).
- **Crea partita**: seleziona i presenti, imposta la data, genera le squadre (un portiere per squadra) con un loader a pallone che gira, poi salva sul database.
- **Storico partite**: consulta le partite salvate.

## Avvio (sviluppo locale)

L’app usa **PostgreSQL** (obbligatorio per le API). Serve un file `.env` con `DATABASE_URL`.

1. Copia `.env.example` in `.env` e inserisci l’URL del database (vedi sotto).
2. Poi:

```bash
npm install
npx prisma db push
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000). Su iPhone apri lo stesso indirizzo (rete locale) o usa un tunnel (es. ngrok) per testare da mobile.

**Database locale:** puoi usare un Postgres gratuito su [Neon](https://neon.tech) (crei un progetto e copi l’URL in `.env`) oppure lo stesso database che userai su Vercel (Vercel Postgres).

### Notifiche push (nuove partite e pagelle)

Per inviare notifiche a chi ha attivato le notifiche (nuova partita creata o pagella salvata), servono le **chiavi VAPID**:

1. Genera le chiavi: `npx web-push generate-vapid-keys`
2. In `.env` (e nelle variabili d’ambiente su Vercel) aggiungi:
   - `VAPID_PUBLIC_KEY` = chiave pubblica
   - `VAPID_PRIVATE_KEY` = chiave privata
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` = stessa chiave pubblica (serve al browser per l’iscrizione)

Se non imposti queste variabili, le notifiche non vengono inviate e il pulsante “Attiva notifiche” non compare in home.

### Note pagelle bilingue

Le pagelle hanno due campi per le note: uno in italiano e uno in inglese. Inserisci la nota in italiano e, se vuoi, incolla la traduzione nel campo inglese. In base alla lingua selezionata (IT/EN) viene mostrato il campo appropriato.

## Stack

- Next.js 14 (App Router), React, TypeScript
- Tailwind CSS
- Prisma + **PostgreSQL** (via `DATABASE_URL`)

## Comandi utili

- `npm run dev` – sviluppo
- `npm run build` / `npm run start` – build e avvio in produzione
- `npx prisma studio` – interfaccia per il database

---

## Come caricare sul tuo hosting

L’app è **Next.js** con **Node.js** e un database **PostgreSQL** (variabile `DATABASE_URL`). Per Vercel vedi sotto; per altri server serve Node.js 18+ e un database Postgres (locale o remoto, es. Neon).

### Deploy su Vercel (consigliato)

L’app è configurata per **Vercel + PostgreSQL**. Le API funzionano perché il database è remoto (Vercel Postgres).

1. **Crea un progetto su [Vercel](https://vercel.com)** e collega il repo GitHub (o carica il codice).
2. **Aggiungi il database:** nella Dashboard del progetto vai in **Storage** → **Create Database** → **Postgres** (Vercel Postgres). Scegli piano (es. Hobby) e crea. Vercel imposta automaticamente la variabile **`DATABASE_URL`** nel progetto.
3. **Deploy:** fai **Deploy** (o push su GitHub se hai collegato il repo). Il build esegue `prisma generate`, `prisma db push` (crea le tabelle) e `next build`.
4. L’app sarà online su `https://tuo-progetto.vercel.app`. Le API e il database funzionano.

**Sviluppo locale:** per lavorare in locale con lo stesso DB, in Vercel vai in **Settings → Environment Variables**, copia `DATABASE_URL` e mettila nel file `.env` nella cartella del progetto. Poi `npm run dev`.

### Opzione A: Server con Node.js (VPS, Railway, Render, Fly.io)

L’app usa **PostgreSQL**: imposta la variabile **`DATABASE_URL`** (URL di un database Postgres, es. [Neon](https://neon.tech) gratuito o Postgres sul server).

1. **Carica il progetto** (git clone, upload via FTP/SFTP, o collegamento al repo).
2. **Sul server** imposta `DATABASE_URL` (env o `.env`) e nella cartella del progetto:

```bash
npm install
npx prisma db push
npm run build
npm run start
```

3. L’app sarà in ascolto sulla **porta 3000**. Configura il tuo hosting/web server per puntare a quella porta (es. reverse proxy Nginx).

**Nota**: su **Railway**, **Render**, **Fly.io** imposta `DATABASE_URL` nelle variabili d’ambiente del progetto; il build usa già `prisma generate` e `prisma db push`.

### Opzione C: Hosting con solo FTP (es. Aruba, SiteGround con piano base)

Se hai **solo FTP** e nessun Node.js sul server, non puoi far girare Next.js lì. In quel caso puoi:

- usare un servizio che fa girare Node per te (Railway, Render, Fly.io, Vercel) e puntare il tuo dominio lì, **oppure**
- avere un **VPS** (es. DigitalOcean, Aruba VPS) con Node installato e seguire l’Opzione A.

---

### Deploy con SiteGround

**Guida passo-passo (SSH + Node.js):** vedi **[DEPLOY-SITEGROUND.md](./DEPLOY-SITEGROUND.md)**.

**SiteGround** sui piani condivisi **non supporta Node.js** ufficialmente: puoi però usare SSH e installare Node nella tua home (vedi guida sopra).

Hai due strade:

#### 1. Consigliata: app su un altro servizio + dominio SiteGround

Fai girare RealMadrink su un servizio che supporta Node.js e usa il **dominio che hai su SiteGround** puntandolo lì.

1. **Deploy dell’app** su uno di questi (anche piani gratuiti):
   - **[Railway](https://railway.app)** – collegamento GitHub, build automatico, SQLite persistente
   - **[Render](https://render.com)** – free tier, collegamento GitHub
   - **[Fly.io](https://fly.io)** – free tier

2. **Collega il dominio SiteGround** al servizio scelto:
   - Nel pannello del servizio (Railway/Render/Fly) aggiungi il tuo dominio (es. `realmadrink.tuodominio.it`).
   - In **SiteGround** → **Site Tools** → **Domain** → **DNS Zone Editor**:
     - Crea un record **CNAME**: nome `realmadrink` (o il sottodominio che vuoi), valore l’indirizzo che ti dà Railway/Render/Fly (es. `tuoapp.railway.app`), **oppure**
     - Se il servizio ti dà un **indirizzo IP**, crea un record **A** che punta a quell’IP.

3. Dopo la propagazione DNS, il sito sarà raggiungibile su `https://realmadrink.tuodominio.it` (o il nome che hai scelto).

Così usi SiteGround solo per il dominio/DNS; l’app gira sul servizio Node.

#### 2. Solo se hai SSH e vuoi provare su SiteGround

Se sul tuo piano SiteGround hai **accesso SSH** (es. da “Devs” nel customer area), puoi provare a installare Node.js a mano e far girare l’app. Non è ufficialmente supportato e può essere limitato (memoria, processi). Procedura sintetica:

1. Abilita SSH (chiave, non password) dal pannello SiteGround.
2. Connettiti via SSH e installa Node.js nella tua home (es. da nodejs.org o nvm).
3. Carica il progetto (git o SFTP), poi dalla cartella del progetto:
   - `npm install`
   - `npx prisma generate`
   - `npx prisma db push`
   - `npm run build`
   - `npm run start` (o avvia con `pm2` se disponibile).
4. Il sito sarà in ascolto su una porta (es. 3000); su hosting condiviso spesso non puoi esporre porte custom, quindi questa strada spesso **non funziona** per far vedere il sito al mondo. In quel caso usa l’opzione 1.

**In sintesi**: con SiteGround la soluzione più semplice è **opzione 1**: hostare l’app su Railway/Render/Fly e puntare il dominio SiteGround lì.

#### SiteGround Cloud

Anche su **SiteGround Cloud** Node.js **non è supportato ufficialmente**. Se hai **accesso SSH** (porta **18765** in Site Tools → Devs → SSH):

1. **Abilita SSH** in Site Tools → Devs → SSH Keys Manager (autenticazione a chiave).
2. **Connettiti** (da Mac/Linux):  
   `ssh TUO_USER@TUO_HOST -p 18765`
3. **Installa Node.js** nella tua home (es. nella cartella del sito o in `~/nodejs`):
   ```bash
   wget https://nodejs.org/dist/v20.x.x/node-v20.x.x-linux-x64.tar.xz   # sostituisci con versione attuale
   tar -xf node-v20.*.tar.xz
   export PATH="$HOME/node-v20.*/bin:$PATH"   # oppure metti i bin in ~/bin
   ```
4. **Carica il progetto** (SFTP su porta 18765 o git clone), entra nella cartella e:
   ```bash
   npm install
   npx prisma generate
   npx prisma db push
   npm run build
   npm run start
   ```
5. **Esporre l’app**: su Cloud a volte puoi configurare in Site Tools un **proxy** o un **applicazione Node** (se presente nel pannello). In caso contrario l’app resta in ascolto su una porta interna e non sarà raggiungibile dall’esterno: in quel caso usa l’**opzione 1** (deploy su Railway/Render/Fly e dominio puntato lì).

Se nel pannello SiteGround Cloud non trovi un modo per esporre un’app Node (es. “Node.js app” o reverse proxy sulla porta 3000), la strada più sicura resta **opzione 1**: hostare l’app altrove e puntare il dominio.

---

### Riepilogo comandi sul server (dopo il primo upload)

| Cosa fare        | Comando                    |
|------------------|----------------------------|
| Installare dipendenze | `npm install`        |
| Generare client Prisma | `npx prisma generate` |
| Creare/aggiornare DB | `npx prisma db push`   |
| Build produzione | `npm run build`            |
| Avviare l’app    | `npm run start`            |

Per tenere l’app sempre attiva puoi usare **pm2** (es. `pm2 start npm --name "realmadrink" -- start`) o il sistema di processi del tuo provider.
