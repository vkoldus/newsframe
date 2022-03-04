function addNode(parent, tag, inner) {
    let e = document.createElement(tag);
    e.innerHTML = inner;
    parent.appendChild(e);
    return e;
}

function buildContent(div, data, headline = true, forceSize = true) {
    if (div) {
        addStyles();

        if (config.headline != null && headline) {
            let h = addNode(div, "div", config.headline);
            h.className = "com-x-newsFrame-headline";
        }
        for (let article of data) {
            let a = addNode(div, "a", article.title);
            a.href = article.link;
            a.className = "com-x-newsFrame-title";
            let p = addNode(div, "p", article.description);
            p.className = "com-x-newsFrame-text";
        }

        div.style.overflowY = "scroll";
        div.style.overflowX = "hidden";

        if (forceSize) {
            div.style.width = config.width || "auto";
            div.style.height = config.height || "150px";
        }
        div.className = config.className;
    }
}

function addStyles() {
    addNode(
        document.body,
        "style",
        `
      .com-x-newsFrame {
        padding: 1rem 1rem 0 1rem;
        background: #fff;
      }
      a.com-x-newsFrame-title {
        display: block;
        max-width: 50rem;
        margin: 0 0 .5rem;
        padding: 0;
        font-size: 1.3rem;
        line-height: 1.15;
        letter-spacing: .02rem;
        color: #00f;
      }
      .com-x-newsFrame-text {
        max-width: 50rem;
        margin: 1rem 0 3rem;
        font-size: 1rem;
        line-height: 1.2;
        color: #000;
      }
      .com-x-newsFrame-headline {
        max-width: 50rem;
        margin: 0 0 2rem;
        font-size: 2rem;
        font-weight: bold;
        color: #000;
      }`
    );
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
                buildContent(div, data, false, false);
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
