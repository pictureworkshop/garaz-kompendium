# Garaż – kompendium budowy (2 aplikacje PWA)

| Aplikacja | Folder | Do czego |
|---|---|---|
| **Projektant garażu** | `projektant/` | wymiary, ściany, dach, fundamenty, brama/drzwi/okna, położenie na działce, widok 3D, rzut + 4 elewacje + plan sytuacyjny, opis techniczny do zgłoszenia, kosztorys, kontrola przepisów, warianty |
| **Planer budowy** | `planer/` | kreator ścieżki (zgłoszenie / pozwolenie), lista kontrolna dokumentów, harmonogram (Gantt), budżet plan/wydatki, kompendium wiedzy, notatki i kontakty, kopia zapasowa |

Obie aplikacje działają offline, bez serwera i bez kont. Dane trzymane są w przeglądarce (`localStorage`) i są **wspólne**, jeśli obie aplikacje są otwierane z tego samego adresu: Planer sam odczytuje projekt z Projektanta (ścieżka formalna, kosztorys → budżet).

## Uruchomienie lokalnie

```bash
python3 -m http.server 8765
```

Potem otwórz <http://localhost:8765/>. (Plik otwarty bezpośrednio z dysku, `file://`, nie zainstaluje się jako PWA.)

## Instalacja na telefonie

PWA wymaga adresu **https**. Najprościej:

- **GitHub Pages** – wrzuć cały folder do repozytorium → Settings → Pages → branch `main`, folder `/`.
- **Netlify / Cloudflare Pages** – przeciągnij folder na stronę „Deploy” (bez konfiguracji).

Następnie na telefonie: Android/Chrome → menu ⋮ → „Zainstaluj aplikację”; iPhone/Safari → Udostępnij → „Do ekranu początkowego”. Każdą aplikację instaluje się osobno.

Po zmianie plików podbij wersję cache w `planer/sw.js` / `projektant/sw.js` (`CACHE = '...-v2'`).

## Struktura

```
index.html              strona startowa
shared/                 style, wspólne narzędzia, silnik obliczeń (garage-calc.js), ikony, three.js
planer/                 index.html, app.js, content.js (listy kontrolne, harmonogram, kompendium), sw.js, manifest
projektant/             index.html, app.js, drawings.js (SVG), view3d.js (3D), sw.js, manifest
```

Ceny jednostkowe i stawki robocizny są w `shared/garage-calc.js` (`PRICES`) – można je też nadpisać w Projektancie → Kosztorys (✎).

## Zastrzeżenie

Stan prawny: listopad 2026 (Prawo budowlane po nowelizacji z 7.01.2026, reforma planistyczna – plan ogólny od 1.09.2026). Treści i automatyczne kontrole są uproszczone i nie zastępują architekta, geodety ani urzędu. Rysunki to szkice pomocnicze, nie projekt budowlany.
