let liveCoins = [];
let cache = {};

(function () {
    document.addEventListener('DOMContentLoaded', async function () {
        await changePage({ target: { href: "#home" } });
    });
})();

function showItem(element) {
    element.className += " show";
}

function hideItem(element) {
    element.className = element.className.replace(" show", "").replace("show ", "");
}

async function getInfo(url) {
    showItem(document.getElementById("spinner"));
    if (Object.keys(cache).includes(url)) {
        if (Date.now() - cache[url].from > 2 * 60 * 1000) {
            let res = $.ajax(url);
            cache[url] = {
                result: res,
                from: Date.now()
            }
            return res;
        }
        else {
            return cache[url].result;
        }
    }
    else {
        let res = $.ajax(url);
        cache[url] = {
            result: res,
            from: Date.now()
        }
        return res;
    }
}

async function loadCoins(url) {
    allCoins = await getInfo(url);
    hideItem(document.getElementById("spinner"));
    allCoins.map(e => {
        const title = document.createElement(`h4`);
        title.className = "card-title";
        title.innerText = e.symbol;

        const lable = document.createElement(`lable`);
        lable.className = "small-gray";
        lable.innerText = "Show on Live Reports";

        const input = document.createElement(`input`);
        input.className = "form-check-input";
        input.setAttribute("type", "checkbox");
        input.setAttribute("role", "switch");
        input.addEventListener("click", switchSwitched);

        const par = document.createElement(`p`);
        par.className = "catd-text";
        par.innerText = e.name;

        const btn = document.createElement(`a`);
        btn.className = "btn btn-primary";
        btn.setAttribute("href", `#${e.id}`);
        btn.setAttribute("role", `button`);
        btn.setAttribute("data-id", `${e.id}`);
        btn.setAttribute("aria-expanded", `false`);
        btn.setAttribute("aria-controls", `${e.id}-collapse`);
        btn.innerText = "More Info";
        btn.addEventListener("click", openCollapse);


        const collapseContent = document.createElement(`div`);
        collapseContent.className = "psudeo-card card-body";
        collapseContent.id = `${e.id}-collapse-content`;

        const collapseDiv = document.createElement(`div`);
        collapseDiv.className = "collapse";
        collapseDiv.id = `${e.id}-collapse`;
        collapseDiv.appendChild(collapseContent);

        const cardContent = document.createElement(`div`);
        cardContent.className = "card-body form-switch";
        cardContent.appendChild(title);
        cardContent.appendChild(lable);
        cardContent.appendChild(input);
        cardContent.appendChild(par);
        cardContent.appendChild(btn);
        cardContent.appendChild(collapseDiv);

        const wholeCard = document.createElement(`div`);
        wholeCard.className = "card";
        wholeCard.appendChild(cardContent);
        document.getElementById(`main`).appendChild(wholeCard);
    });
}

function switchSwitched(ev) {
    // checking if the user already checked 5 coins, or if he wishes to uncheck
    if (liveCoins.length < 5 || !ev.target.checked) {
        let $cardContent = $(ev.target.parentNode);
        let header = $cardContent.find(`.card-title`)[0].innerText;
        if (liveCoins.includes(header)) {
            liveCoins.splice(liveCoins.indexOf(header), 1);
        }
        else {
            liveCoins.push(header);
        }
    }
    else {
        ev.target.checked = false;
        alert("no more than 5 bitch");
    }
}

function openCollapse(ev) {
    let key = ev.target.dataset.id;
    const collapse = document.getElementById(`${key}-collapse`);
    switch (ev.target.innerText) {
        case "More Info":
            ev.target.innerText = "Less Info";
            const BASE_URL = "https://api.coingecko.com/api/v3/coins/";
            getInfo(`${BASE_URL}${key}`).then(res => {
                hideItem(document.getElementById("spinner"));
                showItem(collapse);
                document.getElementById(`${key}-collapse-content`).innerHTML =
                    `<img src="${res.image.small}">
            <p>USD: ${res.market_data.current_price.usd}$</p>
            <p>ILS: ${res.market_data.current_price.ils}₪</p>
            <p>EUR: ${res.market_data.current_price.eur}€</p>`;
            });
            break;

        case "Less Info":
            ev.target.innerText = "More Info";
            hideItem(collapse);
            break;
        default:
            throw new Error("something went wrong...");
    }
}

async function changePage(ev) {
    let ref = ev.target.href.split("#")[1];
    let res = await fetch(`./blank-template.html`);
    document.body.innerHTML = await res.text();
    switch (ref) {
        case "home":
            const BASE_URL = `https://api.coingecko.com/api/v3/coins/list`;
            await loadCoins(`./response.json`);//baseURL);
            break;
        case "about":
            break;
        case "live-reports":
            break;
        default:
            // 404
            break;
    }
}

function toggleMenu() {
    let menu = document.getElementById(`navbarSupportedContent`);
    menu.className.includes(`show`) ? hideItem(menu) : showItem(menu);
}

function filterSearch(ev) {
    ev.preventDefault();
    const input = document.getElementById(`searchInput`)
    const rule = input.value;
    let container = document.getElementById(`main`);
    container.childNodes.forEach(card => {
        let $card = $(card)
        let header = $card.find(`.card-title`)[0].innerText;
        if (rule === "" || header === rule) {
            card.style.display = "block";
        }
        else {
            card.style.display = "none";
        }
    });
}

function clearSearch(ev) {
    document.getElementById(`main`).childNodes.forEach(card => card.style.display = "block");
}