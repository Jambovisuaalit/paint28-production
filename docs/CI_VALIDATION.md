# CI validation

GitHub Actions ei ole tällä hetkellä käytettävissä GitHub-tilin laskutus-/runner-ongelman vuoksi. Automaattiset PR-triggerit on poistettu väliaikaisesti käytöstä, jotta laskutusongelma ei tuota perusteettomia punaisia statuksia.

Nykyinen validointimalli:

```text
draft PR
→ npm run verify
→ npm run verify:full
→ SHA-256-varmennettu JSON-raportti
→ Vercel READY
→ manuaalinen katselmointi
→ merge
```

Pakolliset komennot:

```bash
npm ci
npx playwright install chromium
npm run verify:full
```

Raportin julkaisu:

```bash
npm run verify:publish
```

Katso täydellinen prosessi:

- `docs/EXTERNAL_CI_WORKAROUND.md`
- `docs/PREVIEW_RUNBOOK.md`

GitHub Actions voidaan palauttaa automaattiseksi hyväksyntäportiksi myöhemmin ilman, että ulkoinen varmennusskripti poistetaan.
