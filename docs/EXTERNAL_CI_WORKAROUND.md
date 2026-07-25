# GitHub Actions -kierto Paint28-projektissa

GitHub Actions ei tällä hetkellä käynnistä workflow-steppejä eikä tuota job-lokia. Repositoryn Git-, branch- ja pull request -toiminnot toimivat edelleen, joten GitHubia käytetään versionhallintaan ja katselmointiin, mutta tekninen hyväksyntä tehdään Actionsin ulkopuolella.

## Hyväksytty väliaikainen malli

```text
Työhaara
→ draft pull request
→ ulkoinen lint + typecheck + build
→ paikallinen Playwright
→ SHA-256-varmennettu JSON-raportti
→ Vercel-preview
→ manuaalinen katselmointi
→ merge vasta dokumentoidun PASS-tuloksen jälkeen
```

GitHub Actionsin punainen tai puuttuva status ei tässä väliaikaisessa mallissa yksin osoita lähdekoodivirhettä. Hyväksyntä perustuu ulkoisen ajon raporttiin, Vercel-build-lokiin ja preview-testaukseen.

## 1. Asennus puhtaasta checkoutista

```bash
git fetch origin
git checkout <PR-HAARA>
git reset --hard origin/<PR-HAARA>
npm ci
npx playwright install chromium
```

Jos `package-lock.json` ei vastaa `package.json`-tiedostoa, sitä ei saa ohittaa. Riippuvuudet päivitetään erillisessä commitissa ennen validointia.

## 2. Lint, typecheck ja Vercel-build

```bash
npm run verify
```

Komento ajaa järjestyksessä:

1. `npm run lint`
2. `npm run typecheck`
3. `npm run build -- --mode vercel`

Tulos tallentuu paikallisesti:

```text
verification-results/
├── verification-<COMMIT>-<AIKA>.json
├── verification-<COMMIT>-<AIKA>.json.sha256
├── latest.json
└── latest.sha256
```

Raportti sisältää:

- tarkistetun Git-commitin
- branchin
- Node- ja npm-versiot
- käyttöjärjestelmän ja arkkitehtuurin
- jokaisen komennon exit-koodin
- komentojen kestot
- stdout- ja stderr-loppuosat
- koko ajon PASS/FAIL-tuloksen

Salaisia ympäristömuuttujien arvoja ei kirjoiteta raporttiin.

## 3. Täysi Playwright-validointi

```bash
npm run verify:full
```

Tämä ajaa lintin, typecheckin ja buildin lisäksi:

```text
playwright test tests/e2e/quote-flow.spec.ts
```

Live-Supabase-testit pidetään erillisinä opt-in-testeinä. Tavallinen validointi ei saa luoda eikä poistaa tuotantodataa.

## 4. Raportin julkaiseminen PR:ään

Kun koko ajo on PASS:

```bash
npm run verify:publish
```

Komento kirjoittaa SHA-256-varmennetun raportin hakemistoon:

```text
docs/verification/
```

Julkaistava raportti commitoidaan samaan PR:ään:

```bash
git add docs/verification
git commit -m "test: publish external verification evidence"
git push
```

Raportissa olevan `git.sha`-arvon pitää vastata validoitua commitia. Jos raportin lisääminen luo uuden dokumentaatiocommitin, PR-kuvaukseen kirjataan sekä validoitu lähdekoodicommit että raportticommit.

## 5. Vercel build-porttina

`vercel.json` käyttää komentoa:

```text
npm run verify
```

Siten oikeaan repositoryyn yhdistetty Vercel-deployment suorittaa ennen previewn valmistumista:

- ESLintin
- TypeScript typecheckin
- Vite-tuotantobuildin Vercel-modessa

Vercel ei korvaa Playwright-ajoa. E2E todistetaan `npm run verify:full`-raportilla.

## 6. PR:n hyväksymisehdot väliaikaisessa mallissa

PR voidaan merkitä katselmointivalmiiksi vasta, kun:

- [ ] ulkoinen `verify:full` palauttaa PASS
- [ ] JSON-raportti ja `.sha256` ovat saatavilla
- [ ] raportin commit vastaa tarkastettua lähdekoodia
- [ ] Vercel-build palauttaa READY
- [ ] preview-URL on `noindex, nofollow, noarchive`
- [ ] mobiilin sticky CTA on testattu
- [ ] tarjouspyyntölomakkeen validoinnit on testattu
- [ ] preview-admin ja signed URL -kuvat on testattu
- [ ] lightboxin zoom, panorointi ja pinch-eleet on testattu
- [ ] V04- ja työnäyteassettiportin tila on kirjattu
- [ ] vähintään yksi ihminen on tarkastanut diff-in

PR pidetään draft-tilassa siihen asti.

## 7. Actionsin palauttaminen myöhemmin

Kun GitHubin laskutus- tai runner-ongelma on korjattu:

1. Actions ajetaan samalle commitille.
2. Actionsin tuloksia verrataan ulkoiseen raporttiin.
3. Branch protectioniin lisätään pakolliset tarkistukset.
4. Ulkoinen skripti säilytetään paikallisena varmistuskeinona.
5. Väliaikainen poikkeama merkitään päättyneeksi dokumentaatiossa.

GitHub Actionsin palautuminen ei muuta Paint28:n varsinaisia tuotantohyväksyntäehtoja: V04-masterit, oikeat työnäytekuvat, toimiva preview, Turnstile-pari ja asiakkaan hyväksyntä vaaditaan edelleen erikseen.
