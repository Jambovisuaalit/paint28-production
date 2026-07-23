# Päästä päähän -demon hyväksymiskriteerit

## Pakollinen demo

1. Avaa preview-sivusto mobiililla.
2. Täytä tarjouspyyntö.
3. Lataa kaksi oikeaa JPG/PNG/HEIC-kuvaa.
4. Lähetä pyyntö.
5. Varmista `201`-vastaus.
6. Varmista, että `quote_requests.status = 'Uusi'`.
7. Varmista, että kuvat ovat private `damage-photos`-bucketissa.
8. Kirjaudu preview-adminilla.
9. Varmista, että liidi näkyy Realtime-päivityksenä.
10. Avaa signed URL -kuvat lightboxiin.
11. Muuta tila `Käsittelyssä` → `Sovittu pajalle`.
12. Arkistoi demoliidi.

## Negatiiviset testit

- 0 kuvaa → estetään
- 4 kuvaa → estetään
- GIF/PDF → estetään
- yli 10 Mt kuva → estetään
- puuttuva tietosuostumus → estetään
- asiakkaan lähettämä `status=Valmis` → tallentuu silti `Uusi`
- asiakkaan lähettämä `internalNotes` → ei tallennu
- kirjautumaton käyttäjä ei voi lukea liidejä tai kuvia
- ei-admin-käyttäjä ei voi lukea liidejä tai kuvia

## Go / No-Go

Demo on esittelykelpoinen vain, kun:

- `npm run lint`, `npm run typecheck` ja `npm run build` onnistuvat
- Edge Function ja migraatiot vastaavat repositorya
- vähintään yksi päästä päähän -testi on dokumentoitu
- estäviä tietoturvahuomautuksia ei ole
- preview-admin voidaan poistaa tai deaktivoida yhdellä SQL-toiminnolla
