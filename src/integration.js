function addNode(parent, tag, inner) {
    let e = document.createElement(tag);
    e.innerHTML = inner;
    parent.appendChild(e);
    return e;
}
fetch(newsUrl)
    .then((resp) => resp.json())
    .then((data) => {
        let div = document.getElementById(divId);
        if (div) {
            addNode(div, "h1", "BBC");
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
            div.style.width = width;
            div.style.height = height;
        }
    })
    .catch((e) => {
        console.error(e);
    });
