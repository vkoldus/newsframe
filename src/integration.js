function addNode(parent, tag, inner) {
    let e = document.createElement(tag);
    e.innerHTML = inner;
    parent.appendChild(e);
    return e;
}

function buildContent(div, data, headline = true) {
    if (div) {
        if (config.headline != null && headline) {
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
        div.style.width = config.width || "100%";
        div.style.height = config.height || "150px";
        div.className = config.className;
    }
}

function stripPxSuffix(val) {
    if (val && val.endsWith("px")) {
        return val.substring(0, val.length - 2);
    }
}

fetch(newsUrl)
    .then((resp) => resp.json())
    .then((data) => {
        if (!config.id) {
            if (JSFrame) {
                let width = config.width ? stripPxSuffix(config.width) : 320;
                let height = config.height ? stripPxSuffix(config.height) : 250;

                let div = document.createElement("div");
                buildContent(div, data, false);
                div.style.height = "100%";

                const jsFrame = new JSFrame();
                let frame = jsFrame.create({
                    title: config.headline,
                    width,
                    height,
                    left: window.innerWidth - width - 40,
                    top: 100,
                    movable: true,
                    html: div.outerHTML,
                });

                frame.show();
            }
        } else {
            let div = document.getElementById(config.id);
            buildContent(div, data);
        }
    })
    .catch((e) => {
        console.error(e);
    });
