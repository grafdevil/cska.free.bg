// news.js
// Основна асинхронна функция за изтегляне и показване на новините
async function loadCSKANews() {

  // Списък с RSS емисии от Google News с различни ключови думи за ЦСКА
  const queries = [
    'https://news.google.com/rss/search?q=ЦСКА&hl=bg&gl=BG&ceid=BG:bg',
    'https://news.google.com/rss/search?q=%D0%9F%D0%A4%D0%9A%20%D0%A6%D0%A1%D0%9A%D0%90%20%D0%A1%D0%BE%D1%84%D0%B8%D1%8F&hl=bg&gl=BG&ceid=BG:bg',
    'https://news.google.com/rss/search?q=ЦСКА%20София&hl=bg&gl=BG&ceid=BG:bg',
    'https://news.google.com/rss/search?q=CSKA&hl=bg&gl=BG&ceid=BG:bg',
    'https://news.google.com/rss/search?q=CSKA%20Sofia&hl=bg&gl=BG&ceid=BG:bg',
    'https://news.google.com/rss/search?q=Българска%20армия&hl=bg&gl=BG&ceid=BG:bg'
  ];

  try {
    // Превръщаме всеки линк в заявка към API (rss2json), което превръща RSS в четим JSON формат
    const requests = queries.map(q =>
      fetch(
        "https://api.rss2json.com/v1/api.json?rss_url=" +
        encodeURIComponent(q)
      ).then(res => res.json())
    );

    // Изчакваме всички заявки (паралелно) да приключат за по-голяма скорост
    const results = await Promise.all(requests);

    let allItems = []; // Масив, в който ще съберем всички новини от всички заявки

    // Преминаваме през резултатите и добавяме новините в общия масив
    results.forEach(data => {
      if (data.items) {
        allItems.push(...data.items);
      }
    });

    // Функция за нормализиране на линковете (премахва излишни параметри след знака '?')
    const normalizeUrl = (url) => url.split('?')[0].trim();

    // Логика за премахване на дублиращи се статии (които се появяват в повече от една заявка)
    const uniqueItems = [];
    const urls = new Set(); // Set съхранява само уникални стойности

    allItems.forEach(item => {
      const cleanLink = normalizeUrl(item.link); // Почистваме линка

      if (!urls.has(cleanLink)) { // Ако този линк не е добавян вече:
        urls.add(cleanLink);      // Добавяме го в Set-а
        uniqueItems.push({        // Добавяме новината в списъка с уникални новини
          ...item,
          link: cleanLink
        });
      }
    });

    // Сортираме уникалните новини по дата на публикуване (най-новите най-отгоре)
    uniqueItems.sort(
      (a, b) => new Date(b.pubDate) - new Date(a.pubDate)
    );

    // Вземаме само първите 4 най-актуални и уникални новини
    const items = uniqueItems.slice(0, 4);

    // --- Рендериране (Показване на екрана) ---
    const container = document.getElementById("news-container");
    container.innerHTML = ""; // Изчистваме контейнера (премахва старите новини или лоудъра)

    items.forEach(item => {
      // Създаваме основния куб за новината
      const cube = document.createElement("div");
      cube.className = "news-cube";

      // Създаваме заглавието на новината
      const title = document.createElement("div");
      title.className = "news-title";
      title.textContent = item.title;

      // Създаваме скритото съдържание (описание и снимка)
      const content = document.createElement("div");
      content.className = "news-content";

      // Почистваме описанието от ненужни HTML тагове и линкове
      let description = item.description || "";
      description = description
        .replace(/<\/?a[^>]*>/g, "")   // Премахва <a> линковете, за да не се кликат по погрешка
        .replace(/<br\s*\/?>/gi, "<br>") // Нормализира новите редове
        .replace(/&nbsp;/g, " ")       // Премахва специалните интервали
        .trim();

      // Опитваме се да намерим снимка в описанието на Google News чрез Regex
      const imgMatch = description.match(/<img[^>]+src="([^"]+)"/i);
      const image = imgMatch
        ? `<img src="${imgMatch[1]}" class="news-image">` // Ако има снимка, създаваме <img> таг
        : ""; // Ако няма снимка, остава празно

      // Премахваме абсолютно всички останали HTML тагове от текста
      const textOnly = description.replace(/<[^>]+>/g, "");

      // Поставяме снимката, текста и линка към оригиналния сайт в съдържанието
      content.innerHTML = `
        ${image}
        <div class="news-text">${textOnly}</div>
        <a href="${item.link}" target="_blank" class="news-link">
          Прочети пълната статия →
        </a>
      `;

      // Добавяме заглавието и съдържанието в куба
      cube.appendChild(title);
      cube.appendChild(content);

      // Добавяме слушател за клик, който "разпъва" новината
      cube.addEventListener("click", (e) => {
        e.stopPropagation(); // Спира разпространението на клика (за да не се затвори веднага от body клика)

        // Затваряме всички други разпънати кубове
        document
          .querySelectorAll(".news-cube.expanded")
          .forEach(el => {
            if (el !== cube) {
              el.classList.remove("expanded");
            }
          });

        // Превключваме състоянието (отворено/затворено) на текущия куб
        cube.classList.toggle("expanded");
      });

      // Добавяме готовия куб в контейнера на страницата
      container.appendChild(cube);
    });

    // Ако потребителят кликне някъде другаде по екрана, затваряме всички отворени новини
    document.body.addEventListener("click", () => {
      document
        .querySelectorAll(".news-cube.expanded")
        .forEach(c => c.classList.remove("expanded"));
    });

  } catch (err) {
    // В случай на грешка (липса на интернет или проблем с API), изписваме в конзолата и на екрана
    console.error("Грешка при зареждане:", err);
    document.getElementById("news-container").innerHTML =
      "<p>Неуспех при зареждане на новините.</p>";
  }
}

// Изпълняваме функцията, когато целият HTML документ е зареден
document.addEventListener("DOMContentLoaded", () => {
  loadCSKANews(); // Първоначално зареждане
  // Задаваме автоматично обновяване на новините на всеки 5 минути (300,000 ms)
  setInterval(loadCSKANews, 9300000);
});
