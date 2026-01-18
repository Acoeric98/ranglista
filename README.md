# Ranglista / házibajnokság

Egyszerű, statikus ranglista és statisztika felület házibajnoksághoz, Flask-alapú API-val. A frontend HTML/JS oldalakat szolgál ki, a backend pedig JSON fájlokban tárolja a meccseket és a heti párosításokat.

## Fő funkciók

- Ranglista megjelenítés győzelem/döntetlen/vereség, pontkülönbség, meccsszám és winrate alapján.
- Heti párosítások listázása.
- Játékosokra kattintva head-to-head összesítés.
- Admin felület meccsek rögzítéséhez és párosítás generáláshoz.
- Részletes statisztikák külön oldalon játékosonként.

## Technológiák

- **Backend**: Python + Flask (`backend/app.py`), JSON fájl alapú tárolás.
- **Frontend**: statikus HTML/CSS/JS (`index.html`, `stats.html`, `frontend/*.js`).

## Könyvtárstruktúra

- `backend/app.py`: Flask API és statisztika generálás.
- `backend/datas.json`: meccsek tárolása.
- `backend/pairings.json`: aktuális párosítások.
- `backend/stats.json`: generált statisztika kimenet (a backend frissíti).
- `index.html`: fő ranglista oldal.
- `stats.html`: statisztika oldal.
- `backend/admin.html`: admin felület.
- `frontend/`: JavaScript és stílusok.

## API végpontok (röviden)

- `GET /api/matches` – összes meccs.
- `POST /api/match` – új meccs mentése.
- `GET /api/pairings` – aktuális párosítások.
- `POST /api/pairings` – párosítások mentése.
- `GET /api/stats` – összesített statisztikák.
- `GET /api/generate-pairings` – heti párosítás generálása.

**Meccs payload példa**

```json
{
  "a": "JátékosA",
  "b": "JátékosB",
  "rounds": [1, 0, 1, 1]
}
```

A `rounds` tömbben 4 elem szükséges: `1` = A nyer, `0` = B nyer.

## Futtatás fejlesztéshez

### Backend indítása

```bash
python backend/app.py
```

A backend alapértelmezetten a `http://localhost:5000` címen fut, és az `/api/*` útvonalakat szolgálja ki.

### Frontend kiszolgálása

A frontend a backenddel azonos hoston várja az `/api` végpontot, ezért érdemes reverz proxyt használni (pl. Nginx), vagy a statikus fájlokat ugyanazon a hoston/porton kiszolgálni.

Egyszerű statikus kiszolgálás (API nélkül):

```bash
python -m http.server 8000
```

> Ha a frontendet külön porton szolgálod ki, az `/api` útvonalat proxyzni kell a Flask backendre.

## Admin felület

Az admin oldal: `backend/admin.html`. A bejelentkezési adatok a `frontend/admin.js` fájlban vannak definiálva a `USERS` objektumban. Éles környezetben javasolt ezt a megoldást biztonságosabb hitelesítéssel kiváltani.
