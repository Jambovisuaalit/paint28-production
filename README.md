# Paint28 Production

Paint28 Oy:n lukittu React/Vite + Supabase -toteutus. Repository sisältää julkisen mobiili-first-sivuston, kuvallisen tarjouspyyntölomakkeen, suojatun admin-dashboardin sekä toistettavat Supabase-migraatiot ja Edge Functionin.

## Stack

- React 18
- Vite 6
- TypeScript
- Supabase Auth, PostgreSQL, Storage, Realtime ja Edge Functions
- Lucide Icons
- oma Paint28 dark/cyan -design system

## Paikallinen käynnistys

```bash
cp .env.example .env
npm install
npm run dev
```

## Tarkistukset

```bash
npm run lint
npm run typecheck
npm run build
npm run preview
```

## Ympäristömuuttujat

```text
VITE_SUPABASE_URL=https://PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
VITE_EDGE_FUNCTION_NAME=submit-quote
VITE_PREVIEW_ADMIN_EMAIL=preview-admin@paint28.test
```

Service role -avainta ei koskaan lisätä Vite-ympäristöön tai GitHubiin.

## Supabase

Project ref: `dbfvptbhxqgsanwnwgxy`

```bash
supabase db push
supabase functions deploy submit-quote --no-verify-jwt
```

Edge Functionin serveriympäristö:

```text
ALLOWED_ORIGINS=http://localhost:5173,https://PREVIEW_HOST
RATE_LIMIT_SALT=<pitkä satunnainen arvo>
TURNSTILE_SECRET_KEY=<valinnainen>
```

## Turvasopimus

- private Storage bucket: `damage-photos`
- 1–3 JPG/PNG/HEIC-kuvaa
- enintään 10 Mt / kuva
- serveri asettaa aina tilan `Uusi`
- serveri ei hyväksy asiakkaalta sisäisiä kenttiä
- signed URL -voimassaolo adminissa 10 minuuttia
- RLS sallii lukemisen ja päivityksen vain aktiiviselle adminille

## Preview-vaihe

Preview-demo käyttää erillistä testikäyttäjää. Hannan Auth-käyttäjä ja `paint28.fi` aktivoidaan vasta asiakkaan esittelyn ja kirjallisen hyväksynnän jälkeen.

Katso:

- `docs/PROJECT_DECISIONS.md`
- `docs/DEMO_ACCEPTANCE.md`
