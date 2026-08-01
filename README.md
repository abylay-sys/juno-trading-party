# Trading Party — лендинг и креативы

Кампания реактивации клиентов Juno Markets в Казахстане.
Схема согласована с Борисом 26.07.2026: свой сервер + свой GitHub, домен вида `promo.junomarkets.kz` вешает Juno.

```
juno-trading-party/
├─ site/                    ← то, что уезжает на сервер
│  ├─ index.html            лендинг (собирается скриптом, правится руками)
│  ├─ terms.html            полные условия конкурса (черновик)
│  └─ assets/
│     ├─ css/site.css
│     ├─ js/copy.js         ← ВСЕ ТЕКСТЫ, RU и KZ. Правится только здесь
│     ├─ js/site.js         язык, отсчёт, форма, анимации
│     └─ img/               логотипы из бренд-бука (SVG)
└─ creative/                баннеры для соцсетей
   ├─ kv.css                визуальная система
   ├─ artboards/            исходники (HTML)
   └─ export/               28 готовых PNG
```

## Что нужно заполнить перед запуском

Обе переменные — внизу `site/index.html`, в блоке `window.TP_CONFIG`:

```js
window.TP_CONFIG = {
  registrationEnds: "2026-09-15T23:59:59+05:00",   // закрытие регистрации, время Астаны
  registrationUrl:  "https://…"                    // ссылка на форму от платформы конкурса
};
```

Пока `registrationEnds` пустая — блок обратного отсчёта скрыт.
Пока `registrationUrl` пустая — вместо формы стоит заглушка.
Ту же пару нужно продублировать в `terms.html`.

Кроме этого по тексту остались плейсхолдеры `[дата]` / `[күні]` — они в `copy.js`, ищи поиском.

## Тексты

Всё в `site/assets/js/copy.js`: объект `ru` и объект `kz`, ключи одинаковые. HTML трогать не нужно — он подставляет значения по `data-i18n`.

Проверка, что ничего не разъехалось:

```bash
cd site && node -e "global.window={};require('./assets/js/copy.js');const C=window.COPY,r=Object.keys(C.ru),k=Object.keys(C.kz);console.log('RU',r.length,'KZ',k.length,'расхождения:',r.filter(x=>!(x in C.kz)).concat(k.filter(x=>!(x in C.ru))))"
```

Должно быть `расхождения: []`.

## Локальный просмотр

```bash
ruby -run -e httpd juno-trading-party/site -p 8108
```

Либо через `.claude/launch.json` — конфигурация `juno-trading-party` уже добавлена.

## Деплой на свой сервер

Разовая настройка на VPS (Ubuntu, от $5/мес):

```bash
sudo apt update && sudo apt install -y nginx git
sudo mkdir -p /var/www/promo && sudo chown -R $USER:$USER /var/www/promo
git clone git@github.com:<твой-аккаунт>/juno-trading-party.git /srv/juno-trading-party
ln -s /srv/juno-trading-party/site /var/www/promo/current
```

Конфиг nginx — `/etc/nginx/sites-available/promo`:

```nginx
server {
    listen 80;
    server_name promo.junomarkets.kz;
    root /var/www/promo/current;
    index index.html;
    location / { try_files $uri $uri/ =404; }
    location ~* \.(css|js|svg|png|woff2)$ { expires 7d; add_header Cache-Control "public"; }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/promo /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d promo.junomarkets.kz
```

Дальше обновление сайта — один `git pull` на сервере, либо автодеплой ниже.

### Что попросить у Juno

- **Umang Ravel** (DevOps) — A-запись `promo.junomarkets.kz` → IP твоего сервера. Домен выбирает Борис, у него их ~30–50
- **Matt** (бэк-офис) — оплата $800 платформе конкурса; после оплаты ты работаешь с вендором напрямую и получаешь ссылку на форму для `registrationUrl`

### Автодеплой

В репозитории лежит `.github/workflows/deploy.yml` — пуш в `main` заливает `site/` на сервер по SSH.
Нужно один раз добавить в Settings → Secrets: `SSH_HOST`, `SSH_USER`, `SSH_KEY`, `TARGET_PATH`.

## Креативы

`creative/export/` — 28 PNG, готовы к публикации:

| Формат | Размер | Что |
|---|---|---|
| `post_*` | 1080×1080 | 7 фаз для ленты Instagram, RU и KZ |
| `story_*` | 1080×1920 | тизер, запуск, последний день |
| `tg_*` | 1280×720 | Telegram |
| `mail_*` | 1200×400 | шапка письма |
| `popup_*` | 640×440 | pop-up в traders room |

Фазы: `teaser`, `launch`, `remind`, `last`, `week`, `winners`, `inter`.

Пересобрать после правки текста — открыть нужный файл в `creative/artboards/` и снять скриншот, либо прогнать генератор целиком.

## Бренд

Из `JunoMarkets Brand Book.pdf`:

| | |
|---|---|
| Основной | `#FF6900` — Pantone 2018C, C0 M72 Y93 K0 |
| Вспомогательный | `#777777` — Pantone Cool Gray 9 C |
| Плюс | `#000000`, `#FFFFFF` |
| Приоритет в логотипе | оранжевый > белый > чёрный |
| Шрифт | Source Han Sans (есть кириллица, бесплатен для коммерции) |

Логотипы в `site/assets/img/` извлечены вектором из бренд-бука. Бренд-бук запрещает перерисовывать логотип — использовать только эти файлы.

## Открытые вопросы

- **Метод ранжирования** не выбран (ROI / прибыль / совокупный балл). Тексты написаны так, чтобы быть верными при любом: лимиты риска — условие допуска, среди прошедших побеждает лучший результат. Если возьмём чистый ROI на демо-счёте с фиксированным стартом — он математически совпадает с ранжированием по прибыли
- **`terms.html` — черновик**, не согласован с юристами. Незаполненное помечено оранжевым `[уточнить]`
- **Призовой фонд** пересчитан, см. `~/Desktop/Juno/Trading_Party_Economics_2026-08-01.md` — старая формулировка «топ-25% first come first serve» заменена на «первые 50, выполнившие челлендж»
