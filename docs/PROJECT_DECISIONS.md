# Paint28 – lukitut projektipäätökset

Päivitetty: 2026-07-24

## Teknologia

- Frontend: React 19 + Vite 6 + TypeScript strict mode
- Backend: Supabase PostgreSQL, Auth, Storage, Realtime ja Edge Functions
- Julkinen lomake: `submit-quote` Edge Function
- Admin: `/admin` samassa Vite-sovelluksessa
- Repository: `Jambovisuaalit/paint28-production`
- Julkaisutapa: tarkistettava PR → preview/staging → asiakasesittely → kirjallinen hyväksyntä → tuotantoaktivointi
- Automaattiset testit: Playwright Chromium ja mobile Chromium

## Pull request -portti

Muutoksia ei yhdistetä `main`-haaraan ennen kuin:

1. `npm run lint` onnistuu
2. `npm run typecheck` onnistuu
3. `npm run build -- --mode vercel` onnistuu
4. `npm run test:e2e:ci` onnistuu
5. epäonnistuneesta Playwright-ajosta on ladattava raportti
6. Vercel-preview ja liiketoimintakriittinen smoke-testi on dokumentoitu

## Tarjouspyyntösopimus

- 1–3 kuvaa on pakollinen
- Sallitut tyypit: `image/jpeg`, `image/png`, `image/heic`
- Enimmäiskoko: 10 Mt / kuva, 30 Mt yhteensä
- Selain ja Edge Function käyttävät samaa suomalaisen rekisteritunnuksen normalisointia ja regex-validointia
- Selain ja Edge Function käyttävät samaa suomalaisen puhelinnumeron normalisointia ja regex-validointia
- Serveri poistaa asiakkaan mahdollisesti lähettämät kentät:
  - `id`
  - `status`
  - `internalNotes` / `internal_notes`
  - `storagePath` / `storage_path`
  - `createdAt` / `created_at`
- Serveri asettaa aina:
  - `status = 'Uusi'`
  - `internal_notes = null`
  - `source = 'website'`

## Tietoturva

- Asiakas ei kirjoita suoraan tietokantaan
- Storage-bucket `damage-photos` on private
- Admin avaa kuvat vain 10 minuutin signed URL -osoitteilla
- RLS perustuu `auth.uid()`-tunnisteeseen ja `admin_users`-tauluun
- Service role -avainta ei viedä selaimeen tai GitHubiin
- Julkinen endpoint käyttää rate limiting -RPC:tä ja honeypotia
- Origin-lista hyväksyy vain eksplisiittisiä `http://`- tai `https://`-osoitteita
- `*.vercel.app`-jokeria ei käytetä
- Cloudflare Turnstile aktivoidaan vain site key + secret -parina

## Preview-portti

Ennen asiakasesittelyä:

- käytetään väliaikaista preview-URL:ia
- käytetään erillistä preview-admin-käyttäjää `ville@vidosocial.com`
- preview-admin vaatii sekä Auth-käyttäjän että aktiivisen `admin_users`-rivin
- `paint28.fi`-domainia ei muuteta
- Hannan henkilökohtaista Auth-käyttäjää ei aktivoida
- tuotantoanalytiikkaa tai Search Consolea ei liitetä
- preview saa `noindex,nofollow,noarchive`-asetuksen

Asiakkaan kirjallisen hyväksynnän jälkeen aktivoidaan Hanna, domain, tuotantoanalytiikka ja lopulliset omistajuudet.

## Brändiassetit

- Alkuperäistä V04-logoa ei piirretä uudelleen tekstillä, CSS:llä tai korvaavalla SVG:llä
- Konseptiassetti ei ole alkuperäinen V04-master
- Header-, favicon- ja hero-assetit lisätään vasta, kun alkuperä ja käyttöoikeus on vahvistettu
- Hyväksytyt Paint28-työnäytekuvat ovat edellytys lopulliselle visuaaliselle hyväksynnälle
- Puuttuva assetti merkitään estäväksi eikä sitä korvata generoidulla kuvalla

## Admin-lightbox

- zoom 100–400 %
- hiiren rulla
- panorointi vetämällä
- mobiilin pinch-to-zoom
- pointer capture
- näppäimistö: `+`, `-`, `0`, nuolet ja `Esc`
- fokusloukku ja taustasivun scroll lock

## E2E-cleanup

- Supabaseen deployattu `e2e-cleanup` versio 3 on poistettu käytöstä ja palauttaa aina HTTP 410 -vastauksen.
- Versio 3 ei lue request bodya, suorita SQL-kyselyitä eikä poista tietoja tietokannasta tai Storagesta.
- Edge Function -lokeissa näkyvä onnistunut HTTP 200 -cleanup-kutsu kuuluu aiemmalle versiolle 2.
- Cleanup-toimintoa ei aktivoida tuotantoon uudelleen ilman rajattua testiympäristöä, eksplisiittistä admin-valtuutusta ja auditoitavaa lähdekoodia.
