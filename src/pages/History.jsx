import { Link } from 'react-router-dom';
import { Img, SiteImg } from '../components/Art.jsx';

const ORIGINS = [
  { slot: 'origin-1', scene: 'warm', text: 'Троянди з Болгарії — одна з найдавніших і найцінніших нот у парфюмерії.' },
  { slot: 'origin-2', scene: 'light', text: 'Лаванда з Провансу — символ спокою і джерело однієї з найвідоміших квіткових нот.' },
  { slot: 'origin-3', scene: 'dark', text: 'Бергамот з Калабрії — цитрусовий акцент, який надає аромату світло і прозорість.' },
];

// Позиції точок на карті (у % від ширини/висоти зображення карти), як у макеті.
const PLACES = [
  { name: 'Болгарія', note: 'Троянди', x: 25.6, y: 39.3 },
  { name: 'Прованс', note: 'Лаванда', x: 43.5, y: 49.2 },
  { name: 'Калабрія', note: 'Бергамот', x: 52.5, y: 60.4 },
  { name: 'Оман', note: 'Мирра', x: 57.7, y: 67.4 },
];

const TIMELINE = [
  {
    year: '3000 до н.е.',
    title: 'Давній Єгипет',
    text: 'Благовоння та ароматичні олії використовувалися для ритуалів та оздоблення. Перші записи про парфумерне мистецтво з’явилися на єгипетських папірусах.',
    slot: 'timeline-1',
    scene: 'warm',
  },
  {
    year: '500 до н.е.',
    title: 'Давня Греція',
    text: 'Аромати стають частиною повсякденного життя. Греки використовують оливкову олію як основу для з’єднання ефірних масел.',
    slot: 'timeline-2',
    scene: 'rose',
  },
  {
    year: '1920-ті',
    title: 'Золота доба парфюмерії',
    text: 'Коко Шанель та Гуерлен запускають іконічні аромати, які змінюють обличчя моди та парфюмерії назавжди.',
    slot: 'timeline-3',
    scene: 'dark',
  },
];

export default function History() {
  return (
    <div className="history">
      <section className="h-hero">
        <SiteImg slot="history-hero" alt="Флакон парфуму на тлі світлого інтер’єру" scene="warm" label="Від благовоній до нот" />
        <div className="h-hero-overlay" />
        <Link to="/" className="h-home logo">
          DeLas
        </Link>
        <div className="h-hero-copy">
          <p className="eyebrow eyebrow--light">Історія парфюмерії</p>
          <h1>Від благовоній до нот</h1>
          <a href="#disassembly" className="h-scroll">
            Проведіть вниз
          </a>
        </div>
      </section>

      <section className="h-section" id="disassembly">
        <div className="h-container">
          <Head eyebrow="Розбірка" title="Як флакон розкривається у часі" />
          <div className="h-flacon">
            <div className="h-flacon-main">
              <SiteImg slot="history-flacon" alt="Бурштиновий флакон крупним планом" scene="warm" label="Флакон" />
            </div>
            <p className="h-lead">
              Флакон як об’єкт. Сучасна парфюмерія починається з естетики. Кожен контур, кожна кривина — результат тисяч років
              розвитку ремесла.
            </p>
            <p className="h-lead muted">
              Нижче — одна і та ж композиція: флакон розкладається на частини, а частини ведуть до джерел ароматів.
            </p>
          </div>
          <div className="h-three">
            <Fig slot="part-1" scene="light" text="Кожна частина флакона — результат тисяч років розвитку ремесла." />
            <Fig slot="part-2" scene="warm" text="Есенція — душа парфюму, складена з сотень нот, кожна з яких має свою географію та історію." />
            <Fig slot="part-3" scene="rose" text="Скло, форма, дизайн — все це розвивалося століттями, поки не стало сучасним флаконом." />
          </div>
        </div>
      </section>

      <section className="h-section h-section--tint">
        <div className="h-container">
          <Head eyebrow="Походження" title="Карта ароматів" />
          <div className="h-three">
            {ORIGINS.map((o) => (
              <Fig key={o.slot} {...o} />
            ))}
          </div>
        </div>
        <div className="h-map-band">
          <div className="h-map">
            <Img src="/images/site/history-map.jpg" alt="" className="cover h-map-img" fallback={<MapArt />} />
            {PLACES.map((p) => {
              return (
                <div key={p.name} className="h-pin" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                  <span className="h-pin-dot" />
                  <span className="h-pin-label">
                    <b>{p.name}</b>
                    {p.note}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <ul className="h-places">
          {PLACES.map((p) => (
            <li key={p.name}>
              <b>{p.name}</b>
              <span>{p.note}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="h-section">
        <div className="h-container">
          <Head eyebrow="Хронологія" title="Парфюмерія у часі" />
          <ol className="timeline">
            {TIMELINE.map((t, i) => (
              <li key={t.year}>
                <span className="tl-year">{t.year}</span>
                <span className="tl-dot">{i + 1}</span>
                <div className="tl-body">
                  <h3>{t.title}</h3>
                  <p className="muted">{t.text}</p>
                  <div className="tl-media">
                    <SiteImg slot={t.slot} alt={t.title} scene={t.scene} label={t.title} />
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <div className="center">
            <Link to="/catalog" className="btn btn-dark">
              Перейти до ароматів
            </Link>
          </div>
        </div>
      </section>

      <footer className="h-footer">
        <p className="h-footer-title">Від благовоній до нот</p>
        <p>© {new Date().getFullYear()} DeLas Parfume. Вся історія в одному флаконі.</p>
      </footer>
    </div>
  );
}

function Head({ eyebrow, title }) {
  return (
    <div className="h-head">
      <p className="eyebrow eyebrow--muted">{eyebrow}</p>
      <h2>{title}</h2>
    </div>
  );
}

function Fig({ slot, scene, text }) {
  return (
    <figure className="h-fig">
      <div className="h-fig-media">
        <SiteImg slot={slot} alt={text} scene={scene} />
      </div>
      <figcaption>{text}</figcaption>
    </figure>
  );
}

function MapArt() {
  return (
    <svg className="cover h-map-img" viewBox="0 0 820 500" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <pattern id="mapdots" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.4" fill="#c9b08a" opacity=".55" />
        </pattern>
      </defs>
      <rect width="820" height="500" fill="#f3ead9" />
      <rect width="820" height="500" fill="url(#mapdots)" />
      {[1, 2, 3, 4].map((i) => (
        <line key={`h${i}`} x1="0" x2="820" y1={i * 100} y2={i * 100} stroke="#d8c6a6" strokeDasharray="4 6" />
      ))}
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <line key={`v${i}`} y1="0" y2="500" x1={i * 102} x2={i * 102} stroke="#d8c6a6" strokeDasharray="4 6" />
      ))}
    </svg>
  );
}
