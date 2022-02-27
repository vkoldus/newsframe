const express = require("express");
const axios = require("axios").default;
const Reader = require("@maxmind/geoip2-node").Reader;
const { XMLParser } = require("fast-xml-parser");
const { setup } = require("axios-cache-adapter");
const { URL } = require("url");

const app = express();
const parser = new XMLParser();

const COUNTRY_CODES_TO_SHOW_IN = ["RU"];
const NEWS_URL = "http://feeds.bbci.co.uk/russian/rss.xml";
const CACHE_MAX_AGE_MS = 5 * 60 * 1000;

const url = new URL(NEWS_URL);
const api = setup({
    baseUrl: url.origin,
    maxAge: CACHE_MAX_AGE_MS,
    readHeaders: true,
});

async function getNews() {
    let rssResponse;

    const length = await api.cache.length();

    try {
        rssResponse = await api.get(NEWS_URL);
    } catch (e) {
        console.error("Could not retrieve news.", e);
        return null;
    }

    if (rssResponse.status != 200) {
        console.error("Could not retrieve news, status ", rssResponse.status);
        return null;
    }

    let news = parser.parse(rssResponse.data);
    if (!news) {
        console.error("Could not parse news content.");
        return null;
    }

    return news.rss.channel.item;
}

function formatNewsItem(newsItem) {
    return `<h2><a href='${newsItem.link}'>${newsItem.title}<a></h2><p>${newsItem.description}</p>`;
}

Reader.open("data/GeoLite2-Country.mmdb").then((reader) => {
    app.get("/", async (req, res) => {
        ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
        if (ip.startsWith("::ffff:")) {
            ip = ip.substring(7);
        }

        // For testing, pick a country and comment out the return below.
        const country = "RU";
        try {
            let searchResult = reader.country(ip);
            const country = searchResult.country.isoCode;
        } catch (e) {
            console.log("Could not find address", ip, e);
            res.send("");
            return;
        }

        if (COUNTRY_CODES_TO_SHOW_IN.includes(country)) {
            const news = await getNews();

            if (news) {
            let content = [];
            for (let newsItem of news) {
                content.push(formatNewsItem(newsItem));
            }

            res.send(`<html><body>${content.join("\n")}</body></html>`);
            return;
        }
        }

        res.send("");
    });

    var server = app.listen(5000, function () {
        console.log("Node server is running...");
    });
});
