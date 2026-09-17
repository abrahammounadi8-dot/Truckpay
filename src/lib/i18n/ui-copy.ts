import { translateDiagnosticSpanish } from "./diagnostics-es";
import type { Locale } from "./config";
import { interpolate } from "./lookup";
/** Columns: en, es, pl, pt, lt, ro, ru. */
export const uiCopy = [
  [
    "Directory",
    "Directorio",
    "Katalog",
    "Diretório",
    "Katalogas",
    "Director",
    "Каталог"
  ],
  [
    "Company site",
    "Web de la empresa",
    "Strona firmy",
    "Site da empresa",
    "Įmonės svetainė",
    "Site-ul companiei",
    "Сайт компании"
  ],
  [
    "Driver reported",
    "Declarado por conductores",
    "Zgłoszone przez kierowców",
    "Declarado por motoristas",
    "Vairuotojų pateikta",
    "Raportat de șoferi",
    "Данные водителей"
  ],
  [
    "File a wage slip",
    "Publicar datos salariales",
    "Dodaj dane płacowe",
    "Publicar dados salariais",
    "Pateikti atlygio duomenis",
    "Publică date salariale",
    "Добавить данные о зарплате"
  ],
  [
    "File wage slip",
    "Publicar datos salariales",
    "Dodaj dane płacowe",
    "Publicar dados salariais",
    "Pateikti atlygio duomenis",
    "Publică date salariale",
    "Добавить данные о зарплате"
  ],
  [
    "In compare",
    "En comparación",
    "W porównaniu",
    "Na comparação",
    "Lyginama",
    "În comparație",
    "В сравнении"
  ],
  [
    "Compare",
    "Comparar",
    "Porównaj",
    "Comparar",
    "Palyginti",
    "Compară",
    "Сравнить"
  ],
  [
    "Driver-reported stubs",
    "Datos aportados por conductores",
    "Dane płacowe kierowców",
    "Dados fornecidos por motoristas",
    "Vairuotojų atlygio duomenys",
    "Date salariale de la șoferi",
    "Зарплатные данные водителей"
  ],
  [
    "Quoted vs take-home",
    "Prometido frente a cobrado",
    "Obiecane a na rękę",
    "Prometido e recebido",
    "Žadėta ir išmokėta",
    "Promis față de încasat",
    "Обещано и получено"
  ],
  [
    "Public facts",
    "Información pública",
    "Informacje publiczne",
    "Informações públicas",
    "Vieši faktai",
    "Informații publice",
    "Открытые сведения"
  ],
  [
    "Taken from the operator’s own site. Not a review.",
    "Datos de la web de la empresa; no son una reseña.",
    "Dane ze strony przewoźnika, nie opinia.",
    "Dados do site da empresa; não são uma avaliação.",
    "Duomenys iš įmonės svetainės, ne atsiliepimas.",
    "Date de pe site-ul companiei, nu o recenzie.",
    "Сведения с сайта компании, не отзыв."
  ],
  [
    "Headquarters",
    "Sede",
    "Siedziba",
    "Sede",
    "Būstinė",
    "Sediu",
    "Штаб-квартира"
  ],
  [
    "Fleet notes",
    "Información de la flota",
    "Informacje o flocie",
    "Informações da frota",
    "Informacija apie parką",
    "Informații despre flotă",
    "Сведения об автопарке"
  ],
  [
    "Not stated publicly",
    "No publicado",
    "Nie podano publicznie",
    "Não publicado",
    "Viešai nenurodyta",
    "Nepublicat",
    "Не опубликовано"
  ],
  [
    "Typical work",
    "Trabajo habitual",
    "Typowa praca",
    "Trabalho habitual",
    "Įprastas darbas",
    "Activitate obișnuită",
    "Обычная работа"
  ],
  [
    "Equipment",
    "Equipamiento",
    "Sprzęt",
    "Equipamento",
    "Įranga",
    "Echipament",
    "Оборудование"
  ],
  [
    "Driver-reported wage slips",
    "Datos salariales de conductores",
    "Dane płacowe od kierowców",
    "Dados salariais dos motoristas",
    "Vairuotojų pateikti atlygio duomenys",
    "Date salariale raportate de șoferi",
    "Зарплатные данные от водителей"
  ],
  [
    "Public stubs only. Private My TruckPay payslips never appear here.",
    "Solo datos públicos. Las nóminas privadas de Mi TruckPay nunca aparecen aquí.",
    "Tylko dane publiczne. Prywatne paski My TruckPay nigdy się tu nie pojawiają.",
    "Apenas dados públicos. Os recibos privados do My TruckPay nunca aparecem aqui.",
    "Tik vieši duomenys. Privatūs My TruckPay algalapiai čia nerodomi.",
    "Doar date publice. Fluturașii privați My TruckPay nu apar niciodată aici.",
    "Только открытые данные. Личные расчётные листки My TruckPay здесь не публикуются."
  ],
  [
    "No slips on file",
    "Todavía no hay registros",
    "Brak danych płacowych",
    "Ainda sem registos",
    "Įrašų dar nėra",
    "Nu există înregistrări",
    "Записей пока нет"
  ],
  [
    "Awaiting the first wage slip",
    "Esperando el primer registro salarial",
    "Oczekiwanie na pierwsze dane płacowe",
    "À espera do primeiro registo salarial",
    "Laukiama pirmų atlygio duomenų",
    "Se așteaptă prima înregistrare salarială",
    "Ожидаются первые данные о зарплате"
  ],
  [
    "Open file",
    "Ver ficha",
    "Otwórz profil",
    "Ver ficha",
    "Atverti profilį",
    "Vezi profilul",
    "Открыть профиль"
  ],
  [
    "Curtain / box",
    "Lona / caja",
    "Plandeka / furgon",
    "Lona / caixa",
    "Užuolaidinė / uždara",
    "Prelată / box",
    "Тент / фургон"
  ],
  [
    "Reefer",
    "Frigorífico",
    "Chłodnia",
    "Frigorífico",
    "Šaldytuvas",
    "Frigorific",
    "Рефрижератор"
  ],
  [
    "Flatbed",
    "Plataforma",
    "Platforma",
    "Plataforma",
    "Platforma",
    "Platformă",
    "Платформа"
  ],
  [
    "Tanker",
    "Cisterna",
    "Cysterna",
    "Cisterna",
    "Cisterna",
    "Cisternă",
    "Цистерна"
  ],
  [
    "Specialized",
    "Especializado",
    "Specjalistyczny",
    "Especializado",
    "Specializuotas",
    "Specializat",
    "Специализированный"
  ],
  [
    "Specialised",
    "Especializado",
    "Specjalistyczny",
    "Especializado",
    "Specializuotas",
    "Specializat",
    "Специализированный"
  ],
  [
    "Island of Ireland",
    "Isla de Irlanda",
    "Wyspa Irlandia",
    "Ilha da Irlanda",
    "Airijos sala",
    "Insula Irlanda",
    "Остров Ирландия"
  ],
  [
    "UK",
    "Reino Unido",
    "Wielka Brytania",
    "Reino Unido",
    "Jungtinė Karalystė",
    "Regatul Unit",
    "Великобритания"
  ],
  [
    "Europe",
    "Europa",
    "Europa",
    "Europa",
    "Europa",
    "Europa",
    "Европа"
  ],
  [
    "Hourly",
    "Por hora",
    "Godzinowo",
    "Por hora",
    "Valandinis",
    "Pe oră",
    "Почасовая"
  ],
  [
    "Day rate",
    "Por día",
    "Stawka dzienna",
    "Por dia",
    "Dienos tarifas",
    "Tarif zilnic",
    "За день"
  ],
  [
    "Salary",
    "Salario fijo",
    "Pensja stała",
    "Salário fixo",
    "Fiksuotas atlyginimas",
    "Salariu fix",
    "Оклад"
  ],
  [
    "Percentage",
    "Porcentaje",
    "Procentowo",
    "Percentagem",
    "Procentinis",
    "Procent",
    "Процент"
  ],
  [
    "Missing vs the quote",
    "Diferencia con lo prometido",
    "Różnica względem obietnicy",
    "Diferença face ao prometido",
    "Skirtumas nuo pažadėto",
    "Diferență față de promis",
    "Разница с обещанным"
  ],
  [
    "Average take-home",
    "Neto medio",
    "Średnio na rękę",
    "Líquido médio",
    "Vidutiniškai į rankas",
    "Net mediu",
    "Средняя сумма на руки"
  ],
  [
    "Quoted",
    "Prometido",
    "Obiecane",
    "Prometido",
    "Žadėta",
    "Promis",
    "Обещано"
  ],
  [
    "Cleared",
    "Cobrado",
    "Wypłacone",
    "Recebido",
    "Išmokėta",
    "Încasat",
    "Получено"
  ],
  [
    "/wk",
    "/sem.",
    "/tydz.",
    "/sem.",
    "/sav.",
    "/săpt.",
    "/нед."
  ],
  [
    "Nothing on the board yet",
    "Todavía no hay empresas seleccionadas",
    "Nie wybrano jeszcze firm",
    "Ainda não há empresas selecionadas",
    "Įmonių dar nepasirinkta",
    "Nicio companie selectată",
    "Компании пока не выбраны"
  ],
  [
    "Open a company file and tap Compare — up to three Irish hauliers.",
    "Abre una ficha y pulsa Comparar. Puedes elegir hasta tres transportistas irlandeses.",
    "Otwórz profil i kliknij Porównaj. Wybierz do trzech irlandzkich przewoźników.",
    "Abre uma ficha e escolhe Comparar. Até três transportadoras irlandesas.",
    "Atverkite profilį ir spauskite Palyginti. Iki trijų Airijos vežėjų.",
    "Deschide un profil și apasă Compară. Până la trei transportatori irlandezi.",
    "Откройте профиль и нажмите «Сравнить». До трёх ирландских перевозчиков."
  ],
  [
    "Browse hauliers",
    "Ver transportistas",
    "Przeglądaj przewoźników",
    "Ver transportadoras",
    "Peržiūrėti vežėjus",
    "Vezi transportatorii",
    "Посмотреть перевозчиков"
  ],
  [
    "County",
    "Condado",
    "Hrabstwo",
    "Condado",
    "Grafystė",
    "Comitat",
    "Графство"
  ],
  [
    "Lanes",
    "Rutas",
    "Trasy",
    "Rotas",
    "Maršrutai",
    "Rute",
    "Маршруты"
  ],
  [
    "Wage slips",
    "Registros salariales",
    "Dane płacowe",
    "Registos salariais",
    "Atlygio įrašai",
    "Înregistrări salariale",
    "Зарплатные записи"
  ],
  [
    "None yet",
    "Todavía ninguno",
    "Jeszcze brak",
    "Ainda nenhum",
    "Dar nėra",
    "Încă niciunul",
    "Пока нет"
  ],
  [
    "Take-home / week",
    "Neto / semana",
    "Na rękę / tydzień",
    "Líquido / semana",
    "Į rankas / savaitę",
    "Net / săptămână",
    "На руки / неделю"
  ],
  [
    "Quoted / week",
    "Prometido / semana",
    "Obiecane / tydzień",
    "Prometido / semana",
    "Žadėta / savaitę",
    "Promis / săptămână",
    "Обещано / неделю"
  ],
  [
    "No slips",
    "Sin registros",
    "Brak danych",
    "Sem registos",
    "Nėra įrašų",
    "Fără înregistrări",
    "Нет записей"
  ],
  [
    "Not given",
    "No indicado",
    "Nie podano",
    "Não indicado",
    "Nenurodyta",
    "Nespecificat",
    "Не указано"
  ],
  [
    "Quote gap",
    "Diferencia con lo prometido",
    "Różnica względem obietnicy",
    "Diferença face ao prometido",
    "Skirtumas nuo pažadėto",
    "Diferență față de promis",
    "Разница с обещанным"
  ],
  [
    "Remove",
    "Quitar",
    "Usuń",
    "Remover",
    "Pašalinti",
    "Elimină",
    "Убрать"
  ],
  [
    "Line",
    "Concepto",
    "Pozycja",
    "Rubrica",
    "Rodiklis",
    "Rubrică",
    "Показатель"
  ],
  [
    "No quote gaps to rank yet",
    "Todavía no hay diferencias para clasificar",
    "Brak różnic do rankingu",
    "Ainda não há diferenças para classificar",
    "Dar nėra skirtumų reitingui",
    "Încă nu există diferențe pentru clasament",
    "Пока нет данных для рейтинга"
  ],
  [
    "Current employer",
    "Empresa actual",
    "Obecny pracodawca",
    "Empresa atual",
    "Dabartinis darbdavys",
    "Angajator actual",
    "Текущий работодатель"
  ],
  [
    "Leave blank if you do not want to name the firm",
    "Déjalo vacío si no quieres indicar la empresa",
    "Pozostaw puste, jeśli nie chcesz podawać firmy",
    "Deixa em branco se não quiseres indicar a empresa",
    "Palikite tuščią, jei nenorite nurodyti įmonės",
    "Lasă gol dacă nu vrei să numești compania",
    "Оставьте пустым, если не хотите указывать компанию"
  ],
  [
    "Employment start date",
    "Fecha de inicio del empleo",
    "Data rozpoczęcia pracy",
    "Data de início do emprego",
    "Darbo pradžios data",
    "Data începerii angajării",
    "Дата начала работы"
  ],
  [
    "Where that date came from",
    "Origen de esa fecha",
    "Źródło tej daty",
    "Origem dessa data",
    "Datos šaltinis",
    "Sursa datei",
    "Источник даты"
  ],
  [
    "Add a start date to calculate tenure in months.",
    "Añade la fecha de inicio para calcular la antigüedad en meses.",
    "Dodaj datę rozpoczęcia, aby obliczyć staż w miesiącach.",
    "Adiciona a data de início para calcular a antiguidade em meses.",
    "Įveskite pradžios datą stažui mėnesiais apskaičiuoti.",
    "Adaugă data începerii pentru a calcula vechimea în luni.",
    "Укажите дату начала работы для расчёта стажа в месяцах."
  ],
  [
    "Job type",
    "Tipo de trabajo",
    "Rodzaj pracy",
    "Tipo de trabalho",
    "Darbo tipas",
    "Tipul activității",
    "Вид работы"
  ],
  [
    "Vehicle type",
    "Tipo de vehículo",
    "Rodzaj pojazdu",
    "Tipo de veículo",
    "Transporto priemonė",
    "Tipul vehiculului",
    "Тип транспорта"
  ],
  [
    "Hours",
    "Jornada",
    "Wymiar czasu pracy",
    "Horário",
    "Darbo laikas",
    "Program",
    "Рабочее время"
  ],
  [
    "Shift",
    "Turno",
    "Zmiana",
    "Turno",
    "Pamaina",
    "Tură",
    "Смена"
  ],
  [
    "How you are paid",
    "Forma de pago",
    "Sposób wynagradzania",
    "Forma de pagamento",
    "Apmokėjimo būdas",
    "Modalitatea de plată",
    "Способ оплаты"
  ],
  [
    "Full time",
    "Jornada completa",
    "Pełny etat",
    "Tempo inteiro",
    "Visas etatas",
    "Normă întreagă",
    "Полная занятость"
  ],
  [
    "Part time",
    "Jornada parcial",
    "Niepełny etat",
    "Tempo parcial",
    "Dalinis etatas",
    "Normă parțială",
    "Неполная занятость"
  ],
  [
    "Full-time",
    "Jornada completa",
    "Pełny etat",
    "Tempo inteiro",
    "Visas etatas",
    "Normă întreagă",
    "Полная занятость"
  ],
  [
    "Part-time",
    "Jornada parcial",
    "Niepełny etat",
    "Tempo parcial",
    "Dalinis etatas",
    "Normă parțială",
    "Неполная занятость"
  ],
  [
    "Agreed base rate (€/hr) if known",
    "Tarifa base pactada (€/h), si la conoces",
    "Uzgodniona stawka podstawowa (€/h), jeśli znana",
    "Taxa base acordada (€/h), se conhecida",
    "Sutartas bazinis tarifas (€/val.), jei žinomas",
    "Tarif de bază convenit (€/oră), dacă îl cunoști",
    "Согласованная базовая ставка (€/ч), если известна"
  ],
  [
    "Profile saved.",
    "Perfil guardado.",
    "Profil zapisany.",
    "Perfil guardado.",
    "Profilis išsaugotas.",
    "Profil salvat.",
    "Профиль сохранён."
  ],
  [
    "Saving…",
    "Guardando…",
    "Zapisywanie…",
    "A guardar…",
    "Saugoma…",
    "Se salvează…",
    "Сохранение…"
  ],
  [
    "Save employment profile",
    "Guardar perfil laboral",
    "Zapisz profil zatrudnienia",
    "Guardar perfil profissional",
    "Išsaugoti darbo profilį",
    "Salvează profilul profesional",
    "Сохранить профиль работы"
  ],
  [
    "Could not save",
    "No se pudo guardar",
    "Nie udało się zapisać",
    "Não foi possível guardar",
    "Nepavyko išsaugoti",
    "Nu s-a putut salva",
    "Не удалось сохранить"
  ],
  [
    "Distribution",
    "Distribución",
    "Dystrybucja",
    "Distribuição",
    "Paskirstymas",
    "Distribuție",
    "Доставка"
  ],
  [
    "Trunking / long haul",
    "Larga distancia",
    "Transport dalekobieżny",
    "Longa distância",
    "Tolimieji reisai",
    "Transport pe distanțe lungi",
    "Дальние перевозки"
  ],
  [
    "Other",
    "Otro",
    "Inne",
    "Outro",
    "Kita",
    "Altele",
    "Другое"
  ],
  [
    "Articulated",
    "Articulado",
    "Zestaw z naczepą",
    "Articulado",
    "Vilkikas su puspriekabe",
    "Articulat",
    "Седельный тягач"
  ],
  [
    "Rigid",
    "Rígido",
    "Ciężarówka sztywna",
    "Rígido",
    "Sunkvežimis be puspriekabės",
    "Rigid",
    "Одиночный грузовик"
  ],
  [
    "Fuel",
    "Combustible",
    "Paliwo",
    "Combustível",
    "Degalai",
    "Combustibil",
    "Топливо"
  ],
  [
    "Refrigerated",
    "Frigorífico",
    "Chłodnia",
    "Frigorífico",
    "Šaldytuvas",
    "Frigorific",
    "Рефрижератор"
  ],
  [
    "Container",
    "Contenedor",
    "Kontener",
    "Contentor",
    "Konteineris",
    "Container",
    "Контейнер"
  ],
  [
    "Not stated",
    "No indicado",
    "Nie podano",
    "Não indicado",
    "Nenurodyta",
    "Nespecificat",
    "Не указано"
  ],
  [
    "Day",
    "Día",
    "Dzień",
    "Dia",
    "Dieninė",
    "Zi",
    "Дневная"
  ],
  [
    "Night",
    "Noche",
    "Noc",
    "Noite",
    "Naktinė",
    "Noapte",
    "Ночная"
  ],
  [
    "Rotating",
    "Rotativo",
    "Rotacyjna",
    "Rotativo",
    "Besikeičianti",
    "Rotativă",
    "Скользящая"
  ],
  [
    "Mixed",
    "Mixto",
    "Mieszana",
    "Misto",
    "Mišri",
    "Mixtă",
    "Смешанная"
  ],
  [
    "0–1 year",
    "0–1 año",
    "0–1 rok",
    "0–1 ano",
    "0–1 metai",
    "0–1 an",
    "0–1 год"
  ],
  [
    "1–3 years",
    "1–3 años",
    "1–3 lata",
    "1–3 anos",
    "1–3 metai",
    "1–3 ani",
    "1–3 года"
  ],
  [
    "3–5 years",
    "3–5 años",
    "3–5 lat",
    "3–5 anos",
    "3–5 metai",
    "3–5 ani",
    "3–5 лет"
  ],
  [
    "5+ years",
    "Más de 5 años",
    "Ponad 5 lat",
    "Mais de 5 anos",
    "5 ir daugiau metų",
    "Peste 5 ani",
    "Более 5 лет"
  ],
  [
    "Taken from a payslip",
    "De una nómina",
    "Z paska wynagrodzenia",
    "De um recibo de vencimento",
    "Iš algalapio",
    "Dintr-un fluturaș de salariu",
    "Из расчётного листка"
  ],
  [
    "Taken from an employment contract",
    "De un contrato laboral",
    "Z umowy o pracę",
    "De um contrato de trabalho",
    "Iš darbo sutarties",
    "Dintr-un contract de muncă",
    "Из трудового договора"
  ],
  [
    "You told us — not document-verified",
    "Declarado por ti; sin verificación documental",
    "Podane przez Ciebie; bez weryfikacji dokumentu",
    "Declarado por ti; sem verificação documental",
    "Jūsų pateikta; dokumentu nepatvirtinta",
    "Declarat de tine; neverificat prin documente",
    "Указано вами; документально не проверено"
  ],
  [
    "Taken from another document",
    "De otro documento",
    "Z innego dokumentu",
    "De outro documento",
    "Iš kito dokumento",
    "Dintr-un alt document",
    "Из другого документа"
  ],
  [
    "Haulage firm",
    "Empresa de transporte",
    "Firma transportowa",
    "Transportadora",
    "Transporto įmonė",
    "Companie de transport",
    "Транспортная компания"
  ],
  [
    "Job title",
    "Puesto de trabajo",
    "Stanowisko",
    "Cargo",
    "Pareigos",
    "Funcție",
    "Должность"
  ],
  [
    "How long there",
    "Antigüedad en la empresa",
    "Staż w firmie",
    "Antiguidade na empresa",
    "Stažas įmonėje",
    "Vechime în companie",
    "Стаж в компании"
  ],
  [
    "Trailer / work",
    "Remolque / actividad",
    "Naczepa / praca",
    "Reboque / atividade",
    "Priekaba / veikla",
    "Remorcă / activitate",
    "Прицеп / работа"
  ],
  [
    "Usual lanes",
    "Rutas habituales",
    "Zwykłe trasy",
    "Rotas habituais",
    "Įprasti maršrutai",
    "Rute obișnuite",
    "Обычные маршруты"
  ],
  [
    "Weekly take-home (€) — required",
    "Neto semanal (€), obligatorio",
    "Tygodniowo na rękę (€), wymagane",
    "Líquido semanal (€), obrigatório",
    "Savaitės suma į rankas (€), būtina",
    "Net săptămânal (€), obligatoriu",
    "На руки в неделю (€), обязательно"
  ],
  [
    "What actually landed",
    "Lo que realmente cobraste",
    "Faktycznie otrzymana kwota",
    "O que realmente recebeste",
    "Faktiškai gauta suma",
    "Suma primită efectiv",
    "Фактически полученная сумма"
  ],
  [
    "What they quoted weekly (€) — optional",
    "Prometido por semana (€), opcional",
    "Obiecane tygodniowo (€), opcjonalnie",
    "Prometido por semana (€), opcional",
    "Žadėta per savaitę (€), nebūtina",
    "Promis săptămânal (€), opțional",
    "Обещано в неделю (€), необязательно"
  ],
  [
    "Only if they named a figure",
    "Solo si te indicaron una cifra",
    "Tylko jeśli podano kwotę",
    "Só se indicaram um valor",
    "Tik jei nurodė sumą",
    "Doar dacă au indicat o sumă",
    "Только если называли сумму"
  ],
  [
    "Hourly rate (€) — optional",
    "Tarifa por hora (€), opcional",
    "Stawka godzinowa (€), opcjonalnie",
    "Taxa horária (€), opcional",
    "Valandinis tarifas (€), nebūtina",
    "Tarif orar (€), opțional",
    "Ставка в час (€), необязательно"
  ],
  [
    "Hours / week",
    "Horas / semana",
    "Godziny / tydzień",
    "Horas / semana",
    "Valandos / savaitę",
    "Ore / săptămână",
    "Часы / неделю"
  ],
  [
    "Km / week — optional",
    "Km / semana, opcional",
    "Km / tydzień, opcjonalnie",
    "Km / semana, opcional",
    "Km / savaitę, nebūtina",
    "Km / săptămână, opțional",
    "Км / неделю, необязательно"
  ],
  [
    "Notes — optional. Facts from your slip only.",
    "Notas opcionales. Solo datos de tu nómina.",
    "Uwagi opcjonalne. Tylko fakty z paska wynagrodzenia.",
    "Notas opcionais. Apenas factos do recibo.",
    "Pastabos nebūtinos. Tik algalapio faktai.",
    "Note opționale. Doar date din fluturaș.",
    "Примечания необязательны. Только данные расчётного листка."
  ],
  [
    "Hours, wait time, what was deducted — only what you saw.",
    "Horas, esperas y deducciones: solo lo que comprobaste.",
    "Godziny, oczekiwanie, potrącenia: tylko to, co widzisz.",
    "Horas, esperas e descontos: apenas o que verificaste.",
    "Valandos, laukimas, išskaitos: tik tai, ką matėte.",
    "Ore, așteptare, rețineri: doar ce ai constatat.",
    "Часы, ожидание, удержания: только то, что вы видели."
  ],
  [
    "Filing…",
    "Publicando…",
    "Dodawanie…",
    "A publicar…",
    "Pateikiama…",
    "Se publică…",
    "Публикация…"
  ],
  [
    "Could not send",
    "No se pudo enviar",
    "Nie udało się wysłać",
    "Não foi possível enviar",
    "Nepavyko išsiųsti",
    "Nu s-a putut trimite",
    "Не удалось отправить"
  ],
  [
    "Listing request in",
    "Solicitud recibida",
    "Zgłoszenie otrzymane",
    "Pedido recebido",
    "Užklausa gauta",
    "Solicitare primită",
    "Заявка получена"
  ],
  [
    "Company name",
    "Nombre de la empresa",
    "Nazwa firmy",
    "Nome da empresa",
    "Įmonės pavadinimas",
    "Numele companiei",
    "Название компании"
  ],
  [
    "Contact name",
    "Persona de contacto",
    "Osoba kontaktowa",
    "Pessoa de contacto",
    "Kontaktinis asmuo",
    "Persoană de contact",
    "Контактное лицо"
  ],
  [
    "Work email",
    "Correo profesional",
    "E-mail służbowy",
    "E-mail profissional",
    "Darbo el. paštas",
    "E-mail profesional",
    "Рабочая почта"
  ],
  [
    "Phone",
    "Teléfono",
    "Telefon",
    "Telefone",
    "Telefonas",
    "Telefon",
    "Телефон"
  ],
  [
    "Website",
    "Sitio web",
    "Strona internetowa",
    "Site",
    "Svetainė",
    "Site web",
    "Сайт"
  ],
  [
    "e.g. Cork",
    "Por ejemplo, Cork",
    "Np. Cork",
    "Por exemplo, Cork",
    "Pvz., Cork",
    "De exemplu, Cork",
    "Например, Корк"
  ],
  [
    "What you want listed (public facts only)",
    "Qué quieres publicar (solo información pública)",
    "Co opublikować (tylko dane publiczne)",
    "O que queres publicar (apenas dados públicos)",
    "Ką norite skelbti (tik viešus faktus)",
    "Ce vrei publicat (doar informații publice)",
    "Что опубликовать (только открытые сведения)"
  ],
  [
    "HQ, lanes, equipment. Do not send unverified pay claims.",
    "Sede, rutas y equipamiento. No envíes cifras salariales sin verificar.",
    "Siedziba, trasy, sprzęt. Bez niezweryfikowanych danych płacowych.",
    "Sede, rotas e equipamento. Não envies salários não verificados.",
    "Būstinė, maršrutai, įranga. Nesiųskite nepatikrintų atlygio teiginių.",
    "Sediu, rute, echipament. Nu trimite salarii neverificate.",
    "База, маршруты, техника. Не отправляйте непроверенные сведения о зарплатах."
  ],
  [
    "Sending…",
    "Enviando…",
    "Wysyłanie…",
    "A enviar…",
    "Siunčiama…",
    "Se trimite…",
    "Отправка…"
  ],
  [
    "Request a listing",
    "Solicitar inclusión",
    "Zgłoś firmę",
    "Pedir inclusão",
    "Prašyti įtraukti",
    "Solicită includerea",
    "Добавить компанию"
  ],
  [
    "Payroll-verified pay",
    "Salarios basados en nóminas",
    "Wynagrodzenia na podstawie pasków",
    "Salários com base em recibos",
    "Atlygis pagal algalapius",
    "Salarii bazate pe fluturași",
    "Зарплаты по расчётным листкам"
  ],
  [
    "Payroll verified",
    "Basado en nóminas",
    "Na podstawie pasków",
    "Com base em recibos",
    "Pagal algalapius",
    "Bazat pe fluturași",
    "По расчётным листкам"
  ],
  [
    "Confidence",
    "Confianza",
    "Pewność",
    "Confiança",
    "Patikimumas",
    "Încredere",
    "Уверенность"
  ],
  [
    "Low",
    "Baja",
    "Niska",
    "Baixa",
    "Žemas",
    "Scăzută",
    "Низкая"
  ],
  [
    "Medium",
    "Media",
    "Średnia",
    "Média",
    "Vidutinis",
    "Medie",
    "Средняя"
  ],
  [
    "High",
    "Alta",
    "Wysoka",
    "Alta",
    "Aukštas",
    "Ridicată",
    "Высокая"
  ],
  [
    "Median base hourly rate",
    "Mediana de la tarifa base por hora",
    "Mediana podstawowej stawki godzinowej",
    "Mediana da taxa base horária",
    "Bazinės valandinės normos mediana",
    "Mediana tarifului orar de bază",
    "Медианная базовая ставка в час"
  ],
  [
    "Median gross / week equiv.",
    "Mediana bruta / semana equivalente",
    "Mediana brutto / ekwiwalent tygodnia",
    "Mediana bruta / semana equivalente",
    "Bruto mediana / savaitės ekvivalentą",
    "Mediana brută / echivalent săptămânal",
    "Медиана брутто / эквивалент недели"
  ],
  [
    "Median paid hours / week equiv.",
    "Mediana de horas pagadas / semana equivalente",
    "Mediana płatnych godzin / ekwiwalent tygodnia",
    "Mediana de horas pagas / semana equivalente",
    "Apmokėtų valandų mediana / savaitės ekvivalentą",
    "Mediana orelor plătite / echivalent săptămânal",
    "Медиана оплаченных часов / эквивалент недели"
  ],
  [
    "Median not published.",
    "Mediana no publicada.",
    "Mediana nieopublikowana.",
    "Mediana não publicada.",
    "Mediana neskelbiama.",
    "Mediana nu este publicată.",
    "Медиана не опубликована."
  ],
  [
    "By job, vehicle and shift",
    "Por trabajo, vehículo y turno",
    "Według pracy, pojazdu i zmiany",
    "Por trabalho, veículo e turno",
    "Pagal darbą, transportą ir pamainą",
    "După activitate, vehicul și tură",
    "По работе, транспорту и смене"
  ],
  [
    "Only slices with at least three drivers. Not “the company salary”.",
    "Solo grupos de al menos tres conductores. No representan el salario de toda la empresa.",
    "Tylko grupy co najmniej trzech kierowców. Nie jest to pensja całej firmy.",
    "Só grupos com pelo menos três motoristas. Não representam o salário da empresa.",
    "Tik bent trijų vairuotojų grupės. Tai nėra visos įmonės atlyginimas.",
    "Doar grupuri de cel puțin trei șoferi. Nu reprezintă salariul întregii companii.",
    "Только группы от трёх водителей. Это не зарплата всей компании."
  ],
  [
    "Median rate",
    "Tarifa mediana",
    "Mediana stawki",
    "Taxa mediana",
    "Tarifo mediana",
    "Tarif median",
    "Медианная ставка"
  ],
  [
    "Median hours / week equiv.",
    "Mediana de horas / semana equivalente",
    "Mediana godzin / ekwiwalent tygodnia",
    "Mediana de horas / semana equivalente",
    "Valandų mediana / savaitės ekvivalentą",
    "Mediana orelor / echivalent săptămânal",
    "Медиана часов / эквивалент недели"
  ],
  [
    "Analysis could not be loaded.",
    "No se pudo cargar el análisis.",
    "Nie udało się wczytać analizy.",
    "Não foi possível carregar a análise.",
    "Nepavyko įkelti analizės.",
    "Analiza nu a putut fi încărcată.",
    "Не удалось загрузить анализ."
  ],
  [
    "Reading your latest slips…",
    "Leyendo tus últimas nóminas…",
    "Odczytywanie ostatnich pasków…",
    "A ler os últimos recibos…",
    "Skaitomi naujausi algalapiai…",
    "Se citesc ultimii fluturași…",
    "Чтение последних расчётных листков…"
  ],
  [
    "Not verified yet",
    "Todavía sin verificar",
    "Jeszcze niezweryfikowane",
    "Ainda não verificado",
    "Dar nepatikrinta",
    "Încă neverificat",
    "Ещё не проверено"
  ],
  [
    "Anomaly watch",
    "Revisión de anomalías",
    "Kontrola nieprawidłowości",
    "Revisão de anomalias",
    "Neatitikimų stebėjimas",
    "Monitorizarea anomaliilor",
    "Проверка отклонений"
  ],
  [
    "Latest slips (newest first)",
    "Últimas nóminas (más recientes primero)",
    "Ostatnie paski (od najnowszych)",
    "Últimos recibos (mais recentes primeiro)",
    "Naujausi algalapiai",
    "Ultimii fluturași (cei mai noi întâi)",
    "Последние листки (сначала новые)"
  ],
  [
    "This slip versus your recent slips",
    "Esta nómina frente a las anteriores",
    "Ten pasek a poprzednie",
    "Este recibo face aos anteriores",
    "Šis algalapis ir ankstesni",
    "Acest fluturaș față de cei anteriori",
    "Этот листок и предыдущие"
  ],
  [
    "Your weekly-equivalent medians",
    "Tus medianas semanales equivalentes",
    "Twoje mediany tygodniowych ekwiwalentów",
    "As tuas medianas semanais equivalentes",
    "Jūsų savaitės ekvivalentų medianos",
    "Medianele tale săptămânale echivalente",
    "Ваши медианы в пересчёте на неделю"
  ],
  [
    "Median basic rate",
    "Mediana de la tarifa base",
    "Mediana stawki podstawowej",
    "Mediana da taxa base",
    "Bazinio tarifo mediana",
    "Mediana tarifului de bază",
    "Медианная базовая ставка"
  ],
  [
    "Median basic hours / week equiv.",
    "Mediana de horas base / semana equivalente",
    "Mediana godzin podstawowych / ekwiwalent tygodnia",
    "Mediana de horas base / semana equivalente",
    "Bazinių valandų mediana / savaitės ekvivalentą",
    "Mediana orelor de bază / echivalent săptămânal",
    "Медиана основных часов / эквивалент недели"
  ],
  [
    "Why pay can differ at the same firm",
    "Por qué puede variar el salario en la misma empresa",
    "Dlaczego płace w tej samej firmie się różnią",
    "Porque varia o salário na mesma empresa",
    "Kodėl atlygis toje pačioje įmonėje skiriasi",
    "De ce diferă salariile în aceeași companie",
    "Почему зарплаты в одной компании различаются"
  ],
  [
    "Add a payslip",
    "Añadir nómina",
    "Dodaj pasek wynagrodzenia",
    "Adicionar recibo",
    "Pridėti algalapį",
    "Adaugă fluturaș",
    "Добавить расчётный листок"
  ],
  [
    "Employment profile",
    "Perfil laboral",
    "Profil zatrudnienia",
    "Perfil profissional",
    "Darbo profilis",
    "Profil profesional",
    "Профиль работы"
  ],
  [
    "Confirmed",
    "Confirmado",
    "Potwierdzone",
    "Confirmado",
    "Patvirtinta",
    "Confirmat",
    "Подтверждено"
  ],
  [
    "Possible anomaly",
    "Posible anomalía",
    "Możliwa nieprawidłowość",
    "Possível anomalia",
    "Galimas neatitikimas",
    "Posibilă anomalie",
    "Возможное отклонение"
  ],
  [
    "Needs review",
    "Requiere revisión",
    "Wymaga sprawdzenia",
    "Requer revisão",
    "Reikia peržiūrėti",
    "Necesită verificare",
    "Требует проверки"
  ],
  [
    "Insufficient data",
    "Datos insuficientes",
    "Za mało danych",
    "Dados insuficientes",
    "Nepakanka duomenų",
    "Date insuficiente",
    "Недостаточно данных"
  ],
  [
    "fact",
    "hecho",
    "fakt",
    "facto",
    "faktas",
    "fapt",
    "факт"
  ],
  [
    "inference",
    "inferencia",
    "wniosek",
    "inferência",
    "išvada",
    "inferență",
    "вывод"
  ],
  [
    "unknown",
    "desconocido",
    "nieznane",
    "desconhecido",
    "nežinoma",
    "necunoscut",
    "неизвестно"
  ],
  [
    "No take-home figures yet. TruckPay will not invent them. Driver-reported stubs and payroll-verified medians are kept separate.",
    "Aún no hay cifras netas. Los datos declarados por conductores y las medianas calculadas con nóminas se muestran por separado.",
    "Brak kwot netto. Dane kierowców i mediany z pasków są pokazywane oddzielnie.",
    "Ainda sem valores líquidos. Os dados dos motoristas e as medianas dos recibos são apresentados separadamente.",
    "Neto sumų dar nėra. Vairuotojų pateikti duomenys ir algalapių medianos rodomi atskirai.",
    "Încă nu există sume nete. Datele declarate și medianele din fluturași sunt afișate separat.",
    "Сумм на руки пока нет. Данные водителей и медианы по расчётным листкам показаны отдельно."
  ],
  [
    "Voluntary community slips. Not the same evidence as payroll-verified medians from My TruckPay. Averages here are not “the company salary”.",
    "Aportaciones voluntarias de la comunidad. No tienen la misma evidencia que las medianas de nóminas de Mi TruckPay ni representan el salario de toda la empresa.",
    "Dobrowolne dane społeczności. Nie mają tej samej podstawy co mediany z My TruckPay i nie określają płacy całej firmy.",
    "Contributos voluntários. Não têm a mesma base que as medianas dos recibos My TruckPay nem representam o salário da empresa.",
    "Savanoriški bendruomenės duomenys. Jų pagrindas skiriasi nuo My TruckPay algalapių medianų; tai nėra visos įmonės atlygis.",
    "Contribuții voluntare. Nu au aceeași bază ca medianele My TruckPay și nu reprezintă salariul întregii companii.",
    "Добровольные данные сообщества. Они отличаются от медиан My TruckPay и не определяют зарплату всей компании."
  ],
  [
    "The quoted column is only filled when a driver also reported what the firm told them they would earn. Truckpay does not invent that number.",
    "La cifra prometida solo aparece si el conductor la indicó. Truckpay no la inventa.",
    "Obiecana kwota pojawia się tylko wtedy, gdy podał ją kierowca. Truckpay jej nie wymyśla.",
    "O valor prometido só aparece se o motorista o indicou. O Truckpay não o inventa.",
    "Žadėta suma rodoma tik vairuotojui ją nurodžius. Truckpay jos nesugalvoja.",
    "Suma promisă apare doar dacă șoferul a indicat-o. Truckpay nu o inventează.",
    "Обещанная сумма появляется только со слов водителя. Truckpay её не выдумывает."
  ],
  [
    "No driver settlements on file yet. The first wage slip sets the board.",
    "Todavía no hay datos salariales. El primer registro iniciará la comparación.",
    "Brak danych płacowych. Pierwszy wpis rozpocznie porównanie.",
    "Ainda sem dados salariais. O primeiro registo inicia a comparação.",
    "Atlygio duomenų dar nėra. Pirmas įrašas pradės palyginimą.",
    "Încă nu există date salariale. Prima înregistrare va începe comparația.",
    "Зарплатных данных пока нет. Первая запись начнёт сравнение."
  ],
  [
    "A ranking needs a wage slip that includes both take-home and what the firm quoted. That is driver-reported evidence. TruckPay will not invent either number.",
    "La clasificación necesita cifras cobradas y prometidas aportadas por conductores. TruckPay no inventa esos datos.",
    "Ranking wymaga podanych przez kierowcę kwot otrzymanych i obiecanych. TruckPay ich nie wymyśla.",
    "O ranking precisa dos valores recebidos e prometidos declarados por motoristas. O TruckPay não os inventa.",
    "Reitingui reikia vairuotojų nurodytų gautų ir žadėtų sumų. TruckPay jų nesugalvoja.",
    "Clasamentul necesită sumele primite și promise declarate de șoferi. TruckPay nu le inventează.",
    "Для рейтинга нужны полученные и обещанные суммы от водителей. TruckPay их не выдумывает."
  ],
  [
    "Two drivers at the same firm may not do equivalent work. Tenure months are calculated from the start date — we do not store “years” as a typed number. A start date you type yourself is never shown as document-verified.",
    "Dos conductores de la misma empresa pueden realizar trabajos distintos. La antigüedad se calcula desde la fecha de inicio. Una fecha escrita por ti no se presenta como verificada documentalmente.",
    "Kierowcy tej samej firmy mogą wykonywać różną pracę. Staż obliczamy od daty rozpoczęcia. Wpisana data nie jest uznawana za potwierdzoną dokumentem.",
    "Dois motoristas da mesma empresa podem ter funções diferentes. A antiguidade é calculada pela data de início. Uma data introduzida por ti não é apresentada como verificada por documento.",
    "Tos pačios įmonės vairuotojai gali dirbti skirtingą darbą. Stažas skaičiuojamas nuo pradžios datos. Jūsų įrašyta data nelaikoma patvirtinta dokumentu.",
    "Șoferii aceleiași companii pot avea activități diferite. Vechimea se calculează de la data începerii. O dată introdusă de tine nu este prezentată ca verificată prin documente.",
    "Водители одной компании могут выполнять разную работу. Стаж считается от даты начала. Введённая вами дата не считается документально подтверждённой."
  ],
  [
    "We will only publish public facts you confirm. Truckpay will not invent pay figures or reviews for your firm.",
    "Solo publicaremos los datos públicos que confirmes. Truckpay no inventará salarios ni reseñas de tu empresa.",
    "Opublikujemy tylko potwierdzone dane publiczne. Truckpay nie wymyśla płac ani opinii o firmie.",
    "Só publicaremos dados públicos confirmados por ti. O Truckpay não inventará salários nem avaliações.",
    "Skelbsime tik jūsų patvirtintus viešus faktus. Truckpay nekurs atlygio skaičių ar atsiliepimų.",
    "Vom publica doar informațiile publice confirmate de tine. Truckpay nu inventează salarii sau recenzii.",
    "Опубликуем только подтверждённые вами открытые сведения. Truckpay не выдумывает зарплаты и отзывы."
  ],
  [
    "No job/vehicle/shift slice has three payroll-verified drivers yet, so those medians stay unpublished.",
    "Ningún grupo de trabajo, vehículo y turno alcanza todavía tres conductores con nóminas; sus medianas no se publican.",
    "Żadna grupa pracy, pojazdu i zmiany nie ma jeszcze trzech kierowców z paskami, więc mediany nie są publikowane.",
    "Nenhum grupo de trabalho, veículo e turno tem três motoristas com recibos; as medianas não são publicadas.",
    "Nė vienoje darbo, transporto ir pamainos grupėje nėra trijų vairuotojų su algalapiais; medianos neskelbiamos.",
    "Niciun grup de activitate, vehicul și tură nu are trei șoferi cu fluturași; medianele nu se publică.",
    "Ни в одной группе по работе, транспорту и смене нет трёх водителей с листками; медианы не публикуются."
  ],
  [
    "One payslip is not treated as one working week. Weekly figures below are equivalents from the printed period or insurable weeks.",
    "Una nómina no equivale necesariamente a una semana. Las cifras semanales se calculan con el período indicado o las semanas cotizadas.",
    "Jeden pasek nie oznacza jednego tygodnia. Kwoty tygodniowe wynikają z podanego okresu lub tygodni ubezpieczenia.",
    "Um recibo não equivale necessariamente a uma semana. Os valores semanais usam o período indicado ou as semanas de contribuição.",
    "Vienas algalapis nebūtinai reiškia savaitę. Savaitės skaičiai remiasi nurodytu laikotarpiu arba draudimo savaitėmis.",
    "Un fluturaș nu înseamnă neapărat o săptămână. Valorile săptămânale folosesc perioada indicată sau săptămânile asigurate.",
    "Один листок не равен одной неделе. Недельные значения рассчитаны по указанному периоду или страховым неделям."
  ],
  [
    "The three slips are on file but something still blocks verification.",
    "Las tres nóminas están guardadas, pero todavía hay datos que impiden completar la revisión.",
    "Trzy paski zapisano, ale nadal brakuje danych do zakończenia sprawdzenia.",
    "Os três recibos estão guardados, mas ainda há dados que impedem concluir a revisão.",
    "Trys algalapiai išsaugoti, bet patikrai dar trūksta duomenų.",
    "Cei trei fluturași sunt salvați, dar unele date încă împiedică verificarea.",
    "Три листка сохранены, но некоторые данные мешают завершить проверку."
  ],
  [
    "Confirmed only with enough evidence. Possible anomaly, needs review, and insufficient data are not treated as proof of an error.",
    "Solo se confirma con evidencia suficiente. Una posible anomalía, una revisión pendiente o datos insuficientes no prueban un error.",
    "Potwierdzenie wymaga dowodów. Możliwa nieprawidłowość, potrzeba sprawdzenia lub brak danych nie dowodzą błędu.",
    "Só se confirma com evidência suficiente. Uma possível anomalia, revisão pendente ou dados insuficientes não provam um erro.",
    "Patvirtinama tik turint pakankamai įrodymų. Galimas neatitikimas, būtina peržiūra ar duomenų trūkumas klaidos neįrodo.",
    "Confirmarea necesită dovezi suficiente. O posibilă anomalie, verificarea necesară sau datele insuficiente nu dovedesc o eroare.",
    "Подтверждение требует доказательств. Возможное отклонение, необходимость проверки или нехватка данных не доказывают ошибку."
  ],
  [
    "Weekly equivalents use printed insurable weeks or the pay period. One slip is not assumed to be one working week. Unexplained remainder stays unexplained.",
    "Los equivalentes semanales usan las semanas cotizadas o el período de pago. Una nómina no se asume como una semana. Lo no explicado sigue sin explicación.",
    "Ekwiwalenty tygodniowe używają tygodni ubezpieczenia lub okresu płacy. Pasek nie oznacza tygodnia. Niewyjaśniona reszta pozostaje niewyjaśniona.",
    "Os equivalentes semanais usam semanas de contribuição ou o período de pagamento. Um recibo não é uma semana. O restante não explicado continua por explicar.",
    "Savaitės ekvivalentams naudojamos draudimo savaitės arba mokėjimo laikotarpis. Algalapis nelaikomas savaite. Nepaaiškintas likutis lieka nepaaiškintas.",
    "Echivalentele săptămânale folosesc săptămânile asigurate sau perioada de plată. Un fluturaș nu este considerat o săptămână. Restul neexplicat rămâne neexplicat.",
    "Недельные эквиваленты используют страховые недели или расчётный период. Листок не считается неделей. Необъяснённый остаток остаётся необъяснённым."
  ],
  [
    "Possible contributors only. Not an accusation, and not because two drivers here do the same job.",
    "Son posibles factores, no acusaciones. No se presupone que ambos conductores hagan el mismo trabajo.",
    "To możliwe czynniki, nie oskarżenia. Nie zakładamy, że kierowcy wykonują tę samą pracę.",
    "São possíveis fatores, não acusações. Não se presume que os motoristas façam o mesmo trabalho.",
    "Tai galimi veiksniai, ne kaltinimai. Nedaroma prielaida, kad vairuotojai dirba tą patį darbą.",
    "Sunt doar factori posibili, nu acuzații. Nu presupunem că șoferii fac aceeași muncă.",
    "Это возможные факторы, не обвинения. Не предполагается, что водители выполняют одинаковую работу."
  ],
  [
    "Saved slips: {n}",
    "Registros guardados: {n}",
    "Zapisane wpisy: {n}",
    "Registos guardados: {n}",
    "Išsaugota įrašų: {n}",
    "Înregistrări salvate: {n}",
    "Сохранено записей: {n}"
  ],
  [
    "Founded: {year}",
    "Fundada en {year}",
    "Założona: {year}",
    "Fundada em {year}",
    "Įkurta: {year}",
    "Înființată: {year}",
    "Основана: {year}"
  ],
  [
    "If you drive for {company}, your first report is the one others will see.",
    "Si trabajas para {company}, tu primer registro será el que vean los demás.",
    "Jeśli jeździsz dla {company}, inni zobaczą Twój pierwszy wpis.",
    "Se trabalhas para {company}, os outros verão o teu primeiro registo.",
    "Jei dirbate {company}, kiti matys jūsų pirmą įrašą.",
    "Dacă lucrezi pentru {company}, ceilalți vor vedea prima ta înregistrare.",
    "Если вы работаете в {company}, другие увидят вашу первую запись."
  ],
  [
    "{n} public reports. These do not establish what {company} pays.",
    "{n} registros públicos. No determinan cuánto paga {company}.",
    "Publiczne wpisy: {n}. Nie określają płac w {company}.",
    "{n} registos públicos. Não determinam quanto paga {company}.",
    "Vieši įrašai: {n}. Jie nenustato, kiek moka {company}.",
    "{n} înregistrări publice. Nu stabilesc cât plătește {company}.",
    "Открытых записей: {n}. Они не определяют зарплаты в {company}."
  ],
  [
    "Tenure: {n} months",
    "Antigüedad: {n} meses",
    "Staż: {n} mies.",
    "Antiguidade: {n} meses",
    "Stažas: {n} mėn.",
    "Vechime: {n} luni",
    "Стаж: {n} мес."
  ],
  [
    "Latest {n} slips checked",
    "Últimas {n} nóminas revisadas",
    "Sprawdzono ostatnie paski: {n}",
    "Últimos {n} recibos revistos",
    "Patikrinta naujausių algalapių: {n}",
    "Ultimii {n} fluturași verificați",
    "Проверено последних листков: {n}"
  ],
  [
    "{have} of {required} payslips",
    "{have} de {required} nóminas",
    "{have} z {required} pasków",
    "{have} de {required} recibos",
    "{have} iš {required} algalapių",
    "{have} din {required} fluturași",
    "{have} из {required} листков"
  ],
  [
    "Add {n} more unique payslips to complete the analysis.",
    "Añade {n} nóminas distintas para completar el análisis.",
    "Dodaj jeszcze {n} różnych pasków, aby ukończyć analizę.",
    "Adiciona mais {n} recibos diferentes para concluir a análise.",
    "Pridėkite dar {n} skirtingų algalapių analizei užbaigti.",
    "Adaugă încă {n} fluturași diferiți pentru a finaliza analiza.",
    "Добавьте ещё {n} разных листков для завершения анализа."
  ],
  [
    "Add your employment start date in your profile to calculate tenure.",
    "Añade la fecha de inicio en tu perfil para calcular la antigüedad.",
    "Dodaj datę rozpoczęcia w profilu, aby obliczyć staż.",
    "Adiciona a data de início no perfil para calcular a antiguidade.",
    "Įrašykite darbo pradžios datą profilyje stažui apskaičiuoti.",
    "Adaugă data începerii în profil pentru a calcula vechimea.",
    "Укажите дату начала работы в профиле для расчёта стажа."
  ],
  [
    "Period missing",
    "Falta el período",
    "Brak okresu",
    "Falta o período",
    "Trūksta laikotarpio",
    "Lipsește perioada",
    "Период не указан"
  ],
  [
    "{n}% short",
    "{n}% menos",
    "O {n}% mniej",
    "{n}% abaixo",
    "{n}% mažiau",
    "Cu {n}% mai puțin",
    "На {n}% меньше"
  ],
  [
    "Sample: {drivers} drivers; {slips} payslips.",
    "Muestra: {drivers} conductores; {slips} nóminas.",
    "Próba: {drivers} kierowców; {slips} pasków.",
    "Amostra: {drivers} motoristas; {slips} recibos.",
    "Imtis: {drivers} vairuotojų; {slips} algalapių.",
    "Eșantion: {drivers} șoferi; {slips} fluturași.",
    "Выборка: {drivers} водителей; {slips} листков."
  ],
  [
    "Small samples are not statistically representative. Medians do not establish a company-wide salary.",
    "Las muestras pequeñas no son estadísticamente representativas. Las medianas no establecen el salario de toda la empresa.",
    "Małe próby nie są statystycznie reprezentatywne. Mediany nie określają płac całej firmy.",
    "Amostras pequenas não são estatisticamente representativas. As medianas não definem o salário de toda a empresa.",
    "Mažos imtys nėra statistiškai reprezentatyvios. Medianos nenustato visos įmonės atlygio.",
    "Eșantioanele mici nu sunt reprezentative statistic. Medianele nu stabilesc salariul întregii companii.",
    "Малые выборки статистически нерепрезентативны. Медианы не определяют зарплату всей компании."
  ],
  [
    "At least three drivers are needed to publish a median.",
    "Se necesitan al menos tres conductores para publicar una mediana.",
    "Do publikacji mediany potrzeba co najmniej trzech kierowców.",
    "São necessários pelo menos três motoristas para publicar a mediana.",
    "Medianai skelbti reikia bent trijų vairuotojų.",
    "Sunt necesari cel puțin trei șoferi pentru a publica mediana.",
    "Для публикации медианы нужны минимум три водителя."
  ],
  [
    "No payroll-verified analysis for this firm yet.",
    "Todavía no hay análisis de nóminas de esta empresa.",
    "Brak analizy pasków tej firmy.",
    "Ainda não há análise de recibos desta empresa.",
    "Šios įmonės algalapių analizės dar nėra.",
    "Încă nu există analize ale fluturașilor acestei companii.",
    "Анализа листков этой компании пока нет."
  ],
  [
    "Payroll-verified figures are medians from TruckPay Verified Analysis (three unique slips). They are not driver-reported weekly stubs, and not a single company salary. Two drivers at the same firm may not do equivalent work.",
    "Estas cifras son medianas calculadas con tres nóminas distintas por conductor. Se separan de los registros públicos y no representan un salario único de la empresa. Dos conductores pueden hacer trabajos distintos.",
    "To mediany obliczone z trzech różnych pasków kierowcy, odrębne od danych publicznych. Nie określają jednej płacy firmy. Kierowcy mogą wykonywać różną pracę.",
    "São medianas calculadas com três recibos diferentes por motorista, separadas dos registos públicos. Não representam um salário único da empresa. Os motoristas podem ter funções diferentes.",
    "Tai medianos iš trijų skirtingų kiekvieno vairuotojo algalapių, atskirtos nuo viešų įrašų. Jos nėra vienas įmonės atlygis. Vairuotojai gali dirbti skirtingą darbą.",
    "Sunt mediane calculate din trei fluturași diferiți per șofer, separate de datele publice. Nu reprezintă un salariu unic al companiei. Șoferii pot avea activități diferite.",
    "Это медианы по трём разным листкам каждого водителя, отдельно от открытых записей. Они не определяют единую зарплату компании. Водители могут выполнять разную работу."
  ],
  [
    "High: 10 or more drivers, 15 or more verified payslips, covering more than one pay period.",
    "Alta: al menos 10 conductores y 15 nóminas de varios períodos.",
    "Wysoka: co najmniej 10 kierowców i 15 pasków z więcej niż jednego okresu.",
    "Alta: pelo menos 10 motoristas e 15 recibos de vários períodos.",
    "Aukštas: bent 10 vairuotojų ir 15 algalapių iš kelių laikotarpių.",
    "Ridicată: cel puțin 10 șoferi și 15 fluturași din mai multe perioade.",
    "Высокая: минимум 10 водителей и 15 листков за несколько периодов."
  ],
  [
    "Medium: 3 or more drivers and 9 or more verified payslips.",
    "Media: al menos 3 conductores y 9 nóminas.",
    "Średnia: co najmniej 3 kierowców i 9 pasków.",
    "Média: pelo menos 3 motoristas e 9 recibos.",
    "Vidutinis: bent 3 vairuotojai ir 9 algalapiai.",
    "Medie: cel puțin 3 șoferi și 9 fluturași.",
    "Средняя: минимум 3 водителя и 9 листков."
  ],
  [
    "Low: fewer drivers, fewer slips, a single period, or a cell below the publish threshold.",
    "Baja: pocos conductores o nóminas, un único período o un grupo por debajo del mínimo de publicación.",
    "Niska: niewielu kierowców lub pasków, jeden okres albo grupa poniżej progu publikacji.",
    "Baixa: poucos motoristas ou recibos, um único período ou grupo abaixo do mínimo de publicação.",
    "Žemas: mažai vairuotojų ar algalapių, vienas laikotarpis arba per maža grupė skelbimui.",
    "Scăzută: puțini șoferi sau fluturași, o singură perioadă ori un grup sub pragul de publicare.",
    "Низкая: мало водителей или листков, один период либо группа ниже порога публикации."
  ],
  [
    "Tax (PAYE lines)",
    "Impuesto (líneas PAYE)",
    "Podatek (pozycje PAYE)",
    "Imposto (rubricas PAYE)",
    "Mokestis (PAYE eilutės)",
    "Impozit (rubrici PAYE)",
    "Налог (строки PAYE)"
  ],
  [
    "Pension",
    "Pensión",
    "Emerytura",
    "Pensão",
    "Pensija",
    "Pensie",
    "Пенсия"
  ],
  [
    "Cumulative gross",
    "Bruto acumulado",
    "Brutto narastająco",
    "Bruto acumulado",
    "Sukauptas bruto",
    "Brut cumulat",
    "Накопленное брутто"
  ],
  [
    "Cumulative tax",
    "Impuesto acumulado",
    "Podatek narastająco",
    "Imposto acumulado",
    "Sukauptas mokestis",
    "Impozit cumulat",
    "Накопленный налог"
  ],
  [
    "Cumulative PRSI",
    "PRSI acumulado",
    "PRSI narastająco",
    "PRSI acumulado",
    "Sukauptas PRSI",
    "PRSI cumulat",
    "Накопленный PRSI"
  ],
  [
    "Cumulative USC",
    "USC acumulado",
    "USC narastająco",
    "USC acumulado",
    "Sukauptas USC",
    "USC cumulat",
    "Накопленный USC"
  ],
  [
    "Cumulative pension",
    "Pensión acumulada",
    "Emerytura narastająco",
    "Pensão acumulada",
    "Sukaupta pensija",
    "Pensie cumulată",
    "Накопленная пенсия"
  ],
  [
    "YTD insurable weeks",
    "Semanas cotizadas del año",
    "Tygodnie ubezpieczenia od początku roku",
    "Semanas de contribuição no ano",
    "Draudimo savaitės šiais metais",
    "Săptămâni asigurate în acest an",
    "Страховые недели с начала года"
  ],
  [
    "On the document",
    "En el documento",
    "Na dokumencie",
    "No documento",
    "Dokumente",
    "În document",
    "В документе"
  ],
  [
    "Derived",
    "Calculado",
    "Wyliczone",
    "Calculado",
    "Apskaičiuota",
    "Calculat",
    "Рассчитано"
  ],
  [
    "Not on the document",
    "No figura en el documento",
    "Brak w dokumencie",
    "Não consta no documento",
    "Dokumente nėra",
    "Lipsește din document",
    "Нет в документе"
  ],
  [
    "Advance / recoup",
    "Anticipo / devolución",
    "Zaliczka / zwrot",
    "Adiantamento / recuperação",
    "Avansas / grąžinimas",
    "Avans / recuperare",
    "Аванс / возврат"
  ],
  [
    "Damage",
    "Daños",
    "Szkody",
    "Danos",
    "Žala",
    "Daune",
    "Ущерб"
  ],
  [
    "Uniform",
    "Uniforme",
    "Mundur",
    "Uniforme",
    "Uniforma",
    "Uniformă",
    "Форма"
  ],
  [
    "Accommodation",
    "Alojamiento",
    "Zakwaterowanie",
    "Alojamento",
    "Apgyvendinimas",
    "Cazare",
    "Проживание"
  ],
  [
    "Training",
    "Formación",
    "Szkolenie",
    "Formação",
    "Mokymai",
    "Formare",
    "Обучение"
  ],
  [
    "Legal order",
    "Orden legal",
    "Nakaz prawny",
    "Ordem legal",
    "Teisinis nurodymas",
    "Ordin legal",
    "Правовое предписание"
  ],
  [
    "Unknown — needs review",
    "Desconocido; requiere revisión",
    "Nieznane; wymaga sprawdzenia",
    "Desconhecido; requer revisão",
    "Nežinoma; reikia peržiūros",
    "Necunoscut; necesită verificare",
    "Неизвестно; требуется проверка"
  ],
  [
    "Expected",
    "Esperado",
    "Oczekiwane",
    "Esperado",
    "Tikėtina",
    "Așteptat",
    "Ожидаемое"
  ],
  [
    "On slip",
    "En la nómina",
    "Na pasku",
    "No recibo",
    "Algalapyje",
    "În fluturaș",
    "В листке"
  ],
  [
    "TruckPay Verified Analysis needs your latest {required} payslips. You have {have}.",
    "El análisis necesita tus últimas {required} nóminas. Tienes {have}.",
    "Analiza wymaga ostatnich {required} pasków. Masz {have}.",
    "A análise precisa dos últimos {required} recibos. Tens {have}.",
    "Analizei reikia paskutinių {required} algalapių. Turite {have}.",
    "Analiza necesită ultimii {required} fluturași. Ai {have}.",
    "Для анализа нужны последние {required} листка. У вас {have}."
  ],
  [
    "The latest slips are linked to more than one employer. Use the current employer on each slip.",
    "Las últimas nóminas corresponden a varias empresas. Indica la empresa actual en cada una.",
    "Ostatnie paski dotyczą różnych pracodawców. Wskaż obecnego na każdym pasku.",
    "Os últimos recibos pertencem a várias empresas. Indica a empresa atual em cada um.",
    "Naujausi algalapiai susieti su keliais darbdaviais. Kiekviename nurodykite dabartinį.",
    "Ultimii fluturași sunt asociați mai multor angajatori. Indică angajatorul actual pe fiecare.",
    "Последние листки относятся к разным работодателям. Укажите текущего в каждом."
  ],
  [
    "Link the slips to the current employer so they can be analysed as one job.",
    "Asocia las nóminas a la empresa actual para analizarlas como un mismo empleo.",
    "Powiąż paski z obecnym pracodawcą, aby analizować je jako jedno zatrudnienie.",
    "Associa os recibos à empresa atual para os analisar como um só emprego.",
    "Susiekite algalapius su dabartiniu darbdaviu, kad jie būtų analizuojami kaip vienas darbas.",
    "Asociază fluturașii angajatorului actual pentru a-i analiza ca un singur loc de muncă.",
    "Привяжите листки к текущему работодателю для анализа одного места работы."
  ],
  [
    "Each of the three slips needs a pay period start and end as printed. One slip is not assumed to be one week.",
    "Cada nómina necesita las fechas de inicio y fin del período impreso. No se presupone que una nómina sea una semana.",
    "Każdy pasek wymaga dat początku i końca okresu z dokumentu. Pasek nie oznacza tygodnia.",
    "Cada recibo precisa das datas de início e fim do período impresso. Um recibo não é uma semana.",
    "Kiekvienam algalapiui reikia nurodytų laikotarpio pradžios ir pabaigos datų. Algalapis nelaikomas savaite.",
    "Fiecare fluturaș necesită datele de început și sfârșit tipărite. Un fluturaș nu este considerat o săptămână.",
    "Для каждого листка нужны указанные даты начала и конца периода. Листок не считается неделей."
  ],
  [
    "Employment start date is what you told us. It is not document-verified.",
    "La fecha de inicio es la que indicaste; no está verificada documentalmente.",
    "Data rozpoczęcia pochodzi od Ciebie; nie jest potwierdzona dokumentem.",
    "A data de início foi indicada por ti; não está verificada por documento.",
    "Darbo pradžios datą nurodėte jūs; dokumentu ji nepatvirtinta.",
    "Data începerii a fost declarată de tine; nu este verificată prin documente.",
    "Дата начала указана вами и документально не проверена."
  ],
  [
    "There appears to be a gap between {start} and {end}. Missing periods are flagged; they are not treated as a single week.",
    "Parece faltar un período entre {start} y {end}. Se señala sin asumir que sea una sola semana.",
    "Wygląda na lukę między {start} a {end}. Oznaczamy ją bez uznawania jej za jeden tydzień.",
    "Parece faltar um período entre {start} e {end}. É assinalado sem o tratar como uma só semana.",
    "Atrodo, trūksta laikotarpio tarp {start} ir {end}. Jis pažymimas, bet nelaikomas viena savaite.",
    "Pare să lipsească o perioadă între {start} și {end}. Este semnalată fără a fi considerată o singură săptămână.",
    "Возможно, отсутствует период между {start} и {end}. Он отмечен, но не считается одной неделей."
  ],
  [
    "Read {n} labelled fields. Check every value; missing figures are not guessed. The original file is not retained.",
    "Se han leído {n} campos. Comprueba cada valor; no se inventan los datos que faltan. No se conserva el archivo original.",
    "Odczytano {n} pól. Sprawdź każdą wartość; braków nie zgadujemy. Oryginał nie jest przechowywany.",
    "Foram lidos {n} campos. Confirma cada valor; os dados em falta não são inventados. O original não é guardado.",
    "Nuskaityta {n} laukų. Patikrinkite kiekvieną reikšmę; trūkstami duomenys nespėjami. Originalas nesaugomas.",
    "Au fost citite {n} câmpuri. Verifică fiecare valoare; datele lipsă nu sunt inventate. Originalul nu este păstrat.",
    "Прочитано полей: {n}. Проверьте значения; отсутствующие данные не угадываются. Оригинал не сохраняется."
  ],
  [
    "No labelled figures could be read. Enter the printed values. The original file is not retained.",
    "No se pudieron leer cifras identificadas. Introduce los valores impresos. No se conserva el archivo original.",
    "Nie odczytano oznaczonych kwot. Wpisz wartości z dokumentu. Oryginał nie jest przechowywany.",
    "Não foi possível ler valores identificados. Introduz os valores impressos. O original não é guardado.",
    "Nepavyko nuskaityti pažymėtų sumų. Įveskite spausdintas reikšmes. Originalas nesaugomas.",
    "Nu s-au putut citi cifrele etichetate. Introdu valorile tipărite. Originalul nu este păstrat.",
    "Не удалось прочитать подписанные значения. Введите их с документа. Оригинал не сохраняется."
  ],
  [
    "That file is too large (max 8 MB). The file was not stored.",
    "El archivo supera 8 MB. No se ha guardado.",
    "Plik przekracza 8 MB. Nie został zapisany.",
    "O ficheiro excede 8 MB. Não foi guardado.",
    "Failas viršija 8 MB. Jis neišsaugotas.",
    "Fișierul depășește 8 MB. Nu a fost salvat.",
    "Файл превышает 8 МБ. Он не сохранён."
  ],
  [
    "Use a PDF or a photo (JPG/PNG). The file was not stored.",
    "Usa un PDF o una foto JPG/PNG. No se ha guardado el archivo.",
    "Użyj PDF lub zdjęcia JPG/PNG. Plik nie został zapisany.",
    "Usa um PDF ou uma foto JPG/PNG. O ficheiro não foi guardado.",
    "Naudokite PDF arba JPG/PNG nuotrauką. Failas neišsaugotas.",
    "Folosește PDF sau o fotografie JPG/PNG. Fișierul nu a fost salvat.",
    "Используйте PDF или фото JPG/PNG. Файл не сохранён."
  ],

  [
    "Basic hours are not on this payslip. Missing hours are not confirmed.",
    "No constan las horas base. Esto no confirma que falten horas pagadas.",
    "Brak godzin podstawowych. Nie potwierdza to brakujących opłaconych godzin.",
    "Não constam horas base. Isto não confirma horas por pagar.",
    "Bazinės valandos nenurodytos. Tai nepatvirtina neapmokėtų valandų.",
    "Orele de bază nu sunt indicate. Aceasta nu confirmă ore neplătite.",
    "Основные часы не указаны. Это не подтверждает неоплаченные часы."
  ],
  [
    "Hourly rate is not on this payslip, so it cannot be checked.",
    "No consta la tarifa por hora; no se puede comprobar.",
    "Brak stawki godzinowej; nie można jej sprawdzić.",
    "Não consta a taxa horária; não pode ser verificada.",
    "Valandinis tarifas nenurodytas, todėl jo negalima patikrinti.",
    "Tariful orar nu este indicat, deci nu poate fi verificat.",
    "Ставка в час не указана, поэтому её нельзя проверить."
  ],
  [
    "Overtime hours are not on this payslip. Unpaid overtime is not assumed or confirmed.",
    "No constan horas extra. No se presupone ni confirma que haya horas extra sin pagar.",
    "Brak nadgodzin. Nie zakładamy ani nie potwierdzamy nieopłaconych nadgodzin.",
    "Não constam horas extra. Não se presume nem confirma que existam horas extra por pagar.",
    "Viršvalandžiai nenurodyti. Neapmokėti viršvalandžiai nėra numanomi ar patvirtinami.",
    "Orele suplimentare nu sunt indicate. Nu presupunem și nu confirmăm ore suplimentare neplătite.",
    "Сверхурочные часы не указаны. Неоплаченные сверхурочные не предполагаются и не подтверждаются."
  ],
  [
    "This payslip could not be assigned to a work week from the document. The week was not guessed.",
    "No se pudo asignar una semana de trabajo con los datos del documento. No se ha adivinado.",
    "Dane dokumentu nie pozwalają przypisać tygodnia pracy. Nie zgadujemy go.",
    "Os dados do documento não permitem atribuir uma semana de trabalho. Não foi adivinhada.",
    "Pagal dokumentą darbo savaitės nustatyti nepavyko. Ji nebuvo spėjama.",
    "Datele documentului nu permit atribuirea unei săptămâni de lucru. Nu a fost ghicită.",
    "По документу не удалось определить рабочую неделю. Она не угадывалась."
  ],
  [
    "Not enough reliable information on the document to assign a work week. The week is not guessed from the pay date.",
    "No hay datos fiables suficientes para asignar la semana de trabajo. No se deduce de la fecha de pago.",
    "Za mało wiarygodnych danych do ustalenia tygodnia pracy. Nie zgadujemy go z daty wypłaty.",
    "Faltam dados fiáveis para atribuir a semana de trabalho. Não é deduzida da data de pagamento.",
    "Nepakanka patikimų duomenų darbo savaitei nustatyti. Ji nespėjama pagal mokėjimo datą.",
    "Nu există suficiente date fiabile pentru a atribui săptămâna de lucru. Nu se deduce din data plății.",
    "Недостаточно надёжных данных для рабочей недели. Она не определяется по дате выплаты."
  ],
  [
    "Only a payment date is available (or dates are missing). Payment date is not used to assign a work week because it is often after the week worked.",
    "Solo consta la fecha de pago, o faltan fechas. La fecha de pago no determina la semana trabajada, porque suele ser posterior.",
    "Jest tylko data wypłaty lub brakuje dat. Data wypłaty nie określa tygodnia pracy, bo zwykle następuje później.",
    "Só consta a data de pagamento, ou faltam datas. Essa data não determina a semana trabalhada, pois costuma ser posterior.",
    "Yra tik mokėjimo data arba datų trūksta. Mokėjimo data darbo savaitės nenustato, nes dažnai būna vėlesnė.",
    "Există doar data plății sau lipsesc datele. Data plății nu determină săptămâna lucrată, deoarece este adesea ulterioară.",
    "Есть только дата выплаты либо дат нет. Дата выплаты не определяет рабочую неделю, поскольку часто следует позже."
  ],
  [
    "Expected pay is not calculated: basic hours are not on the document.",
    "No se calcula el pago esperado: faltan las horas base en el documento.",
    "Nie obliczono oczekiwanej płacy: brak godzin podstawowych w dokumencie.",
    "Não se calcula o pagamento esperado: faltam as horas base no documento.",
    "Tikėtinas atlygis neskaičiuojamas: dokumente nėra bazinių valandų.",
    "Plata așteptată nu se calculează: lipsesc orele de bază din document.",
    "Ожидаемая оплата не рассчитана: в документе нет основных часов."
  ],
  [
    "Expected pay is not calculated: hourly rate is not on the document.",
    "No se calcula el pago esperado: falta la tarifa por hora.",
    "Nie obliczono oczekiwanej płacy: brak stawki godzinowej.",
    "Não se calcula o pagamento esperado: falta a taxa horária.",
    "Tikėtinas atlygis neskaičiuojamas: nėra valandinio tarifo.",
    "Plata așteptată nu se calculează: lipsește tariful orar.",
    "Ожидаемая оплата не рассчитана: нет ставки в час."
  ],
  [
    "Expected pay is not calculated: overtime hours are unknown. Zero overtime is not assumed.",
    "No se calcula el pago esperado: se desconocen las horas extra. No se asume que sean cero.",
    "Nie obliczono oczekiwanej płacy: nadgodziny są nieznane. Nie przyjmujemy zera.",
    "Não se calcula o pagamento esperado: as horas extra são desconhecidas. Não se assume zero.",
    "Tikėtinas atlygis neskaičiuojamas: viršvalandžiai nežinomi. Nulis nėra numanomas.",
    "Plata așteptată nu se calculează: orele suplimentare sunt necunoscute. Nu presupunem zero.",
    "Ожидаемая оплата не рассчитана: сверхурочные неизвестны. Ноль не предполагается."
  ],
  [
    "Expected pay is not calculated: overtime hours are present but the overtime rate is not on the document.",
    "No se calcula el pago esperado: constan horas extra, pero falta su tarifa.",
    "Nie obliczono oczekiwanej płacy: są nadgodziny, ale brak ich stawki.",
    "Não se calcula o pagamento esperado: há horas extra, mas falta a respetiva taxa.",
    "Tikėtinas atlygis neskaičiuojamas: viršvalandžiai yra, bet jų tarifo nėra.",
    "Plata așteptată nu se calculează: există ore suplimentare, dar lipsește tariful lor.",
    "Ожидаемая оплата не рассчитана: сверхурочные есть, но их ставка не указана."
  ],
  [
    "Profile could not be loaded. Reload before saving.",
    "No se pudo cargar el perfil. Recarga la página antes de guardar.",
    "Nie udało się wczytać profilu. Odśwież stronę przed zapisem.",
    "Não foi possível carregar o perfil. Recarrega antes de guardar.",
    "Nepavyko įkelti profilio. Prieš saugodami atnaujinkite puslapį.",
    "Profilul nu a putut fi încărcat. Reîncarcă înainte de salvare.",
    "Не удалось загрузить профиль. Обновите страницу перед сохранением."
  ]

] as const;
const localeIndex: Record<Locale, number> = { en: 0, es: 1, pl: 2, pt: 3, lt: 4, ro: 5, ru: 6 };
const catalog = new Map<string, readonly string[]>(uiCopy.map(row => [row[0], row]));

const templates = uiCopy.filter(row => row[0].includes("{")).map(row => {
  const names: string[] = [];
  const parts = row[0].split(/(\{\w+\})/g).map(part => {
    if (/^\{\w+\}$/.test(part)) { names.push(part.slice(1, -1)); return "(.+?)"; }
    return part.replace(/[.*+?^{}$()|[\]\\]/g, "\\$&");
  });
  return { row, names, pattern: new RegExp("^" + parts.join("") + "$") };
});
export function translateUi(locale: Locale, text: string, vars?: Record<string, string | number>): string {
  const direct = catalog.get(text);
  if (direct) return interpolate(direct[localeIndex[locale]], vars);
  for (const { row, names, pattern } of templates) {
    const match = text.match(pattern);
    if (match) return interpolate(row[localeIndex[locale]], Object.fromEntries(names.map((name, i) => [name, match[i + 1]])));
  }
  if (locale === "es") return translateDiagnosticSpanish(text, value => catalog.get(value)?.[1] ?? value) ?? text;
  return text;
}
