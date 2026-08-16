// seasons.js - ФИКС за новата JSON структура (2025-2026)

async function loadArchivedSeasons() {
    const container = document.getElementById("archived-wrapper");
    if (!container) return;

    const seasons = [
//      "2023-2024.json",
//      "2024-2025.json",
        "2025-2026.json"
//		"2026-2027.json"
    ];

    function closeCube(cube) {
        cube.classList.remove('cube-expanded');

        const videoPlaceholder =
            cube.querySelector('.video-placeholder');

        if (videoPlaceholder) {
            videoPlaceholder.innerHTML = '';
        }
    }

    seasons.forEach(seasonFile => {

        const seasonName = seasonFile.replace(".json", "");

        const seasonBlock = document.createElement("div");
        seasonBlock.className = "season-block";

        seasonBlock.innerHTML = `
            <div class="season-header">
                <div class="season-center">
                    <svg class="season-icon"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24">

                        <path fill="currentColor"
                            d="M12 1L3 5v6c0 5.55
                            3.84 10.74 9 12
                            5.16-1.26 9-6.45
                            9-12V5l-9-4z"/>
                    </svg>

                    <span>
                        Архивирани сезони:
                        ${seasonName.replace("-", "/")}
                    </span>
                </div>

                <span class="arrow">▶</span>
            </div>

            <div class="season-content"
                 style="max-height:0px;
                 overflow:hidden;">

                <div class="archive-grid">
                </div>
            </div>
        `;

        container.appendChild(seasonBlock);

        const grid =
            seasonBlock.querySelector(".archive-grid");

        const header =
            seasonBlock.querySelector(".season-header");

        const content =
            seasonBlock.querySelector(".season-content");

        const arrow =
            seasonBlock.querySelector(".arrow");

        let loaded = false;

        header.addEventListener("click", async (e) => {
            e.stopPropagation();

            if (!loaded) {

                try {

                    const res = await fetch(
                        `seasons/json/${seasonFile}?v=${Date.now()}`
                    );

                    if (!res.ok) {
                        throw new Error(
                            `HTTP error ${res.status}`
                        );
                    }

                    const data = await res.json();

                    // ФИКС: clubs е object
                    const clubMap = data.clubs || {};

                    // ФИКС: matches е object -> array
                    const matches = Object.values(
                        data.matches || {}
                    );

                    // Сортиране по дата
                    matches.sort((a, b) =>
                        new Date(a.datetime) -
                        new Date(b.datetime)
                    );

                    matches.forEach(match => {

                        const home =
                            clubMap[match.home];

                        const away =
                            clubMap[match.away];

                        // ако липсва клуб
                        if (!home || !away) {
                            console.warn(
                                "Липсващ клуб:",
                                match
                            );
                            return;
                        }

                        let emoji = '';

                        switch (match.tournament) {

                            case 'Първенство':
                                emoji =
                                '<img src="images/emoji/efbetliga.png" class="emoji">';
                                break;

                            case 'Купа на България':
                                emoji =
                                '<img src="images/emoji/CupLogo.png" class="emoji">';
                                break;

                            case 'Шампионска лига':
                                emoji =
                                '<img src="images/emoji/Champions_League.png" class="emoji">';
                                break;

                            case 'Лига Европа':
                                emoji =
                                '<img src="images/emoji/Europa_League.png" class="emoji">';
                                break;

                            case 'Лига на конференциите':
                                emoji =
                                '<img src="images/emoji/Conference_League.png" class="emoji">';
                                break;

                            case 'Контролна среща':
                                emoji =
                                '<img src="images/emoji/control.png" class="emoji">';
                                break;

                            default:
                                emoji = '🥇';
                        }

                        const cube =
                            document.createElement('div');

                        cube.className =
                            'match-cube';

                        cube.style.width = "100%";

                        const matchDate =
                            match.datetime
                                ? new Date(
                                    match.datetime
                                  ).toLocaleDateString(
                                    "bg-BG"
                                  )
                                : '';

                        const youtubeUrl =
                            match.youtube
                                ? match.youtube.replace(
                                    'youtube.com',
                                    'youtube-nocookie.com'
                                  )
                                : '';

                        cube.innerHTML = `
                            <div class="logos">

                                <img
                                    src="${home.logo}"
                                    alt="${home.name}"
                                    loading="lazy">

                                <span class="vs-label-arhive">
                                    ${emoji}
                                </span>

                                <img
                                    src="${away.logo}"
                                    alt="${away.name}"
                                    loading="lazy">
                            </div>

                            <div style="
                                font-size:18px;
                                margin:5px 0;
                                font-weight:bold;">

                                ${matchDate}
                            </div>

                            <div class="match-extra">

                                <div style="
                                    font-size:13px;">

                                    Краен резултат:
                                </div>
								
								<div style="
                                    font-size:13px;
                                    margin-bottom:5px;
                                    opacity:0.7;">

                                    
									${match.result || 'vs'}
                                </div>

                                ${
                                    youtubeUrl
                                    ? `
                                    <div
                                      class="video-placeholder"
                                      data-src="${youtubeUrl}">
                                    </div>
                                    `
                                    : ''
                                }
                            </div>
                        `;

                        cube.addEventListener(
                            'click',
                            (ev) => {

                            ev.stopPropagation();

                            const isOpen =
                                cube.classList.contains(
                                    'cube-expanded'
                                );

                            grid.querySelectorAll(
                                '.match-cube.cube-expanded'
                            ).forEach(c => {

                                if (c !== cube) {
                                    closeCube(c);
                                }
                            });

                            if (isOpen) {

                                closeCube(cube);

                            } else {

                                cube.classList.add(
                                    'cube-expanded'
                                );

                                const placeholder =
                                    cube.querySelector(
                                        '.video-placeholder'
                                    );

                                if (
                                    placeholder &&
                                    !placeholder.querySelector(
                                        'iframe'
                                    )
                                ) {

                                    const videoUrl =
                                        placeholder.getAttribute(
                                            'data-src'
                                        );

                                    placeholder.innerHTML = `
                                        <iframe
                                            src="${videoUrl}"
                                            frameborder="0"
                                            allow="
                                            accelerometer;
                                            autoplay;
                                            clipboard-write;
                                            encrypted-media;
                                            gyroscope;
                                            picture-in-picture;
                                            web-share"
                                            allowfullscreen>
                                        </iframe>
                                    `;
                                }
                            }
                        });

                        grid.appendChild(cube);
                    });

                } catch (err) {

                    console.error(err);

                    grid.innerHTML = `
                        <div style="
                            color:red;
                            padding:20px;">
                            Грешка при
                            зареждане на сезона.
                        </div>
                    `;
                }

                loaded = true;
            }

            if (
                content.style.maxHeight === "0px" ||
                content.style.maxHeight === ""
            ) {

                content.style.maxHeight = "none";
                arrow.classList.add("rotated");

            } else {

                content.style.maxHeight = "0px";
                arrow.classList.remove("rotated");

                grid.querySelectorAll(
                    '.match-cube'
                ).forEach(closeCube);
            }
        });
    });

    document.addEventListener('click', (e) => {

        document
            .querySelectorAll('.season-block')
            .forEach(block => {

            const content =
                block.querySelector(
                    '.season-content'
                );

            if (
                content.style.maxHeight !==
                "0px" &&
                !block.contains(e.target)
            ) {

                content.style.maxHeight =
                    "0px";

                block.querySelector('.arrow')
                    .classList.remove(
                        "rotated"
                    );

                content.querySelectorAll(
                    '.match-cube'
                ).forEach(closeCube);
            }
        });
    });
}

document.addEventListener(
    "DOMContentLoaded",
    loadArchivedSeasons
);