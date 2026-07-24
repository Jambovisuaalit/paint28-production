# Paint28 preview deployment

Preview rakennetaan `fix/production-readiness-gates`-haarasta tarkistettavaksi pull requestiksi. Muutoksia ei yhdistetä `main`-haaraan ennen vihreää CI:tä, toimivaa Vercel-previewta ja dokumentoitua smoke-testiä.

## Vercel-konfiguraatio

- `vercel.json` ajaa `npm run build -- --mode vercel`.
- Vite käyttää Vercelissä juuripolkua `/`.
- SPA-reitit ohjataan `index.html`-tiedostoon.
- Preview vastaa headerilla `X-Robots-Tag: noindex, nofollow, noarchive`.
- Selainbundle käyttää vain julkista Supabase-URL:ia ja publishable keytä.

## Nykyinen Vercel-tila 24.7.2026

Projektissa `paint28-vite-app-production-ready` näkyy vain yksi epäonnistunut deployment:

```text
paint28-vite-app-production-ready-7xr2pdxnh.vercel.app
state: ERROR
```

Tätä osoitetta ei pidetä hyväksyttynä preview-originina ennen onnistunutta redeployta.

## Git-yhteys

Vercelin Git-integraation tulee osoittaa tähän repositoryyn:

```text
Jambovisuaalit/paint28-production
```

Preview branch:

```text
fix/production-readiness-gates
```

Production branch pysyy `main`-haarassa, mutta tuotantojulkaisua ei aktivoida ennen asiakashyväksyntää.

## Preview-origin

Kun Vercel luo onnistuneen pysyvän preview-osoitteen, lisää täsmällinen origin Supabase Edge Functionin ympäristöön:

```text
PREVIEW_ORIGIN=https://EXACT_PREVIEW_HOST
```

Vaihtoehtoiset lisäoriginit:

```text
ALLOWED_ORIGINS=https://HOST_ONE,https://HOST_TWO
```

- Älä käytä `*.vercel.app`-jokeria.
- Älä lisää deploymentia, jonka tila on `ERROR`.
- Redeployaa `submit-quote` origin-muutoksen jälkeen.

## Preview-admin

Käytössä oleva preview-admin:

```text
ville@vidosocial.com
```

24.7.2026 live-tarkistus vahvisti:

- Auth-käyttäjä on olemassa
- sähköposti on vahvistettu
- `role = 'admin'`
- `active = true`

Hannan henkilökohtaista tiliä ei aktivoida preview-vaiheessa.

## Turnstile

Turnstile otetaan käyttöön vain avainparina:

```text
Vercel:  VITE_TURNSTILE_SITE_KEY=<site key>
Supabase: TURNSTILE_SECRET_KEY=<matching secret>
```

Jos avaimia ei ole vielä saatavilla, molemmat jätetään pois. Pelkän secretin aktivointi estäisi lomakelähetykset.

## Pakolliset tarkistukset

1. PR:n `lint-typecheck-build` on vihreä.
2. PR:n `playwright-ui-smoke` on vihreä.
3. Julkinen sivu latautuu ilman puuttuvia assetteja.
4. Mobiilin sticky CTA näkyy alle 768 px leveydessä.
5. Tarjouspyyntö hyväksyy 1–3 oikeaa JPG/PNG/HEIC-kuvaa.
6. PDF, yli 10 Mt kuva, nolla kuvaa ja puuttuva suostumus estetään.
7. Live Edge Function hylkää virheellisen puhelinnumeron ja rekisteritunnuksen.
8. Preview-admin näkee uuden liidin Realtime-päivityksenä.
9. Signed URL -kuvat avautuvat lightboxiin.
10. Zoom, panorointi, hiiren rulla ja mobiilin pinch-to-zoom toimivat.
11. Preview ei indeksoidu.
12. Alkuperäinen V04-logo ja hyväksytyt työnäytekuvat on lisätty tai asset-poikkeama on kirjattu estäväksi.
