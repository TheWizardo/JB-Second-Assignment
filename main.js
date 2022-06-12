(function () {
    let baseURL = `'https://api.coingecko.com/api/v3/coins/list'`;
    document.addEventListener('DOMContentLoaded', async function () {
        await loadCoins(`./response.json`);//baseURL);
    });
})();

async function loadCoins(URL) {
    let res = await $.ajax(URL);
    //cache the response
    res.map(e => {
        const cardHTML = `<div class="card">
            <div class="card-body form-switch">
                <h5 class="card-title">${e.symbol}</h5>
                <input class="form-check-input" type="checkbox" role="switch">
                <p class="card-text">${e.name}</p>
                <a href="#" class="btn btn-primary">More Info</a>
            </div>
        </div>`
        document.getElementById(`main`).innerHTML += cardHTML;
    });
}

function toggleMenu() {
    let menu = document.getElementById(`navbarSupportedContent`);
    if (menu.className.includes(`show`)) {
        menu.className = menu.className.replace(` show`, ``).replace(`show `, ``);
    }
    else {
        menu.className += ` show`;
    }
}

function filterSearch(ev){
    ev.preventDefault();
    const input = document.getElementById(`searchInput`)
    const rule = input.value;
    input.value = ``;
    let container = document.getElementById(`main`);
    container.childNodes.forEach(card => {
        let $card = $(card)
        let header = $card.find(`.card-title`)[0].innerText;
        if (header.includes(rule)) {
            card.style.display = "block";
        }
        else {
            card.style.display = "none";
        }
    });
}