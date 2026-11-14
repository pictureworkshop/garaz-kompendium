/* Planer – treści: listy kontrolne, szablon harmonogramu, kompendium wiedzy.
   Stan prawny: listopad 2026 (Prawo budowlane po nowelizacji z 7.01.2026, reforma planistyczna). */
'use strict';

const CHECKLISTS = {
  zgloszenie: [
    { phase: 'Rozpoznanie działki', items: [
      { id: 'mpzp', t: 'Sprawdź MPZP i zamów wypis z wyrysem', d: 'Na geoportalu gminy lub w urzędzie gminy sprawdź, czy dla działki obowiązuje miejscowy plan. Zapisz: linię zabudowy, max wysokość, kształt i kąt dachu, kolor pokrycia, wskaźnik zabudowy i powierzchnię biologicznie czynną.' },
      { id: 'kw', t: 'Sprawdź księgę wieczystą', d: 'ekw.ms.gov.pl – właściciel, współwłasność (potrzebna zgoda współwłaścicieli), służebności, ograniczenia.' },
      { id: 'ogr', t: 'Sprawdź ograniczenia terenu', d: 'Rejestr/ewidencja zabytków, Natura 2000, mapy zagrożenia powodziowego (ISOK), strefy linii energetycznych i gazociągów, sieci podziemne na działce.' },
      { id: 'mapa', t: 'Pobierz kopię mapy zasadniczej/ewidencyjnej', d: 'Z PODGiK (starostwo) lub geoportalu – posłuży jako podkład do szkicu sytuacyjnego.' },
      { id: 'granice', t: 'Upewnij się co do przebiegu granic', d: 'Odszukaj znaki graniczne. Przy wątpliwościach zamów wznowienie znaków u geodety – odległości od granic są kluczowe.' },
      { id: 'zjazd', t: 'Zjazd z drogi – czy potrzebny nowy?', d: 'Nowy lub przebudowywany zjazd z drogi publicznej wymaga zezwolenia zarządcy drogi (dla drogi gminnej – wójt/burmistrz). Załatw to przed zgłoszeniem garażu.' },
      { id: 'prad', t: 'Zaplanuj zasilanie', d: 'Najprościej kablem ziemnym z rozdzielnicy domu (osobne zabezpieczenie, wyłącznik różnicowoprądowy). Rozważ zapas pod ładowarkę EV.' },
    ]},
    { phase: 'Dokumentacja do zgłoszenia', items: [
      { id: 'koncepcja', t: 'Opracuj koncepcję w Projektancie', d: 'Wymiary, dach, brama, położenie na działce. Projektant sprawdzi limit 35 m² i odległości od granic.', app: 'projektant' },
      { id: 'szkic', t: 'Szkic sytuacyjny', d: 'Garaż naniesiony na kopię mapy: wymiary zewnętrzne, odległości od granic, od domu i drogi, zjazd, odprowadzenie wody.' },
      { id: 'rysunki', t: 'Rysunki: rzut i elewacje', d: 'Wymiary, wysokość do kalenicy, kąt dachu, otwory, materiały. Projektant → Rysunki → Drukuj.', app: 'projektant' },
      { id: 'opis', t: 'Krótki opis techniczny', d: 'Fundamenty, ściany, dach i pokrycie, brama, kolorystyka, odprowadzenie wód opadowych na własną działkę.' },
      { id: 'zgodnosc', t: 'Porównaj projekt z MPZP', d: 'Linia zabudowy, wysokość, dach, kolory, wskaźniki. Niezgodność = sprzeciw urzędu.' },
      { id: 'uzg', t: 'Uzgodnienia (jeśli dotyczy)', d: 'Konserwator zabytków, zarządca drogi, inne wynikające z położenia działki.' },
    ]},
    { phase: 'Złożenie zgłoszenia', items: [
      { id: 'pb2', t: 'Wypełnij formularz PB-2', d: 'Zgłoszenie budowy: rodzaj, zakres, miejsce, sposób wykonania i planowany termin rozpoczęcia robót.' },
      { id: 'pb5', t: 'Oświadczenie PB-5', d: 'O posiadanym prawie do dysponowania nieruchomością na cele budowlane. Brak PB-5 to częsty powód wezwania do uzupełnienia.' },
      { id: 'zal', t: 'Dołącz załączniki', d: 'Szkice/rysunki, uzgodnienia; pełnomocnictwo + 17 zł opłaty skarbowej, jeśli działa pełnomocnik.' },
      { id: 'zloz', t: 'Złóż zgłoszenie w starostwie', d: 'Osobiście, pocztą lub online przez e-Budownictwo (profil zaufany / e-dowód). Zachowaj potwierdzenie z datą wpływu.' },
      { id: 'uzup', t: 'Reaguj na wezwania do uzupełnienia', d: 'Po uzupełnieniu termin 21 dni na sprzeciw liczony jest od nowa.' },
      { id: '21dni', t: 'Odczekaj 21 dni bez sprzeciwu', d: 'Brak sprzeciwu = milcząca zgoda. Możesz wnioskować o zaświadczenie o braku podstaw do sprzeciwu, by zacząć wcześniej.' },
      { id: '3lata', t: 'Rozpocznij budowę w ciągu 3 lat', d: 'Liczone od terminu rozpoczęcia wskazanego w zgłoszeniu. Później – nowe zgłoszenie.' },
    ]},
    { phase: 'Budowa', items: [
      { id: 'wykonawca', t: 'Umowa z wykonawcą', d: 'Zakres, materiały, terminy, płatności etapami po odbiorach, gwarancja, kary umowne. Poproś o referencje.' },
      { id: 'brama_zam', t: 'Zamów bramę z wyprzedzeniem', d: 'Bramy segmentowe na wymiar: zwykle 4–8 tygodni realizacji. Wymiary otworu i nadproża uzgodnij przed murowaniem.' },
      { id: 'wytyczenie', t: 'Wytyczenie geodezyjne (zalecane)', d: 'Daje pewność zachowania odległości od granic i linii zabudowy.' },
      { id: 'zgodnie', t: 'Buduj zgodnie ze zgłoszeniem', d: 'Istotne zmiany (wymiary, wysokość, położenie) wymagają nowego zgłoszenia.' },
      { id: 'dziennik_wl', t: 'Prowadź własną dokumentację', d: 'Kierownik budowy i dziennik budowy nie są wymagane dla garażu ≤35 m² na zgłoszenie – ale zdjęcia zbrojenia, izolacji i instalacji przydadzą się (zakładka Notatki).' },
    ]},
    { phase: 'Po budowie', items: [
      { id: 'inwent', t: 'Inwentaryzacja powykonawcza (zalecana)', d: 'Geodeta zgłasza budynek do ewidencji gruntów i budynków (EGiB).' },
      { id: 'in1', t: 'Podatek od nieruchomości – informacja IN-1', d: 'Złóż w gminie w ciągu 14 dni od zakończenia budowy lub rozpoczęcia użytkowania.' },
      { id: 'ubezp', t: 'Rozszerz ubezpieczenie o garaż', d: 'Dopisz budynek i ewentualnie wyposażenie (rowery, narzędzia).' },
      { id: 'archiwum', t: 'Zarchiwizuj dokumenty', d: 'Zgłoszenie z datą wpływu, rysunki, faktury, karty gwarancyjne (brama, napęd), protokoły.' },
    ]},
  ],
  pozwolenie: [
    { phase: 'Rozpoznanie działki', items: [
      { id: 'mpzp', t: 'Sprawdź MPZP i zamów wypis z wyrysem', d: 'Ustalenia planu są wiążące dla projektu.' },
      { id: 'wz', t: 'Brak MPZP? – decyzja o warunkach zabudowy', d: 'Od 1.09.2026 nową decyzję WZ wydaje się tylko w gminie z uchwalonym planem ogólnym (co do zasady w obszarze uzupełnienia zabudowy). Od 1.01.2027 wniosek złoży tylko osoba z prawem do dysponowania nieruchomością. Opłata 598 zł, termin do 90 dni.' },
      { id: 'kw', t: 'Sprawdź księgę wieczystą', d: 'Właściciel, współwłasność, służebności.' },
      { id: 'ogr', t: 'Sprawdź ograniczenia terenu', d: 'Zabytki, Natura 2000, tereny zalewowe, strefy sieci.' },
      { id: 'zjazd', t: 'Zjazd z drogi – zezwolenie zarządcy', d: 'Jeśli potrzebny nowy zjazd – złóż wniosek do zarządcy drogi na wczesnym etapie.' },
    ]},
    { phase: 'Projekt budowlany', items: [
      { id: 'koncepcja', t: 'Koncepcja w Projektancie', d: 'Przygotuj założenia dla architekta: wymiary, dach, brama, położenie, budżet.', app: 'projektant' },
      { id: 'architekt', t: 'Wybierz architekta z uprawnieniami', d: 'Projekt indywidualny lub adaptacja gotowego projektu garażu.' },
      { id: 'mapaproj', t: 'Mapa do celów projektowych', d: 'Zamawia geodeta, zwykle 2–6 tygodni.' },
      { id: 'geotech', t: 'Opinia geotechniczna', d: 'Określa warunki gruntowe i kategorię geotechniczną.' },
      { id: 'pzd', t: 'Projekt zagospodarowania działki (PZD) + architektoniczno-budowlany (PAB)', d: 'Te części składa się z wnioskiem o pozwolenie.' },
      { id: 'pt', t: 'Projekt techniczny (PT)', d: 'Nie składa się do urzędu, ale musi być gotowy przed rozpoczęciem robót.' },
      { id: 'uzg', t: 'Uzgodnienia i opinie', d: 'Konserwator, zarządca drogi, inne – jeśli wymagane.' },
    ]},
    { phase: 'Wniosek o pozwolenie', items: [
      { id: 'pb1', t: 'Wniosek PB-1 + oświadczenie PB-5', d: 'Z projektem (papierowo 3 egz. lub elektronicznie), decyzją WZ (jeśli dotyczy), uzgodnieniami.' },
      { id: 'oplata', t: 'Opłata skarbowa', d: 'Dla budynku innego niż mieszkalny zwykle 48 zł – potwierdź w urzędzie. Pełnomocnictwo: 17 zł.' },
      { id: 'zloz', t: 'Złóż wniosek (urząd lub e-Budownictwo)', d: 'Zachowaj potwierdzenie złożenia.' },
      { id: '65dni', t: 'Decyzja – do 65 dni', d: 'Za przekroczenie terminu organ płaci karę. Możliwe wezwania do uzupełnień.' },
      { id: 'ostateczna', t: 'Decyzja ostateczna', d: '14 dni od doręczenia stronom; szybciej, jeśli wszystkie strony zrzekną się prawa do odwołania.' },
      { id: '3lata', t: 'Ważność pozwolenia', d: 'Wygasa, jeśli budowa nie rozpocznie się w ciągu 3 lat albo zostanie przerwana na ponad 3 lata.' },
    ]},
    { phase: 'Przed rozpoczęciem robót', items: [
      { id: 'kierownik', t: 'Kierownik budowy', d: 'Umowa i oświadczenie o przyjęciu obowiązków.' },
      { id: 'edb', t: 'Dziennik budowy', d: 'Elektroniczny (EDB) w e-Budownictwie; papierowy możliwy do końca 2031 r.' },
      { id: 'zawiad', t: 'Zawiadomienie o rozpoczęciu robót', d: 'Do nadzoru budowlanego (PINB) co najmniej 7 dni przed startem, z oświadczeniem kierownika budowy.' },
      { id: 'tablica', t: 'Tablica informacyjna budowy', d: 'Na czas budowy, widoczna z drogi.' },
      { id: 'wytyczenie', t: 'Wytyczenie geodezyjne (obowiązkowe)', d: 'Geodeta wpisuje wytyczenie do dziennika budowy.' },
      { id: 'wykonawca', t: 'Umowa z wykonawcą, zamówienie bramy', d: 'Bramy na wymiar: 4–8 tygodni realizacji.' },
    ]},
    { phase: 'Budowa i zakończenie', items: [
      { id: 'odbiory', t: 'Odbiory częściowe przez kierownika', d: 'Zbrojenie i fundamenty przed zalaniem, izolacje, więźba.' },
      { id: 'inwent', t: 'Inwentaryzacja powykonawcza (obowiązkowa)', d: 'Geodeta, do ewidencji budynków.' },
      { id: 'pb16', t: 'Zawiadomienie o zakończeniu budowy (PB-16)', d: 'Do PINB z dziennikiem, oświadczeniem kierownika i inwentaryzacją. Użytkowanie możliwe, jeśli organ nie wniesie sprzeciwu w 14 dni.' },
      { id: 'in1', t: 'Podatek od nieruchomości – IN-1', d: 'W gminie w ciągu 14 dni.' },
      { id: 'archiwum', t: 'Zarchiwizuj dokumenty', d: 'Decyzja, projekt, dziennik, faktury, gwarancje.' },
    ]},
  ],
};

/* Szablon harmonogramu. deps = zadania, które muszą się zakończyć; wait = przerwa technologiczna */
const SCHEDULE = {
  zgloszenie: [
    { id: 'f1', name: 'Rozpoznanie działki: MPZP, KW, mapa', dur: 14, deps: [], ph: 'f' },
    { id: 'f2', name: 'Koncepcja i rysunki do zgłoszenia', dur: 14, deps: ['f1'], ph: 'f' },
    { id: 'f3', name: 'Złożenie zgłoszenia + 21 dni (z doręczeniem)', dur: 28, deps: ['f2'], ph: 'f' },
    { id: 'f4', name: 'Wybór wykonawcy, zamówienie bramy', dur: 35, deps: ['f2'], ph: 'f' },
  ],
  pozwolenie: [
    { id: 'p0', name: 'Decyzja WZ (gdy brak MPZP)', dur: 90, deps: [], ph: 'f', ifNoMpzp: true },
    { id: 'p1', name: 'Mapa do celów projektowych, geotechnika', dur: 30, deps: ['p0'], ph: 'f' },
    { id: 'p2', name: 'Projekt budowlany (PZD + PAB + PT)', dur: 45, deps: ['p1'], ph: 'f' },
    { id: 'p3', name: 'Wniosek i decyzja o pozwoleniu', dur: 65, deps: ['p2'], ph: 'f' },
    { id: 'p4', name: 'Decyzja ostateczna (14 dni)', dur: 14, deps: ['p3'], ph: 'f' },
    { id: 'p5', name: 'Kierownik, dziennik, zawiadomienie (7 dni)', dur: 10, deps: ['p4'], ph: 'f' },
    { id: 'f4', name: 'Wybór wykonawcy, zamówienie bramy', dur: 35, deps: ['p3'], ph: 'f' },
  ],
  budowa: [
    { id: 'b1', name: 'Wytyczenie, zdjęcie humusu, przygotowanie terenu', dur: 3, deps: ['FORMAL'], ph: 'b' },
    { id: 'b2', name: 'Wykop i ławy fundamentowe / płyta', dur: 5, deps: ['b1'], ph: 'b', concrete: true },
    { id: 'b3', name: 'Dojrzewanie betonu', dur: 7, deps: ['b2'], ph: 'b', wait: true },
    { id: 'b4', name: 'Ściany fundamentowe, izolacja, zasypka', dur: 5, deps: ['b3'], ph: 'b' },
    { id: 'b5', name: 'Ściany nośne (murowanie)', dur: 6, deps: ['b4'], ph: 'b' },
    { id: 'b6', name: 'Nadproża i wieniec', dur: 3, deps: ['b5'], ph: 'b', concrete: true },
    { id: 'b7', name: 'Dojrzewanie wieńca', dur: 7, deps: ['b6'], ph: 'b', wait: true },
    { id: 'b8', name: 'Więźba dachowa', dur: 3, deps: ['b7'], ph: 'b' },
    { id: 'b9', name: 'Pokrycie dachu, obróbki, rynny', dur: 5, deps: ['b8'], ph: 'b' },
    { id: 'b10', name: 'Posadzka betonowa', dur: 2, deps: ['b9'], ph: 'b', concrete: true },
    { id: 'b11', name: 'Dojrzewanie posadzki', dur: 14, deps: ['b10'], ph: 'b', wait: true },
    { id: 'b12', name: 'Instalacja elektryczna', dur: 3, deps: ['b9'], ph: 'b' },
    { id: 'b13', name: 'Elewacja / tynki', dur: 7, deps: ['b9'], ph: 'b' },
    { id: 'b14', name: 'Montaż bramy, drzwi i okien', dur: 2, deps: ['b11', 'f4'], ph: 'b' },
    { id: 'b15', name: 'Opaska, podjazd, porządki', dur: 5, deps: ['b13', 'b14'], ph: 'b' },
    { id: 'b16', name: 'Inwentaryzacja, IN-1 (i PB-16 przy pozwoleniu)', dur: 14, deps: ['b15'], ph: 'b' },
  ],
};

const BUDGET_CATS = ['Formalności', 'Fundamenty', 'Posadzka', 'Ściany', 'Dach', 'Stolarka i brama', 'Instalacje', 'Wykończenie', 'Inne'];

/* Kompendium wiedzy */
const ARTICLES = [
  { id: 'sciezka', title: 'Jaka ścieżka formalna dla garażu?', icon: 'route', html: `
<p>Wszystko zależy od <b>powierzchni zabudowy</b> (obrys zewnętrzny ścian na gruncie – okapy dachu się nie wliczają), tego, czy garaż jest <b>wolnostojący</b> i <b>parterowy</b>, oraz od liczby małych obiektów na działce.</p>
<table><thead><tr><th>Sytuacja</th><th>Tryb</th></tr></thead><tbody>
<tr><td>Wolnostojący, parterowy garaż ≤ 35 m² (max 2 takie obiekty na każde 500 m² działki)</td><td><span class="badge ok">Zgłoszenie</span></td></tr>
<tr><td>Wolnostojący garaż &gt; 35 m²</td><td><span class="badge warn">Pozwolenie na budowę</span></td></tr>
<tr><td>Garaż dobudowany do domu (rozbudowa domu)</td><td><span class="badge warn">Pozwolenie</span> lub zgłoszenie z projektem, jeżeli dom spełnia warunki art. 29 ust. 1 pkt 1</td></tr>
<tr><td>Garaż blaszany na stałe</td><td><span class="badge ok">Zgłoszenie</span> (te same limity co murowany)</td></tr>
<tr><td>Tymczasowy obiekt niezwiązany trwale z gruntem, do 180 dni</td><td><span class="badge ok">Zgłoszenie</span> z terminem rozbiórki/przeniesienia</td></tr>
</tbody></table>
<div class="callout">Nowelizacja Prawa budowlanego obowiązująca od <b>7 stycznia 2026 r.</b> rozszerzyła listę obiektów bez formalności (m.in. tarasy, małe baseny, zbiorniki na deszczówkę), ale <b>garaż do 35 m² nadal wymaga zgłoszenia</b>.</div>
<h3>Zgłoszenie – jak to działa</h3>
<ul><li>Składasz w starostwie (lub urzędzie miasta na prawach powiatu) formularz <b>PB-2</b> + oświadczenie <b>PB-5</b> + szkice/rysunki.</li>
<li>Urząd ma <b>21 dni</b> na sprzeciw. Brak sprzeciwu = możesz budować („milcząca zgoda”).</li>
<li>Urząd może nałożyć obowiązek uzyskania pozwolenia, np. gdy budowa narusza MPZP lub dotyczy obszaru Natura 2000.</li>
<li>Dla garażu na zgłoszenie <b>nie jest wymagany</b> kierownik budowy, dziennik budowy ani zawiadomienie o zakończeniu.</li></ul>
<h3>Pozwolenie na budowę</h3>
<ul><li>Potrzebny projekt budowlany od architekta z uprawnieniami (PZD + PAB składane z wnioskiem PB-1; projekt techniczny przed rozpoczęciem robót).</li>
<li>Urząd ma 65 dni na decyzję; decyzja staje się ostateczna po 14 dniach od doręczenia.</li>
<li>Wymagany kierownik budowy, dziennik budowy, zawiadomienie o rozpoczęciu robót (7 dni wcześniej) i o zakończeniu budowy.</li></ul>
<div class="callout warn">Pomysł „2 garaże po 35 m² obok siebie” jako sposób na obejście limitu jest ryzykowny – jeżeli tworzą jeden budynek funkcjonalnie, urząd potraktuje je jako jeden obiekt.</div>` },

  { id: 'mpzp', title: 'MPZP, warunki zabudowy i plan ogólny (2026)', icon: 'map', html: `
<p><b>Miejscowy plan zagospodarowania przestrzennego (MPZP)</b> jest prawem miejscowym – garaż musi być z nim zgodny, nawet jeśli budujesz na zgłoszenie. Najczęściej plan określa:</p>
<ul><li>nieprzekraczalną linię zabudowy od drogi,</li><li>maksymalną wysokość budynków gospodarczych/garażowych,</li><li>geometrię dachu (kąt nachylenia, liczba połaci) i kolor pokrycia,</li><li>wskaźnik powierzchni zabudowy i minimalny udział powierzchni biologicznie czynnej,</li><li>możliwość sytuowania budynków przy granicy.</li></ul>
<p>Sprawdzisz to w geoportalu gminy; oficjalnie – zamawiając <b>wypis i wyrys</b> z planu w urzędzie gminy.</p>
<h3>Brak planu</h3>
<p>Przy <b>zgłoszeniu</b> garażu decyzja o warunkach zabudowy (WZ) nie jest wymagana. Przy <b>pozwoleniu na budowę</b> bez MPZP potrzebujesz decyzji WZ.</p>
<div class="callout warn"><b>Reforma planistyczna:</b> od <b>1 września 2026 r.</b> nową decyzję WZ wydaje się tylko w gminach, które uchwaliły <b>plan ogólny</b>, i co do zasady w wyznaczonym w nim <b>obszarze uzupełnienia zabudowy</b>. Wnioski złożone przed tą datą rozpatruje się na starych zasadach. Od 1.01.2027 o WZ może wystąpić tylko osoba z prawem do dysponowania nieruchomością. Sprawdź stan planu ogólnego w swojej gminie!</div>` },

  { id: 'odleglosci', title: 'Odległości od granic, drogi i domu', icon: 'ruler', html: `
<p>Podstawa: <b>§12 rozporządzenia w sprawie warunków technicznych (WT)</b>. Odległość mierzy się od ściany (lica zewnętrznego), nie od okapu.</p>
<table><thead><tr><th>Ściana zwrócona do sąsiada</th><th>Min. odległość</th></tr></thead><tbody>
<tr><td>z oknami lub drzwiami (brama też jest otworem!)</td><td><b>4 m</b></td></tr>
<tr><td>bez otworów</td><td><b>3 m</b></td></tr>
<tr><td>bez otworów – gdy pozwala MPZP</td><td>1,5 m lub bezpośrednio przy granicy</td></tr>
<tr><td>działka węższa niż 16 m</td><td>z otworami 3 m; bez otworów 1,5 m lub przy granicy</td></tr>
<tr><td>sąsiad ma budynek ścianą przy granicy</td><td>możliwe przy granicy (z zachowaniem warunków §12 ust. 3)</td></tr></tbody></table>
<div class="callout">Odległość pomiędzy 0 a 1,5 m od granicy jest niedopuszczalna – albo „na granicy”, albo co najmniej 1,5 m. Przy granicy ściana musi spełniać wymagania ppoż. (ściana oddzielenia).</div>
<h3>Od drogi</h3>
<ul><li>Linia zabudowy z MPZP/WZ jest najważniejsza.</li>
<li>Ustawa o drogach publicznych – minimalna odległość od zewnętrznej krawędzi jezdni w terenie zabudowy: gminna 6 m, powiatowa i wojewódzka 8 m, krajowa 10 m (mniej tylko za zgodą zarządcy drogi).</li></ul>
<h3>Woda i śnieg</h3>
<p>Woda opadowa z dachu nie może spływać na działkę sąsiada (§28 WT). Przy ścianie blisko granicy kieruj spadek dachu do środka działki i zaplanuj rynny. Okap nie może wystawać za granicę.</p>
<h3>Od domu i okien</h3>
<p>W zabudowie jednorodzinnej na jednej działce przepisy nie wymagają zwykle odstępu ppoż. między domem a garażem. Zostaw jednak miejsce na przejście, rynny i zsuwający się śnieg. Odległości od miejsc postojowych do okien (§19 WT) mają złagodzenia dla zabudowy jednorodzinnej – sprawdź w razie wątpliwości z projektantem.</p>` },

  { id: 'zjazd', title: 'Zjazd z drogi i podjazd', icon: 'route', html: `
<ul><li>Nowy zjazd z drogi publicznej (lub przebudowa istniejącego) wymaga <b>zezwolenia zarządcy drogi na lokalizację zjazdu</b>. Dla drogi gminnej – wójt/burmistrz/prezydent, powiatowej – zarząd powiatu.</li>
<li>Budowa zjazdu indywidualnego zwykle wymaga zgłoszenia; warunki techniczne (szerokość, przepust w rowie) określa zarządca.</li>
<li>Podjazd na własnej działce (kostka, żwir) nie wymaga formalności, ale wlicza się do powierzchni utwardzonej – pilnuj wskaźnika powierzchni biologicznie czynnej z MPZP.</li>
<li>Spadek podjazdu odprowadzaj od bramy; przy bramie rozważ odwodnienie liniowe.</li></ul>` },

  { id: 'wymiary', title: 'Wymiary garażu i bramy – ergonomia', icon: 'gate', html: `
<table><thead><tr><th></th><th>Minimum</th><th>Wygodnie</th></tr></thead><tbody>
<tr><td>Szerokość wewn. – 1 auto</td><td>3,0 m</td><td>3,5–4,0 m</td></tr>
<tr><td>Szerokość wewn. – 2 auta</td><td>5,5 m</td><td>6,0–6,5 m</td></tr>
<tr><td>Długość wewnętrzna</td><td>5,4 m</td><td>6,0 m + (regały, rowery)</td></tr>
<tr><td>Brama – 1 auto (szer.)</td><td>2,4 m</td><td>2,5–3,0 m</td></tr>
<tr><td>Brama – 2 auta (szer.)</td><td>4,5 m</td><td>5,0 m</td></tr>
<tr><td>Brama – wysokość</td><td>2,0 m</td><td>2,125–2,25 m (SUV, box dachowy)</td></tr>
</tbody></table>
<div class="callout"><b>Limit 35 m²</b> to obrys zewnętrzny: np. 5,8 × 6,0 m = 34,8 m². Przy ścianach 24 cm wnętrze ma ok. 5,3 × 5,5 m – wystarczy na jedno auto z dużym zapasem lub na dwa małe auta „na styk”.</div>
<p>Brama segmentowa potrzebuje ok. 20–30 cm nadproża nad otworem na prowadnice i ok. 10–15 cm węgarków po bokach. Wysokość ściany = otwór + nadproże + wieniec.</p>` },

  { id: 'fundamenty', title: 'Fundamenty i strefy przemarzania', icon: 'cube', html: `
<p>Spód fundamentu musi być poniżej głębokości przemarzania gruntu (PN-81/B-03020):</p>
<table><thead><tr><th>Strefa</th><th>Głębokość</th><th>Rejon</th></tr></thead><tbody>
<tr><td>I</td><td>0,8 m</td><td>zachodnia Polska</td></tr><tr><td>II</td><td>1,0 m</td><td>centrum, Pomorze, południe</td></tr>
<tr><td>III</td><td>1,2 m</td><td>wschodnia Polska</td></tr><tr><td>IV</td><td>1,4 m</td><td>Suwalszczyzna</td></tr></tbody></table>
<h3>Ławy fundamentowe (klasycznie)</h3>
<ul><li>Ława żelbetowa ok. 50 × 30 cm (4 pręty Ø12, strzemiona Ø6 co 30 cm), beton C20/25.</li>
<li>Ściana fundamentowa z bloczków betonowych 38×24×12 do poziomu posadzki, izolacja przeciwwilgociowa pozioma i pionowa.</li>
<li>Wewnątrz zagęszczona podsypka piaskowa (warstwami co 20–30 cm) i posadzka betonowa.</li></ul>
<h3>Płyta fundamentowa</h3>
<ul><li>Szybsza, równa „od razu” posadzka, dobra na słabszych gruntach.</li><li>Wymaga ocieplenia XPS pod spodem i po obwodzie (tzw. płyta ocieplona) – wtedy nie trzeba schodzić poniżej strefy przemarzania; projekt konstruktora wskazany.</li></ul>
<div class="callout warn">Nie betonuj, gdy temperatura spada poniżej +5°C bez dodatków zimowych i osłon. Najlepszy okres na fundamenty: kwiecień–październik.</div>` },

  { id: 'sciany', title: 'Ściany – porównanie materiałów', icon: 'plan', html: `
<table><thead><tr><th>Materiał</th><th>Plusy</th><th>Minusy</th></tr></thead><tbody>
<tr><td>Bloczek betonowy 38×24×12</td><td>tani, wytrzymały, odporny na wilgoć</td><td>ciężki, dużo sztuk (~20/m²), zimny</td></tr>
<tr><td>Beton komórkowy 24</td><td>szybkie murowanie na klej, ciepły, łatwa obróbka</td><td>droższy, wymaga dobrej ochrony elewacji</td></tr>
<tr><td>Silikat 24</td><td>bardzo wytrzymały, akustyka, precyzyjny</td><td>ciężki, zimny</td></tr>
<tr><td>Pustak ceramiczny 25</td><td>dobra izolacyjność, „oddycha”</td><td>kruchy przy obróbce, drobne elementy dociętne</td></tr>
<tr><td>Szkielet drewniany</td><td>szybko, lekko, mniejszy fundament, sucha budowa</td><td>ochrona ppoż. i przed wilgocią, trwałość zależna od wykonania</td></tr>
<tr><td>Stal + płyta warstwowa</td><td>bardzo szybko, prefabrykacja</td><td>wygląd, MPZP bywa restrykcyjne co do wyglądu</td></tr></tbody></table>
<p>Nad otworami potrzebne są <b>nadproża</b> (prefabrykowane L19 albo belka żelbetowa nad szeroką bramą – wg obliczeń), a na koronie ścian <b>wieniec żelbetowy</b>, do którego mocuje się murłatę.</p>
<p><b>Czy ocieplać?</b> Garaż nieogrzewany – zwykle nie (wystarczy tynk). Jeżeli będzie warsztat lub dogrzewanie – 10–15 cm styropianu na ścianach, wełna w dachu i ocieplona posadzka/płyta.</p>` },

  { id: 'dach', title: 'Dach, pokrycie i odwodnienie', icon: 'home', html: `
<ul><li><b>Dwuspadowy</b> – klasyka, pasuje do domu, poddasze na składowanie. Kąt zwykle 20–40° (często narzucony przez MPZP).</li>
<li><b>Jednospadowy</b> – prosty i tani, dobry przy granicy (spadek do wnętrza działki!).</li>
<li><b>Czterospadowy (kopertowy)</b> – estetyczny, droższy, więcej obróbek.</li>
<li><b>Płaski</b> – nowoczesny, wymaga starannej hydroizolacji (papa 2×, EPDM) i spadku min. 2–3%.</li></ul>
<p>Pokrycie lekkie (blachodachówka, trapez) pozwala na lżejszą więźbę; dachówka ceramiczna wymaga mocniejszej konstrukcji. Pod blachę stosuj membranę paroprzepuszczalną – ogranicza skraplanie i kapanie na auto.</p>
<div class="callout">Całkowita wysokość (do kalenicy) musi zmieścić się w limicie MPZP – Projektant liczy ją automatycznie.</div>` },

  { id: 'brama', title: 'Brama garażowa – wybór', icon: 'gate', html: `
<table><thead><tr><th>Typ</th><th>Zalety</th><th>Uwagi</th></tr></thead><tbody>
<tr><td>Segmentowa</td><td>szczelna, ocieplona, nie zabiera miejsca przed garażem</td><td>potrzebuje nadproża 20–30 cm i miejsca pod sufitem na prowadnice</td></tr>
<tr><td>Uchylna</td><td>tania, mało nadproża</td><td>wystaje przed garaż przy otwieraniu, słabsza izolacja</td></tr>
<tr><td>Roletowa</td><td>idealna przy małej przestrzeni pod sufitem</td><td>skrzynka nad otworem, droższa</td></tr>
<tr><td>Rozwierana</td><td>prosta, klasyczny wygląd</td><td>wymaga miejsca na skrzydła, wiatr</td></tr></tbody></table>
<p>Zamów bramę po wymurowaniu otworu (wymiary rzeczywiste) lub ustal wymiary z dostawcą przed murowaniem. Napęd z fotokomórką i awaryjnym odblokowaniem – jeśli garaż ma tylko bramę, rozważ drzwi wejściowe lub furtkę w bramie.</p>` },

  { id: 'posadzka', title: 'Posadzka', icon: 'plan', html: `
<ul><li>Warstwy (od dołu): zagęszczony piasek → (opcjonalnie chudziak) → folia PE → beton C20/25 10–15 cm zbrojony siatką → zatarcie mechaniczne (lub posadzka przemysłowa z posypką utwardzającą).</li>
<li>Spadek 1–1,5% w kierunku bramy lub odpływu liniowego – woda i śnieg z auta.</li>
<li>Dylatacje: obwodowa przy ścianach i nacinanie pól co ok. 4–5 m.</li>
<li>Beton osiąga pełną wytrzymałość po ok. 28 dniach – auto wjeżdża najwcześniej po 2–3 tygodniach (pielęgnuj beton – polewanie, folia).</li></ul>` },

  { id: 'instalacje', title: 'Prąd, ładowarka EV, wentylacja', icon: 'gear', html: `
<ul><li>Zasilanie z domu kablem ziemnym (np. YKY 5×6 mm² przy planach EV / siły) w rurze osłonowej, na głębokości ok. 70 cm, z taśmą ostrzegawczą.</li>
<li>W garażu: mała rozdzielnica, wyłącznik różnicowoprądowy, gniazda co najmniej IP44, oświetlenie LED; rozważ gniazdo 400 V.</li>
<li><b>Ładowarka EV</b> (wallbox 11 kW) – zwykle wymaga przyłącza trójfazowego o mocy co najmniej 11–14 kW; sprawdź moc przyłączeniową domu. Przewód przeciągnij już teraz, nawet jeśli wallbox kupisz później.</li>
<li><b>Wentylacja</b>: kratka nawiewna nisko (np. w bramie lub ścianie) i wywiewna wysoko po przeciwnej stronie – usuwa wilgoć i spaliny, chroni auto przed korozją.</li>
<li>Instalację wykonuje elektryk z uprawnieniami SEP i wykonuje pomiary (protokół – ważny dla ubezpieczyciela).</li></ul>` },

  { id: 'koszty', title: 'Koszty i jak oszczędzać', icon: 'wallet', html: `
<p>Orientacyjnie (2026): murowany garaż ~35 m² „pod klucz” z bramą segmentową z napędem to ok. <b>70–110 tys. zł</b> z robocizną; stan surowy zamknięty ok. 45–70 tys. zł. Garaż blaszany/drewniany prefabrykowany – od kilku do kilkudziesięciu tys. zł.</p>
<ul><li>Kupuj materiały poza sezonem (zima) i w pakietach (bloczki, beton z jednej betoniarni).</li>
<li>Prosty dach (jedno- lub dwuspadowy) i jedna duża brama zamiast dwóch.</li>
<li>Część prac zrób samodzielnie: rozbiórki, wykończenie, opaska, malowanie.</li>
<li>Zostaw 10–15% rezerwy – zawsze coś wyjdzie (grunt, wywóz ziemi, ceny stali).</li>
<li>Płać wykonawcy etapami po odbiorze, nie z góry za całość.</li></ul>
<p>Szczegółowy kosztorys z Twojego projektu policzy Projektant, a Planer zaimportuje go do budżetu.</p>` },

  { id: 'podatek', title: 'Podatek, ewidencja i ubezpieczenie', icon: 'doc', html: `
<ul><li>Garaż to budynek – podlega <b>podatkowi od nieruchomości</b>. Złóż informację <b>IN-1</b> w gminie w ciągu 14 dni od zakończenia budowy lub rozpoczęcia użytkowania (co nastąpi pierwsze).</li>
<li>Stawka zależy od uchwały gminy (garaże zwykle jako „pozostałe budynki”, liczone od m² powierzchni użytkowej).</li>
<li><b>Inwentaryzacja geodezyjna</b> powykonawcza – obowiązkowa przy pozwoleniu, przy zgłoszeniu zalecana; dzięki niej budynek trafia do ewidencji (EGiB) i nie ma rozbieżności przy sprzedaży czy kredycie.</li>
<li>Dopisz garaż do polisy domu.</li></ul>` },

  { id: 'samowola', title: 'Samowola budowlana – czego unikać', icon: 'alert', html: `
<ul><li>Budowa bez zgłoszenia/pozwolenia lub przed upływem 21 dni = samowola. Legalizacja jest możliwa, ale wiąże się z <b>opłatą legalizacyjną</b> (dla obiektów na zgłoszenie zwykle 5 000 zł, na pozwolenie znacznie więcej) i kosztami dokumentacji.</li>
<li>Istotne odstąpienie od zgłoszenia (inne wymiary, położenie, wysokość) – też problem. Od 2026 r. przy odstępstwach od projektu nadzór może najpierw udzielić „żółtej kartki” z nakazem przywrócenia zgodności.</li>
<li>Obiekty ukończone co najmniej 10 lat temu można zalegalizować w uproszczonym trybie – ale nie planuj na tym!</li></ul>
<h3>Najczęstsze błędy przy garażach</h3>
<ol><li>34,9 m² „na papierze”, a w rzeczywistości 36 m² (ocieplenie, tynk) – licz z ociepleniem!</li>
<li>Okno w ścianie 3 m od granicy (wymagane 4 m).</li><li>Dach spuszczający wodę na sąsiada.</li>
<li>Za niskie nadproże pod bramę segmentową.</li><li>Brak zapasu przewodów na EV i oświetlenie zewnętrzne.</li>
<li>Posadzka bez spadku i bez dylatacji – pęknięcia i kałuże.</li></ol>` },

  { id: 'slownik', title: 'Słowniczek', icon: 'book', html: `
<dl class="kv" style="grid-template-columns: 1fr; text-align:left">
<dt><b>MPZP</b></dt><dd style="text-align:left;font-weight:400">Miejscowy plan zagospodarowania przestrzennego – prawo miejscowe określające, co i jak można budować.</dd>
<dt><b>WZ</b></dt><dd style="text-align:left;font-weight:400">Decyzja o warunkach zabudowy – zastępuje MPZP dla konkretnej inwestycji, gdy planu brak.</dd>
<dt><b>Plan ogólny</b></dt><dd style="text-align:left;font-weight:400">Nowy obowiązkowy akt gminy (zastąpił studium); od 1.09.2026 warunek wydania nowej WZ.</dd>
<dt><b>PB-1 / PB-2 / PB-5 / PB-16</b></dt><dd style="text-align:left;font-weight:400">Wniosek o pozwolenie / zgłoszenie budowy / oświadczenie o prawie do dysponowania nieruchomością / zawiadomienie o zakończeniu budowy.</dd>
<dt><b>Powierzchnia zabudowy</b></dt><dd style="text-align:left;font-weight:400">Rzut zewnętrznych krawędzi budynku na teren (bez okapów, schodów zewnętrznych).</dd>
<dt><b>PZD, PAB, PT</b></dt><dd style="text-align:left;font-weight:400">Części projektu budowlanego: zagospodarowanie działki, architektoniczno-budowlany, techniczny.</dd>
<dt><b>PINB</b></dt><dd style="text-align:left;font-weight:400">Powiatowy inspektorat nadzoru budowlanego.</dd>
<dt><b>EGiB</b></dt><dd style="text-align:left;font-weight:400">Ewidencja gruntów i budynków prowadzona przez starostę.</dd>
<dt><b>Wieniec</b></dt><dd style="text-align:left;font-weight:400">Żelbetowy pas na koronie ścian, wiąże je i przenosi obciążenia dachu.</dd>
<dt><b>Murłata</b></dt><dd style="text-align:left;font-weight:400">Belka kotwiona do wieńca, na której opierają się krokwie.</dd>
<dt><b>Ława fundamentowa</b></dt><dd style="text-align:left;font-weight:400">Żelbetowy pas pod ścianami przenoszący obciążenie na grunt.</dd>
</dl>` },
];

const DISCLAIMER = 'Treści mają charakter informacyjny (stan: listopad 2026) i nie zastępują porady architekta ani urzędu. Przed złożeniem dokumentów zweryfikuj aktualne przepisy, wzory formularzy (e-Budownictwo) i MPZP swojej działki.';
