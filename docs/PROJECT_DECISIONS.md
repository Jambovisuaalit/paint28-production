# Paint28 – lukitut projektipäätökset

Päivitetty: 2026-07-23

## Teknologia

- Frontend: React 18 + Vite + TypeScript
- Backend: Supabase PostgreSQL, Auth, Storage, Realtime ja Edge Functions
- Julkinen lomake: `submit-quote` Edge Function
- Admin: `/admin` samassa Vite-sovelluksessa
- Repository: `Jambovisuaalit/paint28-production`
- Julkaisutapa: preview/staging ennen asiakasaktivointia

## Tarjouspyyntösopimus

- 1–3 kuvaa on pakollinen
- Sallitut tyypit: `image/jpeg`, `image/png`, `image/heic`
- Enimmäiskoko: 10 Mt / kuva, 30 Mt yhteensä
- Selain ja Edge Function validoivat saman sopimuksen
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
- Cloudflare Turnstile voidaan aktivoida ympäristömuuttujalla

## Preview-portti

Ennen asiakasesittelyä:

- käytetään väliaikaista preview-URL:ia
- käytetään erillistä preview-admin-käyttäjää
- `paint28.fi`-domainia ei muuteta
- Hannan henkilökohtaista Auth-käyttäjää ei aktivoida
- tuotantoanalytiikkaa tai Search Consolea ei liitetä

Asiakkaan kirjallisen hyväksynnän jälkeen aktivoidaan Hanna, domain, tuotantoanalytiikka ja lopulliset omistajuudet.
