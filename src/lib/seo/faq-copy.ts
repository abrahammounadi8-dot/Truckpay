import type { Locale } from "@/lib/i18n";

export type FaqItem = { q: string; a: string };

const pages: Record<
  Locale,
  { kicker: string; title: string; lead: string; items: FaqItem[] }
> = {
  en: {
    kicker: "Ireland · My TruckPay",
    title: "How to find My TruckPay",
    lead: "My TruckPay is the Irish haulage payslip site at mytruckpay.com. It is not truckpay.com, the US job-board and e-ticket app.",
    items: [
      {
        q: "What is My TruckPay?",
        a: "My TruckPay helps haulage drivers in Ireland check a payslip in private. It reads PAYE, PRSI and USC when they are printed. A payment is not assumed to be one week. Three unique slips unlock verified analysis. Company pay on the board comes from filed evidence, never invented reviews.",
      },
      {
        q: "Is My TruckPay the same as truckpay.com?",
        a: "No. truckpay.com is a US company for dump-truck e-tickets, job bids and electronic payments. My TruckPay is only for Irish payroll slips. Our site is mytruckpay.com.",
      },
      {
        q: "How do I search for My TruckPay on Google?",
        a: "Search mytruckpay, My TruckPay Ireland, or Irish haulage payslip. Searching only TruckPay usually shows the US truckpay.com site first. Type mytruckpay.com in the address bar to open this site directly.",
      },
      {
        q: "How do I check an Irish haulage payslip?",
        a: "Open mytruckpay.com, add a payslip PDF or photo, and type the printed figures if the file cannot be read. TruckPay does not store the file. Missing fields stay empty. Nothing is guessed.",
      },
      {
        q: "Does My TruckPay invent pay or reviews?",
        a: "No. Missing payroll fields are stored as empty. Derived figures are labelled derived. Unknown deduction labels stay unknown. The public haulier board shows no pay until a driver files a real slip.",
      },
    ],
  },
  es: {
    kicker: "Irlanda · My TruckPay",
    title: "Cómo encontrar My TruckPay",
    lead: "My TruckPay es la web de nóminas de transporte en Irlanda: mytruckpay.com. No es truckpay.com, la app estadounidense de tickets y trabajos.",
    items: [
      {
        q: "¿Qué es My TruckPay?",
        a: "My TruckPay ayuda a conductores de transporte en Irlanda a revisar una nómina en privado. Lee PAYE, PRSI y USC si vienen impresos. Un pago no se asume como una semana. Tres nóminas únicas abren el análisis verificado. El tablero de empresas no inventa reseñas.",
      },
      {
        q: "¿My TruckPay es lo mismo que truckpay.com?",
        a: "No. truckpay.com es una empresa de EE. UU. de e-tickets y subastas de cargas. My TruckPay es solo para nóminas irlandesas. Nuestra web es mytruckpay.com.",
      },
      {
        q: "¿Cómo busco My TruckPay en Google?",
        a: "Busca mytruckpay, My TruckPay Irlanda o nómina transporte Irlanda. Si buscas solo TruckPay, Google suele mostrar primero truckpay.com. Escribe mytruckpay.com en la barra para entrar directo.",
      },
      {
        q: "¿Cómo reviso una nómina irlandesa de transporte?",
        a: "Entra en mytruckpay.com, añade un PDF o foto de la nómina y escribe las cifras impresas si no se puede leer el archivo. El archivo no se guarda. Los campos que faltan quedan vacíos. No se inventa nada.",
      },
      {
        q: "¿Inventa sueldos o reseñas?",
        a: "No. Los campos que no están en el papel se guardan vacíos. Las cifras derivadas se marcan como derivadas. El tablero público no muestra sueldo hasta que un conductor presente una nómina real.",
      },
    ],
  },
  pl: {
    kicker: "Irlandia · My TruckPay",
    title: "Jak znaleźć My TruckPay",
    lead: "My TruckPay to irlandzka strona do pasków płac w transporcie: mytruckpay.com. To nie truckpay.com — amerykańska aplikacja biletów i zleceń.",
    items: [
      {
        q: "Czym jest My TruckPay?",
        a: "My TruckPay pomaga kierowcom w Irlandii sprawdzić pasek płac prywatnie. Czyta PAYE, PRSI i USC, gdy są nadrukowane. Płatność nie jest jednym tygodniem. Trzy unikalne paski otwierają zweryfikowaną analizę.",
      },
      {
        q: "Czy My TruckPay to to samo co truckpay.com?",
        a: "Nie. truckpay.com to firma z USA. My TruckPay dotyczy tylko irlandzkich pasków. Nasza strona: mytruckpay.com.",
      },
      {
        q: "Jak szukać My TruckPay w Google?",
        a: "Szukaj mytruckpay albo My TruckPay Ireland. Samo TruckPay zwykle pokazuje amerykańską stronę. Wpisz mytruckpay.com w pasku adresu.",
      },
      {
        q: "Jak sprawdzić irlandzki pasek z transportu?",
        a: "Otwórz mytruckpay.com, dodaj PDF lub zdjęcie i wpisz nadrukowane kwoty, jeśli pliku nie da się odczytać. Plik nie jest przechowywany.",
      },
      {
        q: "Czy serwis wymyśla stawki?",
        a: "Nie. Brakujące pola zostają puste. Publiczna tablica firm nie pokazuje płacy, dopóki kierowca nie złoży prawdziwego paska.",
      },
    ],
  },
  pt: {
    kicker: "Irlanda · My TruckPay",
    title: "Como encontrar o My TruckPay",
    lead: "O My TruckPay é o site de recibos de transporte na Irlanda: mytruckpay.com. Não é o truckpay.com, a app dos EUA.",
    items: [
      {
        q: "O que é o My TruckPay?",
        a: "Ajuda motoristas na Irlanda a rever um recibo em privado. Lê PAYE, PRSI e USC quando estão impressos. Um pagamento não é uma semana. Três recibos únicos abrem a análise verificada.",
      },
      {
        q: "É o mesmo que truckpay.com?",
        a: "Não. truckpay.com é dos EUA. O My TruckPay é só para recibos irlandeses. O site é mytruckpay.com.",
      },
      {
        q: "Como procurar no Google?",
        a: "Procura mytruckpay ou My TruckPay Ireland. Só TruckPay costuma mostrar o site americano. Escreve mytruckpay.com na barra.",
      },
      {
        q: "Como rever um recibo irlandês?",
        a: "Abre mytruckpay.com, adiciona PDF ou foto e escreve os valores impressos se o ficheiro não for lido. O ficheiro não é guardado.",
      },
      {
        q: "Inventa salários?",
        a: "Não. Campos em falta ficam vazios. O quadro público não mostra salário até um motorista entregar um recibo real.",
      },
    ],
  },
  lt: {
    kicker: "Airija · My TruckPay",
    title: "Kaip rasti My TruckPay",
    lead: "My TruckPay – Airijos vežėjų algos lapelių svetainė mytruckpay.com. Tai ne JAV truckpay.com.",
    items: [
      {
        q: "Kas yra My TruckPay?",
        a: "Padeda vairuotojams Airijoje privačiai patikrinti algos lapelį. Skaito PAYE, PRSI ir USC, jei jie atspausdinti. Mokėjimas nėra viena savaitė. Trys unikalūs lapeliai atrakina patikrintą analizę.",
      },
      {
        q: "Ar tai tas pats, kas truckpay.com?",
        a: "Ne. truckpay.com yra JAV įmonė. My TruckPay – tik Airijos algos lapeliams. Svetainė: mytruckpay.com.",
      },
      {
        q: "Kaip ieškoti Google?",
        a: "Ieškokite mytruckpay arba My TruckPay Ireland. Vien TruckPay dažnai rodo JAV svetainę. Adreso juostoje rašykite mytruckpay.com.",
      },
      {
        q: "Kaip patikrinti Airijos algos lapelį?",
        a: "Atidarykite mytruckpay.com, įkelkite PDF ar nuotrauką ir įrašykite atspausdintas sumas, jei failo nepavyksta perskaityti.",
      },
      {
        q: "Ar sugalvoja algas?",
        a: "Ne. Trūkstami laukai lieka tušti. Vieša lenta nerodo algos, kol vairuotojas nepateikia tikro lapelio.",
      },
    ],
  },
  ro: {
    kicker: "Irlanda · My TruckPay",
    title: "Cum găsești My TruckPay",
    lead: "My TruckPay este site-ul de fluturași de salariu pentru transport în Irlanda: mytruckpay.com. Nu este truckpay.com din SUA.",
    items: [
      {
        q: "Ce este My TruckPay?",
        a: "Ajută șoferii din Irlanda să verifice un fluturaș în privat. Citește PAYE, PRSI și USC dacă sunt tipărite. O plată nu este o săptămână. Trei fluturași unici deblochează analiza verificată.",
      },
      {
        q: "Este același lucru cu truckpay.com?",
        a: "Nu. truckpay.com e o firmă din SUA. My TruckPay e doar pentru fluturași irlandezi. Site-ul: mytruckpay.com.",
      },
      {
        q: "Cum cauți pe Google?",
        a: "Caută mytruckpay sau My TruckPay Ireland. Doar TruckPay arată de obicei site-ul american. Scrie mytruckpay.com în bară.",
      },
      {
        q: "Cum verific un fluturaș irlandez?",
        a: "Deschide mytruckpay.com, adaugă PDF sau poză și scrie sumele tipărite dacă fișierul nu poate fi citit.",
      },
      {
        q: "Inventează salarii?",
        a: "Nu. Câmpurile lipsă rămân goale. Tabloul public nu arată salariu până când un șofer depune un fluturaș real.",
      },
    ],
  },
  ru: {
    kicker: "Ирландия · My TruckPay",
    title: "Как найти My TruckPay",
    lead: "My TruckPay — сайт расчётных листков для перевозок в Ирландии: mytruckpay.com. Это не американский truckpay.com.",
    items: [
      {
        q: "Что такое My TruckPay?",
        a: "Помогает водителям в Ирландии проверить расчётный листок конфиденциально. Читает PAYE, PRSI и USC, если они напечатаны. Выплата — не одна неделя. Три уникальных листка открывают проверенный анализ.",
      },
      {
        q: "Это то же самое, что truckpay.com?",
        a: "Нет. truckpay.com — компания из США. My TruckPay только для ирландских листков. Сайт: mytruckpay.com.",
      },
      {
        q: "Как искать в Google?",
        a: "Ищите mytruckpay или My TruckPay Ireland. Запрос TruckPay обычно показывает американский сайт. Введите mytruckpay.com в строку адреса.",
      },
      {
        q: "Как проверить ирландский листок?",
        a: "Откройте mytruckpay.com, добавьте PDF или фото и впишите напечатанные суммы, если файл не читается.",
      },
      {
        q: "Выдумывает ли зарплату?",
        a: "Нет. Пустые поля остаются пустыми. Публичная доска не показывает зарплату, пока водитель не подаст настоящий листок.",
      },
    ],
  },
};

export function faqCopy(locale: Locale) {
  return pages[locale] ?? pages.en;
}
