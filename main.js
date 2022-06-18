let liveCoins = []; //TO DO: change liveCoins data structure
let cache = {};
let chart;

(function () {
    document.addEventListener('DOMContentLoaded', async function () {
        // after page has loaded, go to home page.
        await changePage({ target: { href: "#home" } });
    });
})();

// show hidden items.
function showItem(element) {
    element.className += " show";
}

function hideItem(element) {
    element.className = element.className.replace(" show", "").replace("show ", "");
}

async function getInfo(url) {
    // starting spinner when fetching.
    showItem(document.getElementById("spinner"));

    // check if data has already been cached.
    if (Object.keys(cache).includes(url)) {
        // check if data is too old. over 2 minutes.
        if (Date.now() - cache[url].from > 2 * 60 * 1000) {
            let res = $.ajax(url);

            // chaching the result.
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

        // chaching the result.
        cache[url] = {
            result: res,
            from: Date.now()
        }
        return res;
    }
}

async function loadCoins(url) {
    // fetching data.
    allCoins = await getInfo(url);
    // hiding the spinner after recieving the data.
    hideItem(document.getElementById("spinner"));
    allCoins.map(e => {
        // creating a title.
        const title = document.createElement(`h4`);
        title.className = "card-title";
        title.innerText = e.symbol;

        // creating a lable for the switch.
        const lable = document.createElement(`lable`);
        lable.className = "small-gray";
        lable.innerText = "Show on Live Reports";

        // creating a switch.
        const input = document.createElement(`input`);
        input.className = "form-check-input";
        input.id = `${e.symbol}-switch`;
        input.setAttribute("type", "checkbox");
        input.setAttribute("role", "switch");
        if (liveCoins.includes(e.symbol)) {
            input.setAttribute("checked", "true");
        }
        input.addEventListener("click", switchSwitched);

        // creating coin explenation.
        const par = document.createElement(`p`);
        par.className = "catd-text";
        par.innerText = e.name;

        // creating "More Info" button.
        const btn = document.createElement(`button`);
        btn.className = "btn btn-primary";
        btn.setAttribute("aria-controls", `${e.id}-collapse`);
        btn.innerText = "More Info";
        btn.addEventListener("click", openCollapse);

        // creating a collapse.
        const collapseDiv = document.createElement(`div`);
        collapseDiv.className = "collapse p-2";
        collapseDiv.id = `${e.id}-collapse`;

        // appending all children to the content of the card.
        const cardContent = document.createElement(`div`);
        cardContent.className = "card-body form-switch";
        cardContent.setAttribute("data-id", `${e.id}`);
        cardContent.appendChild(title);
        cardContent.appendChild(lable);
        cardContent.appendChild(input);
        cardContent.appendChild(par);
        cardContent.appendChild(btn);
        cardContent.appendChild(collapseDiv);

        // adding the card to the screen.
        const wholeCard = document.createElement(`div`);
        wholeCard.className = "card";
        wholeCard.appendChild(cardContent);
        document.getElementById(`main`).appendChild(wholeCard);
    });
}

function switchSwitched(ev) {
    // retrieving the content of the card.
    let $cardContent = $(ev.target.parentNode);
    // finding the title.
    let header = $cardContent.find(`.card-title`)[0].innerText;
    if (!ev.target.checked) {
        // removing the coin from the list.
        liveCoins.splice(liveCoins.indexOf(header), 1);
    }
    else {
        liveCoins.push(header);
        if (liveCoins.length > 5) {
            // loading the coins to the modal.
            for (let i in liveCoins) {
                document.getElementById(`coin-${i}`).innerText = liveCoins[i];
                document.getElementById(`coin-switch-${i}`).checked = "true";
            }
            // showing the modal.
            document.getElementById("errorModal").style.display = "block";
        }
    }
    const liveReportsLink = document.getElementById(`live-reports`)
    if (liveCoins.length > 0) {
        liveReportsLink.className = liveReportsLink.className.replace(" disabled", "").replace("disabled ", "");
    }
    else {
        liveReportsLink.className += " disabled";
    }
}

function handleConflict(ev) {
    // getting the title from the ajacent cell of the table.
    let header = ev.target.parentNode.previousElementSibling.innerText;
    // updating main cards according to the choice.
    document.getElementById(`${header}-switch`).checked = ev.target.checked;
    if (!ev.target.checked) {
        liveCoins.splice(liveCoins.indexOf(header), 1);
    }
    else {
        liveCoins.push(header);
    }
}

function closeModal() {
    // able to close the modal only if 5 or less coins are selected.
    if (liveCoins.length <= 5) {
        document.getElementById("errorModal").style.display = "none";
    }
    else {
        // showing an error to the user.
        showItem(document.getElementById("error-span"))
    }
}

function openCollapse(ev) {
    // getting the coin id.
    let key = ev.target.parentNode.dataset.id;
    const collapse = document.getElementById(`${key}-collapse`);
    switch (ev.target.innerText) {
        case "More Info":
            ev.target.innerText = "Less Info";
            // fetching the info.
            const BASE_URL = "https://api.coingecko.com/api/v3/coins/";
            getInfo(`${BASE_URL}${key}`).then(res => {
                // hiding the spinner.
                hideItem(document.getElementById("spinner"));
                // inserting relevent info.
                // TODO************************** CHECK IF DATA IS undefined.
                document.getElementById(`${key}-collapse`).innerHTML =
                    `<img src="${res.image.small}">
                     <p>USD: ${res.market_data.current_price.usd}$</p>
                     <p>ILS: ${res.market_data.current_price.ils}₪</p>
                     <p>EUR: ${res.market_data.current_price.eur}€</p>`;
                showItem(collapse);
            });
            break;
        case "Less Info":
            ev.target.innerText = "More Info";
            hideItem(collapse);
            break;
        default:
            // handeling of other scenarios.
            // not supposed to get here.
            throw new Error("something went wrong...");
    }
}

async function changePage(ev) {
    // getting the desired page. 
    let ref = ev.target.href.split("#")[1];
    hideItem(document.getElementById(`navbarSupportedContent`));
    let res;
    switch (ref) {
        case "home":
            // fetching the template.
            res = await fetch(`./home-body.html`);
            document.getElementById("content").innerHTML = await res.text();
            const BASE_URL = `https://api.coingecko.com/api/v3/coins/list`;
            // loading coin cards to screen.
            await loadCoins(BASE_URL);
            break;
        case "about":
            // fetching the template.
            res = await fetch(`./about-body.html`);
            document.getElementById("content").innerHTML = await res.text();
            break;
        case "live-reports":
            // fetching the template.
            // TODO************************** CREATE PAGE.
            res = await fetch(`./live-reports-body.html`);
            document.getElementById("content").innerHTML = await res.text();
            await loadReports(true);
            break;
        default:
            // not supposed to get here.
            // fetching the template.
            res = await fetch(`./error-body.html`);
            document.getElementById("content").innerHTML = await res.text();
            break;
    }
}

async function loadReports(ask) {
    closeModal();
    const BASE_URL = "https://min-api.cryptocompare.com/data/pricemulti";
    const TSYMS = `USD`;
    const FSYMS = liveCoins.join(',');
    let raw_res = await fetch(`${BASE_URL}?fsyms=${FSYMS}&tsyms=${TSYMS}`);
    let res = await raw_res.json();
    if (!res.Response) {
        // check if all coins came back
        if (Object.keys(res).length < liveCoins.length && ask) {
            liveCoins.forEach(el => {
                if (!res[el.toUpperCase()]) {
                    const item = document.createElement("li");
                    item.innerText = el;
                    document.getElementById("missing-coins").appendChild(item);
                }
            });
            document.getElementById("errorModal").style.display = "block";
        }
        else {
            let parsedData = [];
            Object.keys(res).forEach(coin => parsedData.push({
                name: coin,
                type: "spline",
                yValueFormatString: "#0.##$",
                showInLegend: true,
                dataPoints: [{ x: new Date(), y: res[coin].USD }]
            }));

            if (chart) {
                clearInterval(chart.loader);
            }
            chart = new CanvasJS.Chart("chartContainer", {
                title: {
                    text: "Current Price"
                },
                axisX: {
                    valueFormatString: "HH:mm"
                },
                axisY: {
                    title: "Price (in USD)",
                    suffix: "$"
                },
                data: parsedData
            });
            chart.render();
            console.log(chart.loader);
            chart.loader = setInterval(async () => {
                let raw_res = await fetch(`${BASE_URL}?fsyms=${FSYMS}&tsyms=${TSYMS}`);
                let res = await raw_res.json();
                for (let i = 0; i < chart.data.length; i++) {
                    console.log(chart.data[i].name);
                    chart.data[i].addTo("dataPoints", { x: new Date(), y: res[chart.data[i].name].USD });
                }
                chart.render();
            }, 10 * 1000);
        }
    }
    else {
        alert("The Coins you have chosen, do not appear in our database");
    }
}

// toggleing the nav-bar.
function toggleMenu() {
    let menu = document.getElementById(`navbarSupportedContent`);
    menu.className.includes(`show`) ? hideItem(menu) : showItem(menu);
}

function filterSearch(ev) {
    ev.preventDefault();
    // getting the rule to filter by.
    const rule = document.getElementById(`searchInput`).value;
    let container = document.getElementById(`main`);
    container.childNodes.forEach(card => {
        let $card = $(card)
        let header = $card.find(`.card-title`)[0].innerText;
        // showing all cards that fit the search
        if (rule === "" || header === rule) {
            card.style.display = "block";
        }
        else {
            card.style.display = "none";
        }
    });
}

function clearSearch(ev) {
    document.getElementById(`searchInput`).value = "";
    document.getElementById(`main`).childNodes.forEach(card => card.style.display = "block");
}