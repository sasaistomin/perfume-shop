import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { money } from '../lib/format.js';

export function OrderDone() {
  const { id } = useParams();
  const { state } = useLocation();
  return (
    <section className="section">
      <div className="container narrow done">
        <CheckCircle2 size={56} strokeWidth={1.3} className="gold" />
        <p className="eyebrow">Замовлення прийнято</p>
        <h1>Дякуємо{state?.name ? `, ${state.name.split(' ')[0]}` : ''}!</h1>
        <p className="lead muted">
          Номер вашого замовлення — <b>№{id}</b>
          {state?.total ? (
            <>
              , сума — <b>{money(state.total)}</b>
            </>
          ) : null}
          . Ми зателефонуємо найближчим часом, щоб підтвердити деталі доставки та оплати.
        </p>
        <div className="btn-row btn-row--center">
          <Link to="/catalog" className="btn btn-dark">
            Повернутися до каталогу
          </Link>
          <Link to="/" className="btn btn-outline">
            На головну
          </Link>
        </div>
      </div>
    </section>
  );
}

export function Delivery() {
  return (
    <section className="section">
      <div className="container narrow prose">
        <p className="eyebrow">Покупцям</p>
        <h1>Доставка, оплата та повернення</h1>
        <h2 id="delivery">Доставка</h2>
        <p>
          Після оформлення замовлення ми телефонуємо, щоб підтвердити склад і адресу. Відправляємо службою доставки у ваше місто
          або на відділення. Вартість і терміни залежать від перевізника та називаються під час дзвінка.
        </p>
        <h2 id="pay">Оплата</h2>
        <p>Оплата при отриманні або переказом на рахунок — спосіб узгоджуємо під час підтвердження замовлення.</p>
        <h2 id="return">Повернення</h2>
        <p>
          Якщо флакон пошкоджено під час доставки, повідомте нас у день отримання — ми замінимо його. Відкриті парфуми, згідно з
          правилами торгівлі, поверненню не підлягають.
        </p>
        <h2 id="contacts">Контакти</h2>
        <p>Напишіть нам в Instagram або залиште коментар у замовленні — відповімо протягом робочого дня.</p>
        <p className="muted small">Текст цієї сторінки — шаблон. Відредагуйте його у файлі src/pages/Misc.jsx під свої умови.</p>
      </div>
    </section>
  );
}

export function NotFound() {
  return (
    <section className="section">
      <div className="container narrow done">
        <p className="eyebrow">404</p>
        <h1>Сторінку не знайдено</h1>
        <p className="muted">Можливо, посилання застаріло.</p>
        <Link to="/" className="btn btn-dark">
          На головну
        </Link>
      </div>
    </section>
  );
}
