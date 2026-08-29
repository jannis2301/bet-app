# TODO

Stand: 2026-08-27. Ergebnis eines Backend/Frontend-Reviews inkl. Live-Tests.

## 🔴 Vor dem Start (Launch-Blocker)

- [x] **render.yaml reparieren** — war ungültiges YAML (fehlendes Leerzeichen bei
      `-key: JWT_SECRET`/`-key: JWT_LIFETIME`), referenzierte noch yarn statt pnpm, und
      enthielt einen zweiten, fälschlich verschachtelten "Frontend"-Service, obwohl die App
      ein Monolith ist (ein Node-Service baut den Client und liefert ihn via Express-Static
      aus, siehe [server.js](server.js)). Zusätzlich unterstützt Render gar kein natives
      MongoDB über den `databases:`-Block (nur Postgres/Key Value) — die alte Konfiguration
      hätte beim Deploy nicht funktioniert. Neu aufgesetzt: ein `type: web`-Service,
      `MONGODB_URI` als manuell gesetztes Secret (`sync: false`, z.B. MongoDB Atlas),
      `JWT_SECRET` per `generateValue: true` automatisch erzeugt. Zusätzlich einen echten
      `/healthcheck`-Endpunkt in [server.js](server.js) ergänzt (vorher zeigte
      `healthCheckPath` ins Leere) — prüft per `mongoose.connection.readyState` auch die
      DB-Verbindung, nicht nur ob der Prozess läuft. `plan: free` statt `starter`, damit vor
      dem eigentlichen Start keine Kosten anfallen.
- [x] **Saison-Gesamttabelle** — neuer Endpunkt `GET /api/bets/leaderboard/season`
      ([betsController.js](controllers/betsController.js)) aggregiert `pointsEarned` über
      alle Spieltage hinweg. [Leaderboard.jsx](client/src/pages/dashboard/Leaderboard.jsx)
      hat jetzt einen Tab-Umschalter zwischen Spieltags- und Gesamttabelle.

## 🟠 Bald nach dem Start

- [ ] **Private Gruppen/Ligen** — Einladungscode, damit z.B. ein Freundeskreis nur
      untereinander eine eigene Tabelle hat, statt gegen alle registrierten User.
- [x] **Tests** — Vitest-Setup für Backend ([vitest.config.js](vitest.config.js), mit
      mongodb-memory-server für echte DB-Integrationstests statt Mocks) und Frontend
      ([client/vite.config.js](client/vite.config.js), Testing Library) steht.
      Coverage bisher: Kickoff-Sperre, Season-Tagging, Upsert-Verhalten und
      Leaderboard-Aggregation in [betsController.js](controllers/betsController.js),
      Reducer-Logik und die Leaderboard-Tab-Umschaltung im Frontend. Weitere Bereiche
      (Auth-Controller, Passwort-Reset sobald vorhanden, restliche Components) sollten
      nach und nach Coverage bekommen — insbesondere bevor/während der TypeScript-Migration
      unten, damit die als Sicherheitsnetz dient.
- [x] **TypeScript-Migration** — schrittweise Umstellung von Backend und Frontend auf
      TypeScript, jetzt möglich, da die Testbasis als Sicherheitsnetz für den Umbau
      existiert. Vorher zurückgestellt, weil eine Migration ohne Tests nur schwer
      verifizierbar gewesen wäre. - [x] **Backend** — komplett auf TypeScript + ESM umgestellt (`"type": "module"`,
      `tsconfig.json`, `tsc` als Build-Schritt nach `dist/`). `nodemon` durch
      `tsx watch` ersetzt (versteht TS nativ, macht `nodemon` redundant).
      [render.yaml](render.yaml) startet jetzt `node dist/server.js`,
      [ci.yml](.github/workflows/ci.yml) hat einen `pnpm run typecheck`-Schritt.
      Mongoose-Models bekamen echte Dokument-Interfaces
      ([models/User.ts](models/User.ts), [models/Bet.ts](models/Bet.ts)),
      `req.user` ist über eine globale Express-Typerweiterung
      ([types/express.d.ts](types/express.d.ts)) typisiert. Die
      CJS-spezifischen `require()`-Workarounds in den Tests
      (`betsController.test.ts`'s Mocking von `fetchBundesligaMatches`,
      `app.production.test.ts`'s verzögerter Import nach dem Setzen von
      `NODE_ENV`) wurden auf echtes ESM umgestellt — Vitest patcht ESM-Namespace-
      Exports so, dass `vi.spyOn()` direkt funktioniert, ein dynamisches
      `import()` übernimmt die Rolle des verzögerten `require()`. Verifiziert
      per `pnpm run typecheck`, `pnpm test`, echtem `pnpm run build` +
      manuellem Start von `node dist/server.js` gegen eine echte Mongo-Instanz
      (`/healthcheck` geprüft), sowie `pnpm run dev` (Hot-Reload via `tsx watch`). - [x] **Frontend** — komplett auf TypeScript umgestellt (`.jsx`→`.tsx`,
      `.js`→`.ts`), kein Modulsystem-Wechsel nötig (Vite lief schon auf ESM).
      Neue Datei [types.ts](client/src/types.ts) mit den geteilten
      Domänentypen (`Match`, `Team`, `Bet`, `User`, `LeaderboardEntry`).
      Reducer/Actions sind jetzt eine echte discriminated union
      ([actions.ts](client/src/context/actions.ts): jede Konstante mit
      `as const`, dazu ein `Action`-Union-Type), wodurch
      [reducer.ts](client/src/context/reducer.ts) ohne Casts typsicher ist.
      `AppContextValue` in [appContext.tsx](client/src/context/appContext.tsx)
      typisiert den gesamten Context inkl. aller Funktionen, `axios`-Aufrufe
      haben jetzt Response-Generics statt implizitem `any`. Die drei Tests,
      die `useAppContext` mocken, nutzen jetzt `vi.mocked(...)` statt direktem
      Zugriff auf `.mockReturnValue`. Verifiziert per `pnpm --dir client run
        typecheck`, `pnpm --dir client test`, echtem `pnpm run build-client`,
      sowie einem vollen Browser-Durchlauf (Playwright, headless) gegen
      Dev-Server + In-Memory-Mongo: Registrierung, Spieltag-Anzeige mit
      echten openligadb-Daten, Leaderboard-Tab-Wechsel, Tipp-Formular,
      Tipps-Übersicht und Profil — keine Konsolen-/Laufzeitfehler.
- [x] **Dependencies auf neueste Major-Version heben** — ein Major nach dem anderen,
      mit der Testbasis oben als Sicherheitsnetz. `pnpm outdated` zeigt jetzt nichts
      mehr an, der komplette Workspace ist auf dem neuesten Stand: - [x] **Express 4→5** — `express-async-errors` entfernt (Express 5 leitet
      rejected Promises aus Handlern/Middleware jetzt nativ an die
      Error-Middleware weiter). Wildcard-Route in [app.js](app.js) von
      `app.get('*', ...)` auf `app.get('/{*splat}', ...)` umgestellt — ein
      bloßes `*splat` matcht anders als Express 4's `*` die Root `/` nicht
      mehr, wurde per Hand gegen einen echten Express-5-Prozess verifiziert.
      `express-mongo-sanitize` reassigned `req.query` komplett, was in
      Express 5 nicht mehr geht (`req.query` ist jetzt ein reiner Getter
      ohne Setter, der bei jedem Zugriff neu parst) — Sanitizing für Query
      läuft jetzt über eine eigene `query parser`-Funktion, Body/Params
      weiterhin direkt gemutet. **Nebenbefund:** Die SPA-Fallback-Route stand
      im Code vor den `/api/*`-Routern und hätte im Produktivbetrieb
      (`NODE_ENV=production`) sämtliche API-GET-Requests verschluckt — ein
      vorbestehender, nie unter `NODE_ENV=production` getesteter Bug, jetzt
      gefixt (Route-Reihenfolge vertauscht) und mit
      [app.production.test.js](app.production.test.js) dauerhaft abgesichert. - [x] **Mongoose 8→9** — nach Abgleich mit dem offiziellen Migration Guide betraf
      keine der Breaking Changes (Pre-Middleware ohne `next()`, Update-Pipeline-
      Arrays, `findOneAndUpdate`-Optionen, ObjectId-aus-Number, Geo-Queries,
      Subdocument-Hooks) den tatsächlichen Code hier — einziger Berührungspunkt
      war `UserSchema.pre('save', ...)`, das schon async ohne `next` war. Reine
      Versionsanhebung, komplette Testsuite (inkl. echter In-Memory-DB-Queries)
      lief unverändert grün durch. - [x] **React 18→19** — Codebase nutzt schon durchgehend `createRoot`, reine
      Funktionskomponenten/Hooks, kein `ReactDOM.render`/`findDOMNode`,
      `propTypes`/`defaultProps`, Klassen-Components, String-Refs oder
      `forwardRef` — also keine der React-19-Breaking-Changes betroffen.
      react-icons/react-router-dom/@testing-library/react akzeptieren React 19
      per Peer-Range bereits. Reine Versionsanhebung, alle Frontend-Tests
      (echtes RTL-Rendering + Interaktionen) liefen unverändert grün durch. - [x] **React Router 6→7** — App nutzt nur die klassische Library-Mode-API
      (`BrowserRouter`/`Routes`/`Route`/`Link`/`NavLink`/`Outlet`/`Navigate`/
      `useNavigate`, ausschließlich absolute Pfade, kein Data-Router, keine
      Loader/Actions) — genau die Fläche, die v7 kompatibel weiterführt.
      [ProtectedRoute.jsx](client/src/pages/ProtectedRoute.jsx) war die einzige
      Stelle mit echter Router-Logik (`<Navigate>`-Redirect) und hatte bisher
      keine Tests — neuer
      [ProtectedRoute.test.jsx](client/src/pages/ProtectedRoute.test.jsx) deckt
      jetzt Loading-/Redirect-/Children-Fall ab. - [x] **Vite 5→8 & Vitest 3→4** — drei Vite-Majors auf einmal, größter Sprung
      der Liste: Vite 8 ersetzt esbuild/Rollup intern durch Rolldown/Oxc.
      Config nutzt weder `build.rollupOptions` noch Sass (bereits vorher auf
      natives CSS umgestellt) noch sonstige der laut Migration-Guide
      betroffenen Optionen — daher reine Versionsanhebung ohne Config-Änderung.
      `@vitejs/plugin-react-swc` läuft unverändert weiter (Vite meldet nur eine
      Performance-Empfehlung, auf `@vitejs/plugin-react` zu wechseln — bewusst
      nicht gemacht, da das neue Rolldown/Babel/React-Compiler-Abhängigkeiten
      zieht, ohne für dieses Projekt einen echten Vorteil zu bringen). Build
      läuft jetzt spürbar schneller (~3s → ~0,8s). Zusätzlich zu den
      automatisierten Tests den Dev-Server (`pnpm start`, inkl. Proxy-Setup)
      manuell hochgefahren und per `curl` verifiziert. - [x] **Restliche kleine, unabhängige Majors** — bcrypt 5→6 (nur Build/Distribution
      umgestellt auf prebuildify, API unverändert; Hash/Compare-Roundtrip manuell
      gegen den echten nativen Addon verifiziert), express-rate-limit 7→8 (Changelog
      geprüft: `max: 0`-Verhalten, `req.rateLimit.current`, entfernte Legacy-Optionen
      — nichts davon von uns genutzt), dotenv 16→17 (loggt jetzt standardmäßig eine
      Info-Zeile beim Start, betrifft nur `server.js`, nicht die Tests, die nur
      `app.js` laden), node-cron 3→4 (Registrierung manuell gegen den echten
      Scheduler verifiziert, kein Zugriff auf entfernte APIs), concurrently 9→10
      (rein Dev-Tooling, kein Prod-Code-Pfad betroffen).
- [x] **Passwort-Reset-Flow** — neue Endpunkte `POST /api/auth/forgot-password` und
      `POST /api/auth/reset-password` ([authController.ts](controllers/authController.ts)).
      Reset-Token wird gehasht (SHA-256) mit 10 Min. Ablaufzeit auf dem `User`-Dokument
      gespeichert ([models/User.ts](models/User.ts)), `forgot-password` antwortet immer
      mit derselben generischen Nachricht (verhindert Email-Enumeration). Mailversand
      war anfangs bewusst noch nicht angebunden (Klartext-Token kam nur außerhalb von
      Production in der Response zurück) — inzwischen nachgezogen: `forgotPassword`
      verschickt den Reset-Link jetzt per echter Mail über
      [utils/sendEmail.ts](utils/sendEmail.ts) (dieselbe SMTP-Infrastruktur, die für die
      Erinnerungs-Benachrichtigungen weiter unten entstanden ist), die Basis-URL für den
      Link kommt aus dem Request selbst (`req.get('host')`, Protokoll je nach
      `NODE_ENV`), ein Mailversand-Fehler wird geloggt, ändert aber nichts an der
      generischen Antwort (kein Enumeration-Leck über Umwege). Eigener Rate-Limiter
      getrennt von Register/Login ([authRoutes.ts](routes/authRoutes.ts)), damit sich
      Reset-Versuche nicht das Kontingent mit Login teilen. Neue Seiten
      [ForgotPassword.tsx](client/src/pages/ForgotPassword.tsx) und
      [ResetPassword.tsx](client/src/pages/ResetPassword.tsx) im Frontend. Verifiziert per
      Backend-Tests (kompletter Forgot→Reset→Invalidierung-Flow, Mailversand-Fehler
      blockiert die generische Antwort nicht) und echtem, unmockiertem Durchlauf gegen
      In-Memory-Mongo + echten SMTP-Versand (Ethereal) — Mail kam mit korrektem
      Reset-Link im Postfach an.
- [x] **Rate-Limiting auf `/api/bets/*`** — [betsRoutes.js](routes/betsRoutes.js) hat
      jetzt einen `router.use(apiLimiter)` für alle Bets-/Leaderboard-Endpunkte
      (100 Requests / 15 Min pro IP, großzügiger als das Auth-Limit, da Spieltag-
      Navigation und Tab-Wechsel im Frontend mehrere Requests pro Interaktion auslösen).
- [x] **CI-Pipeline** — [.github/workflows/ci.yml](.github/workflows/ci.yml) läuft bei
      jedem Push auf `main` und jedem PR: Lint (Biome), Backend-Tests, Frontend-Tests,
      Client-Build. Damit ist die Testbasis oben jetzt auch automatisch abgesichert,
      bevor TypeScript-Migration oder die Major-Dependency-Updates angefasst werden.

## 🟡 Nice-to-have

- [x] **PWA-Manifest fertigstellen** — `name`/`short_name` in
      [site.webmanifest](client/public/site.webmanifest) gefüllt (`Tippy –
  Bundesliga Tippspiel` / `Tippy`, passend zum bestehenden Markennamen in
      [Logo.tsx](client/src/components/Logo.tsx)), dazu `description`, `start_url` und
      `scope` ergänzt. `theme_color`/`background_color` waren auf Weiß gesetzt (Standard
      des Generators) statt auf die tatsächlichen App-Farben — jetzt `#008080`
      (Header-Farbe, `--blue` in [variables.css](client/src/styles/variables.css)) bzw.
      `#222222` (Body-Hintergrund, `--bg-clr`); passendes `<meta name="theme-color">` in
      [index.html](client/index.html) ergänzt. Zweite Icon-Größe `512x512`
      hinzugefügt (aus dem einzigen vorhandenen `192x192`-Icon hochskaliert — für ein
      schärferes Icon müsste das Ausgangsbild in höherer Auflösung neu bereitgestellt
      werden), da Chrome für die Installierbarkeits-Prüfung sowohl ein 192er als auch
      ein 512er PNG-Icon erwartet. Ein Service Worker (für echtes Offline-Verhalten)
      existiert weiterhin nicht — das war nicht Teil dieses Punkts und wäre ein eigenes,
      größeres Vorhaben. Verifiziert: Manifest-JSON validiert, `pnpm run build` übernimmt
      Manifest und beide Icons unverändert nach `dist/`, echter Check gegen einen
      Produktions-Preview-Server (Manifest-Link löst auf, beide Icons laden mit
      `image/png`, `theme-color`-Meta-Tag korrekt gesetzt).
- [x] **Passwort ändern im Profil** — neuer Endpunkt `PATCH /api/auth/updatePassword`
      ([authController.ts](controllers/authController.ts)), prüft das aktuelle Passwort
      per `comparePassword` und gibt bei falschem Passwort bewusst **400** statt 401
      zurück — ein 401 hätte den globalen "401 → Logout"-Interceptor im Frontend
      ausgelöst, obwohl die Session noch gültig ist. Zweites Formular in
      [Profile.tsx](client/src/pages/dashboard/Profile.tsx) (aktuelles/neues/Bestätigungs-
      Passwort, clientseitiger Abgleich vor dem Request). Verifiziert per Backend-/
      Frontend-Tests und echtem Playwright-Durchlauf (falsches Passwort → Alert ohne
      Logout, korrekte Änderung → altes Passwort danach ungültig, neues funktioniert).
- [x] **Erinnerungs-Benachrichtigungen** — per E-Mail (Rückfrage im Chat: Web-Push
      hätte einen neuen Service Worker + VAPID-Infrastruktur gebraucht, E-Mail
      reicht auf denselben Mailversand, der beim Passwort-Reset bewusst
      zurückgestellt wurde). Neuer generischer Mailer
      [utils/sendEmail.ts](utils/sendEmail.ts) via Nodemailer/SMTP (Provider-
      unabhängig, Zugangsdaten über `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/
      `SMTP_PASS`/`SMTP_FROM`, ergänzt in [render.yaml](render.yaml) als manuell zu
      setzende Secrets) — direkt danach auch rückwirkend in den Passwort-Reset-Flow
      eingebaut (siehe Eintrag oben), der bis dahin nur einen Dev-only-Token
      zurückgab. Cronjob alle 30 Minuten
      ([scheduler/reminderScheduler.ts](scheduler/reminderScheduler.ts) →
      [scheduler/matchdayReminder.ts](scheduler/matchdayReminder.ts), analog zum
      bestehenden `matchCompareScheduler.ts`/`compareScores.ts`-Muster): sobald der
      früheste Kickoff des aktuellen Spieltags innerhalb der nächsten 24h liegt,
      bekommt jeder User ohne Tipp für diesen Spieltag eine Erinnerungsmail. Ein
      neues `Reminder`-Model ([models/Reminder.ts](models/Reminder.ts), unique
      Index auf Saison+Spieltag) verhindert Mehrfachversand über Neustarts/
      Cron-Ticks hinweg; einzelne fehlgeschlagene Mails (z.B. SMTP-Ausfall)
      blockieren nicht den Rest des Batches (`Promise.allSettled`). Kein
      Opt-out — jeder registrierte User ohne Tipp bekommt die Erinnerung; eine
      Präferenz-Einstellung wäre ein eigener, kleinerer Folge-Punkt. Verifiziert
      per Backend-Tests (Fenster-Grenzfälle, nur Nicht-Tipper, kein Doppelversand,
      einzelner SMTP-Fehler blockiert Batch nicht) sowie einem echten,
      unmockierten Durchlauf gegen echtes openligadb, echtes In-Memory-Mongo und
      echten SMTP-Versand (Ethereal-Testkonto) — E-Mail kam nachweislich nur beim
      Nicht-Tipper an, mit korrektem Spieltag und Inhalt.
- [ ] **Weitere Wettbewerbe** — aktuell hart auf Bundesliga 1 (`bl1`) verdrahtet
      ([utils/fetchMatches.js](utils/fetchMatches.js), [appContext.jsx](client/src/context/appContext.jsx)).
- [x] **Duplizierte Match-Fetch-Logik konsolidieren** — neuer Endpunkt
      `GET /api/matches` ([matchesController.ts](controllers/matchesController.ts),
      [matchesRoutes.ts](routes/matchesRoutes.ts)) proxied openligadb, statt dass der
      Client direkt dagegen geht. `utils/fetchMatches.ts` wurde in zwei Bausteine
      aufgeteilt (`fetchCurrentMatchday`, `fetchMatchdayData`); der bestehende
      `fetchBundesligaMatches`-Helper für interne Server-zu-Server-Aufrufe
      (Scheduler, Bet-Locking) bleibt unverändert darüber zusammengesetzt.
      Die Spieltag-Navigation (Wraparound bei Spieltag unter 1 bzw. über 34) und die
      Saison-Berechnung, die vorher dupliziert im Frontend steckten
      ([appContext.tsx](client/src/context/appContext.tsx)), leben jetzt nur noch im
      Matches-Controller — der Client ruft nur noch `/api/matches` auf und enthält
      keine eigene Geschäftslogik mehr dafür. `connectSrc` in der CSP
      ([app.ts](app.ts)) verliert dadurch die `api.openligadb.de`-Ausnahme, da der
      Browser diesen Host nicht mehr direkt kontaktiert. Verifiziert per Backend-Tests
      (Wraparound, ungültiger Spieltag, Auth-Pflicht) und echtem Playwright-Durchlauf
      gegen Dev-Server + In-Memory-Mongo mit echten openligadb-Daten: Home- und
      PlaceBet-Seite zeigen Spieltagsdaten korrekt an, Matchday-Navigation funktioniert,
      der Browser kontaktiert nachweislich nur noch die eigene Origin (plus die
      Team-Icon-Hosts) statt openligadb direkt.
- [x] **Tie-Breaker-Regel für Punktgleichstand im Leaderboard** — festgelegt: 1. Gesamtpunkte, 2. Anzahl exakter Ergebnisse (3-Punkte-Tipps), 3. Name
      alphabetisch als letzter, garantiert deterministischer Fallback (entspricht der
      gängigen Konvention bei Tippspielen wie Kicktipp). Umgesetzt in
      [betsController.ts](controllers/betsController.ts): die Aggregation zählt
      `exactHits` zusätzlich zu `totalPoints` mit, `populateLeaderboard` sortiert nach
      Namensauflösung final deterministisch über alle drei Kriterien (ein reiner
      Mongo-`$sort` konnte den Namens-Tiebreak nicht abdecken, da der Name erst nach dem
      User-Join bekannt ist). Gilt für Spieltags- und Saison-Leaderboard gleichermaßen.
      Neue Spalte "Exakt" in [Leaderboard.tsx](client/src/pages/dashboard/Leaderboard.tsx)
      macht die Regel für Nutzer sichtbar/nachvollziehbar, statt sie nur intern zu
      dokumentieren. Verifiziert per Backend-Tests (Gleichstand mit unterschiedlicher
      Anzahl exakter Treffer, vollständiger Gleichstand → alphabetisch) und echtem
      Playwright-Durchlauf gegen Dev-Server + In-Memory-Mongo mit real erzeugtem
      Punktgleichstand.
- [x] **Saison-Archivierung** — ca. 30 Tage nach dem letzten Spieltag (34.) wird die
      Saison automatisch archiviert und aufgeräumt, damit Bets nicht unbegrenzt in der
      DB wachsen. Neuer Cronjob, einmal täglich um 03:00 Uhr
      ([scheduler/seasonArchiveScheduler.ts](scheduler/seasonArchiveScheduler.ts) →
      [scheduler/seasonArchive.ts](scheduler/seasonArchive.ts)): prüft anhand echter
      openligadb-Daten, ob der 34. Spieltag beendet ist und die 30-Tage-Frist
      (Puffer für verschobene Spiele/Korrekturen) verstrichen ist, speichert dann die
      Endtabelle als Snapshot (Name + Punkte + exakte Treffer, unabhängig von der
      `User`-Collection — damit Namensänderungen oder gelöschte Accounts die
      historische Tabelle nicht verfälschen) in einem neuen `SeasonArchive`-Model
      ([models/SeasonArchive.ts](models/SeasonArchive.ts)) und löscht danach alle
      Bets dieser Saison. Läuft nur einmal pro Saison (Unique-Index auf `season`).
      Die Tie-Breaker-Aggregation aus dem Eintrag oben wurde dafür aus
      [betsController.ts](controllers/betsController.ts) in ein gemeinsames
      [utils/leaderboard.ts](utils/leaderboard.ts) extrahiert, damit Live-Leaderboard
      und Archivierung exakt dieselbe Sortierregel verwenden.
      Neue Endpunkte unter `/api/archive`
      ([archiveController.ts](controllers/archiveController.ts)): Liste aller
      archivierten Saisons, Detail-Tabelle einer Saison, sowie ein PDF-Download pro
      Saison. Das PDF wird bewusst on-the-fly aus den gespeicherten Daten generiert
      (via [utils/generateLeaderboardPdf.ts](utils/generateLeaderboardPdf.ts),
      `pdfkit`) statt als Datei abgelegt zu werden — Renders Dateisystem ist nicht
      persistent über Deploys/Neustarts hinweg, eine gespeicherte PDF-Datei würde
      also beim nächsten Deploy verschwinden. Neue Seite "Vergangene Saisons"
      ([PastSeasons.tsx](client/src/pages/dashboard/PastSeasons.tsx)) mit
      aufklappbarer Tabelle pro Saison und Download-Link, verlinkt in der Navbar.
      Verifiziert per Backend-Tests (Fenster-/Delay-Grenzfälle, kein Doppel-Archivieren,
      Endtabelle inkl. Tie-Breaker, PDF-Header) und echtem Playwright-Durchlauf gegen
      Dev-Server + In-Memory-Mongo: Navigation über die Navbar, Tabelle zeigt
      korrekt tie-gebrochene Reihenfolge, PDF-Download liefert ein gültiges PDF
      (`%PDF-`-Header) mit korrektem Dateinamen.
