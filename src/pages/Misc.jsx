import { t, Link, usePageSeo } from '../lib/i18n.jsx';
import { useLocation, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { money } from '../lib/format.js';
export function OrderDone() {
  usePageSeo('order');
  const { id } = useParams();
  const { state } = useLocation();
  return (
    <section className="section">
      <div className="container narrow done">
        <CheckCircle2 size={56} strokeWidth={1.3} className="gold" />
        <p className="eyebrow">{t('Замовлення прийнято')}</p>
        <h1>
          {t('Дякуємо')}
          {state?.name ? `, ${state.name.split(' ')[0]}` : ''}!
        </h1>
        <p className="lead muted">
          {t('Номер вашого замовлення —') + ' '}
          <b>№{id}</b>
          {state?.total ? (
            <>
              {t(', сума —') + ' '}
              <b>{money(state.total)}</b>
            </>
          ) : null}
          {t('. Ми зателефонуємо найближчим часом, щоб підтвердити деталі доставки та оплати.')}
        </p>
        <div className="btn-row btn-row--center">
          <Link to="/catalog" className="btn btn-dark">
            {t('Повернутися до каталогу')}
          </Link>
          <Link to="/" className="btn btn-outline">
            {t('На головну')}
          </Link>
        </div>
      </div>
    </section>
  );
}
export function Delivery() {
  usePageSeo('delivery');
  return (
    <section className="section">
      <div className="container narrow prose">
        <p className="eyebrow">{t('Покупцям')}</p>
        <h1>{t('Доставка, оплата та повернення')}</h1>
        <h2 id="delivery">{t('Доставка')}</h2>
        <p>
          {t(
            'Після оформлення замовлення ми телефонуємо, щоб підтвердити склад і адресу. Відправляємо службою доставки у ваше місто або на відділення. Вартість і терміни залежать від перевізника та називаються під час дзвінка.',
          )}
        </p>
        <h2 id="pay">{t('Оплата')}</h2>
        <p>{t('Оплата при отриманні або переказом на рахунок — спосіб узгоджуємо під час підтвердження замовлення.')}</p>
        <h2 id="return">{t('Повернення')}</h2>
        <p>
          {t(
            'Якщо флакон пошкоджено під час доставки, повідомте нас у день отримання — ми замінимо його. Відкриті парфуми, згідно з правилами торгівлі, поверненню не підлягають.',
          )}
        </p>
        <h2 id="contacts">{t('Контакти')}</h2>
        <p>{t('Напишіть нам в Instagram або залиште коментар у замовленні — відповімо протягом робочого дня.')}</p>
      </div>
    </section>
  );
}
export function NotFound() {
  usePageSeo('notfound');
  return (
    <section className="section">
      <div className="container narrow done">
        <p className="eyebrow">404</p>
        <h1>{t('Сторінку не знайдено')}</h1>
        <p className="muted">{t('Можливо, посилання застаріло.')}</p>
        <Link to="/" className="btn btn-dark">
          {t('На головну')}
        </Link>
      </div>
    </section>
  );
}
