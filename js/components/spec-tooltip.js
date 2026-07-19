const SHOW_DELAY_MS = 400;

const TOOLTIP_ARIA = {
  ru: 'Пояснение к характеристике',
  be: 'Тлумачэнне да характарыстыкі',
  en: 'Characteristic explanation'
};

const TOOLTIP_ALIASES = {
  performance: 'maximumAirflow',
  isInverter: 'inverterTechnology',
  heatingTemp: 'minimumHeatingTemp',
  hasChassis: 'chassis',
  subcategory: 'systemType'
};

const SPEC_TOOLTIPS = {
  ru: {
    systemType:
      'Какой воздух двигает система. Приточная: подаёт свежий воздух с улицы. Вытяжная: удаляет отработанный. Приточно-вытяжная с рекуперацией: и подаёт, и удаляет, возвращая тепло — обычно комфортнее и экономичнее зимой.',
    maximumStaticPressure:
      'Это «сила» вентилятора продавливать воздух по трубам. Если воздуховоды длинные, с поворотами или фильтрами — нужно более высокое давление. Слишком низкое значение: на дальних решётках воздуха почти не будет.',
    recuperatorType:
      'Рекуператор забирает тепло у воздуха, который уходит на улицу, и отдаёт его свежему притоку — так меньше греете дом зимой. Пластинчатый: проще и надёжнее, хорошо держит влажность (энтальпийный). Роторный: обычно возвращает больше тепла, чуть сложнее в обслуживании. Без рекуператора приток зимой холодный и дорогой в подогреве.',
    recoveryEfficiency:
      'Какой процент тепла удаётся вернуть из вытяжки. 70–85% — норма для хорошей системы: чем выше %, тем ниже счета за обогрев приточного воздуха.',
    heaterPower:
      'Мощность догревателя притока. Нужна, когда на улице очень холодно и рекуператора не хватает. Больше кВт — быстрее прогревает воздух, но выше нагрузка на электросеть.',
    heaterType:
      'Чем греют приточный воздух. Электрический: проще подключить, работает везде, но электричество дороже. Жидкостный (водяной): экономичнее в эксплуатации, если уже есть отопление/котёл, но монтаж сложнее — нужны трубы и теплоноситель.',
    winterTemp:
      'До какой уличной температуры установка рассчитана стабильно работать. −25 °C хватит для мягкой зимы; −35…−45 °C — для сильных морозов. Если выбрать «слабее», чем климат у вас, зимой возможны обмерзания и слабый приток.',
    equipmentType:
      'Компактная: один небольшой блок, быстрый монтаж, для квартиры/офиса/небольшого дома. Центральная: мощнее и для большой сети воздуховодов по всему зданию, но дороже и сложнее в установке. Выбирайте компактную для локальной задачи, центральную — для целого объекта.',
    area:
      'На какую площадь рассчитана модель. Берите с небольшим запасом: если площадь больше — воздух будет обновляться хуже, система будет работать на пределе.',
    maximumAirflow:
      'Сколько кубометров воздуха установка прогоняет за час. Больше м³/ч — быстрее проветривание и комфортнее в большом помещении. Слишком мощная для маленькой комнаты — шумнее и дороже без нужды.',
    powerType:
      'Какая сеть нужна. 220 В — обычная розетка/однофазная линия в квартире или доме. 380 В — трёхфазная сеть, чаще для мощных центральных установок. Неверный выбор = нельзя подключить без переделки электрики.',
    bodyMaterial:
      'Оцинкованная сталь: прочнее, лучше для канальных/центральных систем и долгой работы. Полипропилен: легче и дешевле, чаще у компактных блоков, но менее «тяжёлая» прочность. На шум и срок службы в первую очередь влияет качество сборки, но сталь обычно долговечнее в жёстких условиях.',
    installType:
      'Куда ставят внутренний блок кондиционера. Настенный: самый популярный и доступный, вешается на стену, быстро монтируется — идеален для комнаты/квартиры; минус — блок виден. Канальный: прячется за потолком и раздаёт воздух по решёткам — почти незаметен, ровный климат в нескольких зонах, но дороже и нужен подвесной потолок. Кассетный: встраивается в потолок (часто в офисах/залах), обдувает в стороны, хорошо для больших помещений; тоже нужен потолок и аккуратный монтаж.',
    color:
      'Цвет лицевой панели внутреннего блока. На охлаждение не влияет — только внешний вид. Белый универсален; тёмные и цветные варианты удобны, если хочется, чтобы блок меньше выделялся в интерьере.',
    hasWifi:
      'Есть: управляете со смартфона (температура, режим, таймеры), даже удалённо. Нет: только пульт. Wi‑Fi удобен, если часто меняете настройки или хотите включать кондиционер по дороге домой.',
    hasSmartHome:
      'Есть: можно встроить в умный дом (сценарии «ушёл — выключил», голосовые помощники и т.п.). Нет: работает сам по себе. Нужно только если у вас уже есть или планируется умный дом.',
    mountType:
      'Как ставят осушитель. Напольный: поставил и включил, можно переносить — просто, но занимает место. Настенный: экономит пол, постоянно на одном месте. Канальный: скрыт в вентиляции, незаметен и для больших зон, но монтаж сложнее и дороже.',
    nominalCurrent:
      'Ток в обычной работе (амперы). По нему подбирают автомат и кабель. Если ток больше, чем позволяет ваша линия — будут выбивать пробки или нужен отдельный ввод.',
    maxPower:
      'Пиковое потребление электричества. Важно сравнить с лимитом вашей сети. Мощнее модель — выше расход и требования к проводке, но и запас по нагрузке больше.',
    inverterTechnology:
      'Инвертор: компрессор не «вкл/выкл», а плавно меняет мощность — температура ровнее, тише, обычно меньше расход электричества, чуть дороже покупка. Обычный (не инвертор): дешевле при покупке, но чаще шумит рывками и тратит больше энергии.',
    refrigerant:
      'Фреон внутри контура. От типа зависят эффективность, экология и правила сервиса. На бытовом уровне важнее, чтобы тип совпадал с тем, что обслуживает ваш мастер; «новый» фреон часто экологичнее.',
    coolingPower:
      'Сколько холода кондиционер реально отдаёт в комнату (кВт холода), а не сколько ест из розетки. Мало кВт на большую комнату — не вытянет жару. Слишком много — лишние деньги и короткое цикличное включение.',
    heatingPower:
      'Сколько тепла даёт в режиме обогрева. Зимой смотрите на это число и на минимальную уличную температуру — иначе в мороз греть будет слабо.',
    minimumHeatingTemp:
      'До какого мороза на улице кондиционер ещё уверенно греет. Например, до −15 °C и до −25 °C — большая разница для нашей зимы. Ниже предела обогрев падает или отключается.',
    minimumCoolingTemp:
      'До какой уличной температуры можно включать охлаждение. Нужно, если хотите холодить серверную/помещение весной и осенью, когда на улице уже прохладно.',
    airflow:
      'Сколько воздуха гоняет осушитель/блок за час. Больше поток — быстрее сушит и лучше перемешивает воздух в большом помещении; в маленьком избыток может быть шумнее.',
    moistureRemoval:
      'Сколько литров влаги убирает за сутки. Для бассейна или сырого помещения берите выше; для небольшой ванной/кладовой хватит скромного значения. Слишком слабый осушитель будет работать без конца и не доведёт влажность до нормы.',
    protectionClass:
      'IP — защита от пыли и брызг. Для влажных зон (бассейн, мойка) нужен выше класс, иначе электроника быстрее выйдет из строя.',
    drainPump:
      'Есть насос: конденсат откачивается вверх/далеко, если нельзя сделать слив самотёком. Нет насоса: нужен уклон труб вниз к канализации. Без правильного слива вода будет переливаться.',
    chassis:
      'Есть колёса: удобно передвигать напольный осушитель. Нет: стоит стационарно. Выбирайте с шасси, если будете часто менять место.'
  },
  be: {
    systemType:
      'Якое паветра рухае сістэма. Прытокавая: падае свежае паветра з вуліцы. Выцяжная: выдаляе адпрацаванае. Прытокава-выцяжная з рэкуперацыяй: і падае, і выдаляе, вяртаючы цяпло — звычайна камфортней і эканамічней зімой.',
    maximumStaticPressure:
      'Гэта «сіла» вентылятара прадаўліваць паветра па трубах. Калі паветраводы доўгія, з паваротамі ці фільтрамі — патрэбны вышэйшы ціск. Занадта нізкае значэнне: на далёкіх рашотках паветра амаль не будзе.',
    recuperatorType:
      'Рэкуператар забірае цяпло ў паветра, якое сыходзіць на вуліцу, і аддае яго свежаму прытоку — так менш грэеце дом зімой. Пласціністы: прасцейшы і надзейнейшы, добра трымае вільготнасць (энтальпійны). Ротарны: звычайна вяртае больш цяпла, крыху складанейшы ў абслугоўванні. Без рэкуператара прыток зімой халодны і дарагі ў падагрэве.',
    recoveryEfficiency:
      'Які адсотак цяпла ўдаецца вярнуць з выцяжкі. 70–85% — норма для добрай сістэмы: чым вышэй %, тым ніжэйшыя рахункі за абагрэў прытокавага паветра.',
    heaterPower:
      'Магутнасць дагравальніка прытоку. Патрэбна, калі на вуліцы вельмі холадна і рэкуператара не хапае. Больш кВт — хутчэй прагравае паветра, але вышэй нагрузка на электрасеть.',
    heaterType:
      'Чым грэюць прытокавае паветра. Электрычны: прасцей падключыць, працуе ўсюды, але электрычнасць даражэйшая. Вадкасны (вадзяны): эканамічнейшы ў эксплуатацыі, калі ўжо ёсць ацяпленне/кацёл, але мантаж складанейшы — патрэбныя трубы і цепланосьбіт.',
    winterTemp:
      'Да якой вулічнай тэмпературы ўстаноўка разлічана стабільна працаваць. −25 °C хопіць для мяккай зімы; −35…−45 °C — для моцных маразоў. Калі выбраць «слабей», чым клімат у вас, зімой магчымыя абмярзанні і слабы прыток.',
    equipmentType:
      'Кампактная: адзін невялікі блок, хуткі мантаж, для кватэры/офіса/невялікага дома. Цэнтральная: мацнейшая і для вялікай сеткі паветраводаў па ўсім будынку, але даражэйшая і складанейшая ў усталёўцы. Выбірайце кампактную для лакальнай задачы, цэнтральную — для цэлага аб’екта.',
    area:
      'На якую плошчу разлічана мадэль. Бярыце з невялікім запасам: калі плошча большая — паветра будзе абнаўляцца горш, сістэма будзе працаваць на мяжы.',
    maximumAirflow:
      'Колькі кубаметраў паветра ўстаноўка праганяе за гадзіну. Больш м³/г — хутчэйшае праветрыванне і камфортней у вялікім памяшканні. Занадта магутная для маленькага пакоя — шумней і даражэй без патрэбы.',
    powerType:
      'Якая сетка патрэбна. 220 В — звычайная разетка/аднафазная лінія ў кватэры ці доме. 380 В — трохфазная сетка, часцей для магутных цэнтральных установак. Няправільны выбар = нельга падключыць без пераробкі электрыкі.',
    bodyMaterial:
      'Ацынкаваная сталь: трывалейшая, лепш для канальных/цэнтральных сістэм і доўгай працы. Поліпрапілен: лягчэйшы і таннейшы, часцей у кампактных блоках, але менш «цяжкая» трываласць. На шум і тэрмін службы ў першую чаргу ўплывае якасць зборкі, але сталь звычайна даўгавечнейшая ў жорсткіх умовах.',
    installType:
      'Куды ставяць унутраны блок кандцыянера. Насценны: самы папулярны і даступны, вешаецца на сцяну, хутка мантуецца — ідэальны для пакоя/кватэры; мінус — блок відаць. Канальны: хаваецца за столлю і раздае паветра па рашотках — амаль незаўважны, роўны клімат у некалькіх зонах, але даражэйшы і патрэбна падвесная столля. Касетны: убудоўваецца ў столлю (часта ў офісах/залах), абдзімае ў бакі, добра для вялікіх памяшканняў; таксама патрэбна столля і акуратны мантаж.',
    color:
      'Колер пярэдняй панэлі ўнутранага блока. На ахалоджванне не ўплывае — толькі знешні выгляд. Белы ўніверсальны; цёмныя і каляровыя варыянты зручныя, калі хочацца, каб блок менш вылучаўся ў інтэр’еры.',
    hasWifi:
      'Ёсць: кіруеце са смартфона (тэмпература, рэжым, таймеры), нават аддалена. Няма: толькі пульт. Wi‑Fi зручны, калі часта мяняеце налады ці хочаце ўключаць кандцыянер па дарозе дадому.',
    hasSmartHome:
      'Ёсць: можна ўбудаваць у разумны дом (сцэнарыі «сышоў — выключыў», галасавыя памочнікі і г.д.). Няма: працуе сам па сабе. Патрэбна толькі калі ў вас ужо ёсць ці плануецца разумны дом.',
    mountType:
      'Як ставяць асушальнік. Падлогавы: паставіў і ўключыў, можна пераносіць — проста, але займае месца. Насценны: эканоміць падлогу, пастаянна на адным месцы. Канальны: схаваны ў вентыляцыі, незаўважны і для вялікіх зон, але мантаж складанейшы і даражэйшы.',
    nominalCurrent:
      'Ток у звычайнай працы (амперы). Па ім падбіраюць аўтамат і кабель. Калі ток большы, чым дазваляе ваша лінія — будуць выбіваць пробкі ці патрэбны асобны ўвод.',
    maxPower:
      'Пікавае спажыванне электрычнасці. Важна параўнаць з лімітам вашай сеткі. Мацнейшая мадэль — вышэйшы расход і патрабаванні да праводкі, але і запас па нагрузцы большы.',
    inverterTechnology:
      'Інвертар: кампрэсар не «укл/выкл», а плаўна мяняе магутнасць — тэмпература роўнейшая, цішэй, звычайна меншы расход электрычнасці, крыху даражэйшая купля. Звычайны (не інвертар): таннейшы пры куплі, але часцей шуміць рыўкамі і траціць больш энергіі.',
    refrigerant:
      'Фрэон унутры контуру. Ад тыпу залежаць эфектыўнасць, экалогія і правілы сэрвісу. На бытавым узроўні важней, каб тып супадаў з тым, што абслугоўвае ваш майстар; «новы» фрэон часта экалагічнейшы.',
    coolingPower:
      'Колькі холаду кандцыянер рэальна аддае ў пакой (кВт холаду), а не колькі есць з разеткі. Мала кВт на вялікі пакой — не выцягне спёку. Занадта шмат — лішнія грошы і кароткае цыклічнае ўключэнне.',
    heatingPower:
      'Колькі цяпла дае ў рэжыме абагрэву. Зімой глядзіце на гэтае лік і на мінімальную вулічную тэмпературу — інакш у мароз грэць будзе слаба.',
    minimumHeatingTemp:
      'Да якога марозу на вуліцы кандцыянер яшчэ ўпэўнена грэе. Напрыклад, да −15 °C і да −25 °C — вялікая розніца для нашай зімы. Ніжэй за мяжу абагрэў падае ці адключаецца.',
    minimumCoolingTemp:
      'Да якой вулічнай тэмпературы можна ўключаць ахалоджванне. Патрэбна, калі хочаце халадзіць серверную/памяшканне вясной і восенню, калі на вуліцы ўжо прахалодна.',
    airflow:
      'Колькі паветра гоніць асушальнік/блок за гадзіну. Большы паток — хутчэй сушыць і лепш перамешвае паветра ў вялікім памяшканні; у маленькім лішак можа быць шумней.',
    moistureRemoval:
      'Колькі літраў вільгаці прыбірае за суткі. Для басейна ці сырога памяшкання бярыце вышэй; для невялікай ваннай/кладоўкі хопіць сціплага значэння. Занадта слабы асушальнік будзе працаваць бясконца і не давядзе вільготнасць да нормы.',
    protectionClass:
      'IP — абарона ад пылу і пырскаў. Для вільготных зон (басейн, мойка) патрэбны вышэйшы клас, інакш электроніка хутчэй выйдзе з ладу.',
    drainPump:
      'Ёсць помпа: кандэнсат адпампоўваецца ўверх/далёка, калі нельга зрабіць зліў самацёкам. Няма помпы: патрэбны ўхіл труб уніз да каналізацыі. Без правільнага зліву вада будзе пералівацца.',
    chassis:
      'Ёсць колы: зручна перасоўваць падлогавы асушальнік. Няма: стаіць стацыянарна. Выбірайце з шасі, калі будзеце часта мяняць месца.'
  },
  en: {
    systemType:
      'Which air the system moves. Supply: brings in fresh outdoor air. Exhaust: removes stale air. Supply-exhaust with recovery: does both and returns heat — usually more comfortable and cheaper to run in winter.',
    maximumStaticPressure:
      'How hard the fan can push air through ducts. Long runs, bends, or filters need higher pressure. Too low, and far grilles get almost no airflow.',
    recuperatorType:
      'A recuperator takes heat from air leaving the building and gives it to fresh supply air — so you heat less in winter. Plate: simpler and reliable, good at holding humidity (enthalpy type). Rotary: usually recovers more heat, a bit more to service. Without recovery, winter supply air is cold and expensive to reheat.',
    recoveryEfficiency:
      'What share of heat is returned from exhaust air. 70–85% is typical for a good system: higher % means lower bills to warm the supply air.',
    heaterPower:
      'Reheater power for supply air. Needed when it is very cold outside and recovery is not enough. More kW warms air faster but loads the electrical supply more.',
    heaterType:
      'How supply air is reheated. Electric: easier to connect, works anywhere, but electricity costs more. Liquid (water): cheaper to run if you already have heating/a boiler, but harder to install — pipes and a heat medium are required.',
    winterTemp:
      'Lowest outdoor temperature the unit is designed to handle reliably. −25 °C suits milder winters; −35…−45 °C suits hard frost. Choose too weak for your climate and you risk icing and weak supply airflow.',
    equipmentType:
      'Compact: one small unit, faster install, for an apartment/office/small house. Central: stronger and meant for a large duct network across a building, but costlier and harder to install. Pick compact for a local job, central for a whole site.',
    area:
      'Room area the model is sized for. Allow a little headroom: if the room is larger, air refresh will be weaker and the unit will run at its limit.',
    maximumAirflow:
      'Cubic metres of air moved per hour. Higher m³/h means faster ventilation and better comfort in a large room. Oversized for a small room means more noise and cost without benefit.',
    powerType:
      'Which electrical supply is required. 220 V — normal single-phase home supply. 380 V — three-phase, more often for powerful central units. Wrong choice means you cannot connect without rewiring.',
    bodyMaterial:
      'Galvanized steel: tougher, better for duct/central systems and long duty. Polypropylene: lighter and cheaper, common on compact units, less “heavy-duty”. Build quality drives noise and life most, but steel usually lasts longer in harsh conditions.',
    installType:
      'Where the indoor AC unit goes. Wall-mounted: most popular and affordable, hangs on the wall, quick to install — ideal for a room/apartment; downside — the unit is visible. Ducted: hidden above the ceiling and feeds grilles — nearly invisible, even climate across zones, but costlier and needs a false ceiling. Cassette: built into the ceiling (offices/halls), blows sideways, good for large rooms; also needs a ceiling and careful install.',
    color:
      'Front panel colour of the indoor unit. Does not change cooling — only looks. White is universal; darker/coloured options help the unit blend into the interior.',
    hasWifi:
      'Yes: control from a phone (temperature, mode, timers), even remotely. No: remote only. Wi‑Fi helps if you change settings often or want to turn the AC on before you get home.',
    hasSmartHome:
      'Yes: can join a smart home (away modes, voice assistants, etc.). No: works on its own. Only needed if you already have or plan a smart home.',
    mountType:
      'How the dehumidifier is placed. Floor: plug and play, movable — simple, but takes floor space. Wall: frees the floor, stays fixed. Ducted: hidden in ventilation, discreet and good for larger zones, but install is harder and costlier.',
    nominalCurrent:
      'Current in normal operation (amps). Used to size the breaker and cable. If it exceeds your circuit, breakers will trip or you need a dedicated line.',
    maxPower:
      'Peak electrical draw. Compare with your supply limit. A stronger model uses more power and needs better wiring, but has more capacity headroom.',
    inverterTechnology:
      'Inverter: the compressor ramps smoothly instead of on/off — steadier temperature, quieter, usually lower power use, slightly higher purchase price. Non-inverter: cheaper to buy, but often noisier in bursts and uses more energy.',
    refrigerant:
      'The freon in the circuit. Type affects efficiency, environment, and service rules. Day to day, match what your technician supports; newer refrigerants are often greener.',
    coolingPower:
      'How much cooling the AC delivers to the room (kW of cooling), not wall-socket watts. Too little for a large room will not beat the heat. Too much costs more and short-cycles.',
    heatingPower:
      'How much heat it gives in heating mode. In winter check this number and the minimum outdoor temperature — otherwise heating will be weak in frost.',
    minimumHeatingTemp:
      'How cold it can be outside while heating still works well. −15 °C vs −25 °C is a big difference in our winters. Below the limit, heating drops or stops.',
    minimumCoolingTemp:
      'Lowest outdoor temperature for cooling mode. Matters if you need to cool a server room/space in spring or autumn when outdoors is already cool.',
    airflow:
      'Air moved per hour by the dehumidifier/unit. Higher flow dries faster and mixes air better in large rooms; in a small room excess can mean more noise.',
    moistureRemoval:
      'Litres of moisture removed per day. For a pool or damp room pick higher; a small bathroom/storage can use a modest value. Too weak and it will run constantly without reaching a healthy humidity.',
    protectionClass:
      'IP rating against dust and splashes. Wet areas (pool, wash zones) need a higher class or electronics fail sooner.',
    drainPump:
      'With pump: condensate can be lifted/pushed far when gravity drain is impossible. Without: pipes must slope down to a drain. Bad drainage means overflow.',
    chassis:
      'With wheels: easy to move a floor dehumidifier. Without: stays fixed. Choose chassis if you will relocate it often.'
  }
};

function prefersHover() {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

function resolveTooltipKey(key) {
  return TOOLTIP_ALIASES[key] || key;
}

function getTooltipText(key, lang = 'ru') {
  const resolvedKey = resolveTooltipKey(key);
  return SPEC_TOOLTIPS[lang]?.[resolvedKey] || SPEC_TOOLTIPS.ru[resolvedKey] || '';
}

export function hasSpecTooltip(key) {
  return Boolean(getTooltipText(key, 'ru'));
}

export function renderSpecTooltipTrigger(key, lang = 'ru') {
  const text = getTooltipText(key, lang);

  if (!text) {
    return '';
  }

  const aria = TOOLTIP_ARIA[lang] || TOOLTIP_ARIA.ru;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'spec-tooltip';
  button.dataset.specTooltip = '';
  button.setAttribute('aria-label', aria);

  const icon = document.createElement('span');
  icon.className = 'spec-tooltip__icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.innerHTML = `
    <svg class="spec-tooltip__svg" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="8.25" stroke="currentColor" stroke-width="1.5"/>
      <path d="M10 9v4.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
      <circle cx="10" cy="6.4" r="1.05" fill="currentColor"/>
    </svg>
  `;

  const bubble = document.createElement('span');
  bubble.className = 'spec-tooltip__bubble';
  bubble.setAttribute('role', 'tooltip');
  bubble.textContent = text;

  button.append(icon, bubble);

  const wrap = document.createElement('div');
  wrap.append(button);
  return wrap.innerHTML;
}

export function initSpecTooltips(root) {
  if (!root || root.dataset.specTooltipsReady === 'true') {
    return;
  }

  root.dataset.specTooltipsReady = 'true';

  let showTimer = null;
  let openTooltipEl = null;

  const clearBubblePosition = (tooltip) => {
    const bubble = tooltip?.querySelector('.spec-tooltip__bubble');

    if (!bubble) {
      return;
    }

    bubble.removeAttribute('data-placement');
    bubble.style.left = '';
    bubble.style.top = '';
    bubble.style.setProperty('--arrow-left', '');
  };

  const positionBubble = (tooltip) => {
    const bubble = tooltip.querySelector('.spec-tooltip__bubble');

    if (!bubble) {
      return;
    }

    const margin = 10;
    const gap = 10;
    const triggerRect = tooltip.getBoundingClientRect();

    bubble.style.left = '0px';
    bubble.style.top = '0px';

    const bubbleRect = bubble.getBoundingClientRect();
    let left = triggerRect.left + triggerRect.width / 2 - bubbleRect.width / 2;
    let top = triggerRect.top - bubbleRect.height - gap;
    let placement = 'above';

    if (top < margin) {
      top = triggerRect.bottom + gap;
      placement = 'below';
    }

    left = Math.max(margin, Math.min(left, window.innerWidth - bubbleRect.width - margin));

    if (top + bubbleRect.height > window.innerHeight - margin && placement === 'below') {
      top = Math.max(margin, triggerRect.top - bubbleRect.height - gap);
      placement = 'above';
    }

    const arrowLeft = triggerRect.left + triggerRect.width / 2 - left;

    bubble.dataset.placement = placement;
    bubble.style.left = `${Math.round(left)}px`;
    bubble.style.top = `${Math.round(top)}px`;
    bubble.style.setProperty('--arrow-left', `${Math.round(arrowLeft)}px`);
  };

  const openTooltip = (tooltip) => {
    if (openTooltipEl && openTooltipEl !== tooltip) {
      clearBubblePosition(openTooltipEl);
      openTooltipEl.classList.remove('is-open');
    }

    tooltip.classList.add('is-open');
    openTooltipEl = tooltip;
    positionBubble(tooltip);
  };

  const closeTooltip = (tooltip) => {
    if (!tooltip) {
      return;
    }

    clearBubblePosition(tooltip);
    tooltip.classList.remove('is-open');

    if (openTooltipEl === tooltip) {
      openTooltipEl = null;
    }
  };

  const closeAll = () => {
    window.clearTimeout(showTimer);
    showTimer = null;

    if (openTooltipEl) {
      closeTooltip(openTooltipEl);
    }
  };

  const repositionOpen = () => {
    if (openTooltipEl) {
      positionBubble(openTooltipEl);
    }
  };

  root.addEventListener('mouseover', (event) => {
    if (!prefersHover()) {
      return;
    }

    const tooltip = event.target.closest('.spec-tooltip');

    if (!tooltip || !root.contains(tooltip)) {
      return;
    }

    if (event.relatedTarget && tooltip.contains(event.relatedTarget)) {
      return;
    }

    if (openTooltipEl === tooltip) {
      return;
    }

    window.clearTimeout(showTimer);
    showTimer = window.setTimeout(() => openTooltip(tooltip), SHOW_DELAY_MS);
  });

  root.addEventListener('mouseout', (event) => {
    if (!prefersHover()) {
      return;
    }

    const tooltip = event.target.closest('.spec-tooltip');

    if (!tooltip || !root.contains(tooltip)) {
      return;
    }

    if (tooltip.contains(event.relatedTarget)) {
      return;
    }

    window.clearTimeout(showTimer);
    showTimer = null;
    closeTooltip(tooltip);
  });

  root.addEventListener('click', (event) => {
    const tooltip = event.target.closest('.spec-tooltip');

    if (tooltip && root.contains(tooltip)) {
      event.preventDefault();
      event.stopPropagation();

      if (openTooltipEl === tooltip) {
        closeTooltip(tooltip);
      } else {
        window.clearTimeout(showTimer);
        openTooltip(tooltip);
      }

      return;
    }

    closeAll();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeAll();
    }
  });

  window.addEventListener('resize', repositionOpen);
  window.addEventListener('scroll', repositionOpen, true);
}
