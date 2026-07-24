# Paint28 Production

Paint28 Oy:n React/Vite + Supabase -toteutus. Repository sisältää julkisen mobiili-first-sivuston, kuvallisen tarjouspyyntölomakkeen, suojatun admin-dashboardin, Supabase-migraatiot, Edge Functionin ja Playwright-testit.

## Stack

- React 19
- Vite 6
- TypeScript strict mode
- Supabase Auth, PostgreSQL, private Storage, Realtime ja Edge Functions
- Lucide Icons
- Playwright E2E
- Paint28 dark/cyan -design system

## Paikallinen käynnistys

```bash
cp .env.example .env
npm install
npm run dev
```

## Laatuportit

```bash
npm run lint
npm run typecheck
npm run build -- --mode vercel
npm run test:e2e:ci
```

Pull requestin CI suorittaa portit järjestyksessä:

```text
lint → typecheck → Vercel-mode build → Playwright Chromium + mobile Chromium
```

Playwright-raportti tallennetaan GitHub Actions -artifactiksi myös epäonnistumisessa.

## Selainympäristömuuttujat

```text
VITE_SUPABASE_URL=https://PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
VITE_EDGE_FUNCTION_NAME=submit-quote
VITE_PREVIEW_ADMIN_EMAIL=ville@vidosocial.com
VITE_TURNSTILE_SITE_KEY=<valinnainen Cloudflare Turnstile site key>
```

Service role -avainta tai Turnstile-secretiä ei koskaan lisätä Vite-ympäristöön tai GitHubiin.

## Supabase

Project ref:

```text
dbfvptbhxqgsanwnwgxy
```

Deploy-komennot:

```bash
supabase db push
supabase functions deploy submit-quote --no-verify-jwt
```

`submit-quote` on julkinen lomake-endpoint ja käyttää tarkoituksella `verify_jwt = false` -asetusta. Funktio toteuttaa oman origin-, rate limit-, honeypot-, Turnstile-, kenttä- ja tiedostovalidoinnin.

### Edge Function -ympäristö

```text
PREVIEW_ORIGIN=https://EXACT_PREVIEW_HOST
ALLOWED_ORIGINS=https://OTHER_ALLOWED_HOST
RATE_LIMIT_SALT=<pitkä satunnainen arvo>
TURNSTILE_SECRET_KEY=<asetetaan vain yhdessä VITE_TURNSTILE_SITE_KEY-arvon kanssa>
```

`PREVIEW_ORIGIN` ja `ALLOWED_ORIGINS` hyväksyvät vain eksplisiittisiä `http://`- tai `https://`-origins-arvoja. Jokerimerkkejä ei käytetä.

## Turvasopimus

- private Storage bucket: `damage-photos`
- 1–3 JPG/PNG/HEIC-kuvaa
- enintään 10 Mt / kuva ja 30 Mt yhteensä
- frontend ja Edge Function normalisoivat saman suomalaisen rekisteritunnuksen ja puhelinnumeron
- serveri asettaa aina `status = 'Uusi'`, `internal_notes = null` ja `source = 'website'`
- clientin `id`, `status`, `internalNotes`, `storagePath` ja `createdAt` poistetaan
- signed URL -voimassaolo adminissa 10 minuuttia
- RLS sallii lukemisen ja päivityksen vain aktiiviselle `admin_users`-käyttäjälle
- service role -avainta ei viedä selaimeen

## Preview-admin

Preview käyttää käyttäjää:

```text
ville@vidosocial.com
```

Käyttäjän pitää täyttää molemmat ehdot:

1. voimassa oleva Supabase Auth -käyttäjä
2. `public.admin_users`-rivi, jossa `role = 'admin'` ja `active = true`

Hannan henkilökohtainen `hanna@paint28.fi`-tili aktivoidaan vasta asiakasesittelyn ja kirjallisen hyväksynnän jälkeen.

## Turnstile

Turnstile aktivoidaan aina avainparina:

1. Lisää julkinen site key hostin `VITE_TURNSTILE_SITE_KEY`-muuttujaan.
2. Lisää vastaava secret Supabase Edge Functionin `TURNSTILE_SECRET_KEY`-muuttujaan.
3. Redeployaa frontend ja Edge Function.
4. Testaa onnistunut lähetys sekä puuttuvan ja vanhentuneen tokenin virhetilat.

Pelkkää backend-secretiä ei saa aktivoida ilman frontendin site keytä, koska silloin kaikki normaalit lähetykset estyvät.

## E2E-testit

CI-testit käyttävät mockattua Edge Function -vastausta eivätkä kirjoita tuotantodataa:

```bash
npm run test:e2e:ci
```

Deployatun Edge Functionin palvelinvalidointi voidaan testata erikseen:

```bash
E2E_LIVE_BACKEND=true \
VITE_SUPABASE_URL=https://PROJECT_REF.supabase.co \
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_... \
npm run test:e2e -- tests/e2e/live-backend.spec.ts
```

Live-testit lähettävät vain tarkoituksella virheellisiä pyyntöjä, joiden pitää pysähtyä ennen tietokantakirjoitusta.

## Brändiasset-portti

Repositoryssa ei vielä ole tunnistettavaa alkuperäistä V04 header-masteria tai hyväksyttyjä korkearesoluutioisia Paint28-työnäytekuvia. Konseptikuvaa ei saa käyttää alkuperäisen masterin korvikkeena.

Tarvittavat tiedostot:

```text
public/brand/logo/paint28-v04-header.svg tai alkuperäinen PNG-master
public/brand/hero/paint28-workshop-hero.webp
public/brand/hero/paint28-work-sample-01.webp
public/brand/hero/paint28-work-sample-02.webp
```

Assetit lisätään vasta, kun niiden alkuperä, käyttöoikeus ja hyväksyntä on vahvistettu. Katso `docs/BRAND_ASSET_GATE.md` ja issue #8.

## Preview-vaihe

Preview-demo käyttää väliaikaista `vercel.app`-osoitetta ja `noindex,nofollow,noarchive`-asetusta. `paint28.fi`, Hannan oma käyttäjä, Search Console ja tuotantoanalytiikka aktivoidaan vasta asiakkaan kirjallisen hyväksynnän jälkeen.

Katso:

- `README-DEMO.md`
- `docs/PROJECT_DECISIONS.md`
- `docs/DEMO_ACCEPTANCE.md`
- `docs/BRAND_ASSET_GATE.md`
