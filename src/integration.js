function addNode(parent, tag, inner) {
    let e = document.createElement(tag);
    e.innerHTML = inner;
    parent.appendChild(e);
    return e;
}
fetch(newsUrl)
    .then((resp) => resp.json())
    .then((data) => {
        let div = document.getElementById(config.id);
        if (div) {
            if (config.headline != null) {
                addNode(div, "h1", config.headline);
            }
            for (let article of data) {
                addNode(
                    div,
                    "h2",
                    '<a href="' + article.link + '">' + article.title + "</a>"
                );
                addNode(div, "p", article.description);
            }
            div.style.overflowY = "scroll";
            div.style.overflowX = "hidden";
            div.style.width = config.width;
            div.style.height = config.height;
            div.className = config.className;
        }
    })
    .catch((e) => {
        console.error(e);
    });
