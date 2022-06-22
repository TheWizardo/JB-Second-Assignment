let liveCoins = {};
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
        input.id = `${e.id}-switch`;
        input.setAttribute("type", "checkbox");
        input.setAttribute("role", "switch");
        if (liveCoins[e.id]) {
            input.setAttribute("checked", "true");
        }
        input.addEventListener("click", switchSwitched);

        // creating coin explenation.
        const par = document.createElement(`p`);
        par.className = "catd-text";
        par.innerText = e.name;

        // creating "More Info" button.
        const btn = document.createElement(`button`);
        btn.className = "btn btn-primary down";
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
        cardContent.appendChild(collapseDiv);
        cardContent.appendChild(btn);

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
    let id = ev.target.parentNode.dataset.id;
    if (!ev.target.checked) {
        // removing the coin from the list.
        delete liveCoins[id];
    }
    else {
        liveCoins[id] = header;
        if (Object.keys(liveCoins).length > 5) {
            // loading the coins to the modal.
            let liveCoins_keys = Object.keys(liveCoins)
            for (let i = 0; i < liveCoins_keys.length; i++) {
                document.getElementById(`coin-${i}`).innerHTML = `<b>${liveCoins[liveCoins_keys[i]]}</b> (${liveCoins_keys[i]})`;
                document.getElementById(`coin-${i}`).dataset.id = liveCoins_keys[i];
                document.getElementById(`coin-switch-${i}`).checked = "true";
            }
            // showing the modal.
            document.getElementById("errorModal").style.display = "block";
        }
    }
    // preventing the user from entering the live reports page, if no coins were chosen
    const liveReportsLink = document.getElementById(`live-reports`)
    if (Object.keys(liveCoins).length > 0) {
        liveReportsLink.className = liveReportsLink.className.replace(" disabled", "").replace("disabled ", "");
    }
    else {
        liveReportsLink.className += " disabled";
    }
}

function handleConflict(ev) {
    // getting the title from the ajacent cell of the table.
    let header = ev.target.parentNode.previousElementSibling.innerText;
    let id = ev.target.parentNode.previousElementSibling.dataset.id;
    // updating main cards according to the choice.
    document.getElementById(`${id}-switch`).checked = ev.target.checked;
    if (!ev.target.checked) {
        delete liveCoins[id];
    }
    else {
        liveCoins[id] = header;
    }
}

function closeModal() {
    // able to close the modal only if 5 or less coins are selected.
    if (Object.keys(liveCoins).length <= 5) {
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
                collapse.innerHTML = `<img src="${res.image.small}">`;
                if (res?.market_data?.current_price?.usd) {
                    collapse.innerHTML += `<p>USD: ${res.market_data.current_price.usd}$</p>
                     <p>ILS: ${res.market_data.current_price.ils}₪</p>
                     <p>EUR: ${res.market_data.current_price.eur}€</p>`;
                }
                else {
                    collapse.innerHTML += "<p>No Info found :(</p>";
                }
                showItem(collapse);
            });
            break;
        case "Less Info":
            // closing the collapse
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
    // for visual perpose
    document.getElementById(`searchInput`).value = "";
    hideItem(document.getElementById(`navbarSupportedContent`));

    if (chart) {
        // clearing the updating function when not in Live Reports page
        clearInterval(chart.loader);
    }
    let res;
    switch (ref) {
        case "home":
            // fetching the template.
            res = await fetch(`./home-body.html`);
            document.getElementById("content").innerHTML = await res.text();
            const BASE_URL = `https://api.coingecko.com/api/v3/coins/list`;
            // loading coin cards to screen.
            await loadCoins('./response.json');//BASE_URL);
            break;
        case "about":
            // fetching the template.
            res = await fetch(`./about-body.html`);
            document.getElementById("content").innerHTML = await res.text();
            break;
        case "live-reports":
            // fetching the template.
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
    document.getElementById("stonks").innerHTML = "";
    const BASE_URL = "https://min-api.cryptocompare.com/data/pricemulti";
    const TSYMS = `USD`; // desired fiat system
    const FSYMS = Object.values(liveCoins).join(','); // desired coins
    let raw_res = await fetch(`${BASE_URL}?fsyms=${FSYMS}&tsyms=${TSYMS}`);
    let res = await raw_res.json();
    if (!res.Response) {
        // check if all coins came back
        if (Object.keys(res).length < Object.keys(liveCoins).length && ask) {
            for (let el of Object.values(liveCoins)) {
                if (!res[el.toUpperCase()]) {
                    const item = document.createElement("li");
                    item.innerText = el;
                    document.getElementById("missing-coins").appendChild(item);
                }
            }
            document.getElementById("errorModal").style.display = "block";
        }
        else {
            let parsedData = [];
            for (let coin in res) {
                // creating a graph for each returned coin
                parsedData.push({
                    name: coin,
                    type: "spline",
                    yValueFormatString: "#0.##$",
                    showInLegend: true,
                    dataPoints: [{ x: new Date(), y: res[coin].USD }]
                });

                // creating a stock monitor
                const stock = document.createElement("div");
                stock.innerHTML = `<b>${coin}</b> <span id="${`${coin}-stock`}" data-innitialval="${res[coin].USD}">0%-</span>`;
                document.getElementById("stonks").appendChild(stock);
            }

            // configuring the chart
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
            chart.loader = setInterval(() => updateLiveReports(BASE_URL, FSYMS, TSYMS), 2 * 1000);
        }
    }
    else {
        alert("The Coins you have chosen, do not appear in our database");
        changePage({ target: { href: "#home" } });
    }
}

async function updateLiveReports(BASE_URL, FSYMS, TSYMS) {
    // fetching the data
    let raw_res = await fetch(`${BASE_URL}?fsyms=${FSYMS}&tsyms=${TSYMS}`);
    let res = await raw_res.json();

    // appending new datapoints
    for (let i = 0; i < chart.data.length; i++) {
        chart.data[i].addTo("dataPoints", { x: new Date(), y: res[chart.data[i].name].USD });
    }

    // updating the stocks elements
    for (let coin of Object.keys(res)) {
        const stock = document.getElementById(`${coin}-stock`);
        let percent = 1 - (Number(stock.dataset.innitialval) / res[coin].USD);
        // using EPSILON so that 0.0005 will round up.
        percent = Math.round((percent + Number.EPSILON) * 1000) / 1000;
        stock.innerText = `${percent}%`;
        // color change
        if (percent == 0) {
            stock.style.color = "black";
        }
        if (percent > 0) {
            stock.style.color = "green";
        }
        if (percent < 0) {
            stock.style.color = "red";
        }
    }
    chart.render();

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
    if (container) {
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
}

function clearSearch(ev) {
    document.getElementById(`searchInput`).value = "";
    let container = document.getElementById(`main`);
    // do nothing if not on home page
    if (container) {
        container.childNodes.forEach(card => card.style.display = "block");
    }
}