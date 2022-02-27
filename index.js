const express = require("express");
const axios = require("axios").default;
const Reader = require("@maxmind/geoip2-node").Reader;
const { XMLParser } = require("fast-xml-parser");
const { setup } = require("axios-cache-adapter");
const { URL } = require("url");
const LRU = require("lru-cache");

const app = express();
const parser = new XMLParser();

const COUNTRY_CODES_TO_SHOW_IN = ["RU"];
const NEWS_URL = "http://feeds.bbci.co.uk/russian/rss.xml";
const HEADLINE = "BBC";
const REQUEST_CACHE_MAX_AGE = 5 * 60 * 1000;
const RESPONSE_CACHE_CONFIG = {
    max: 100,
    ttl: 1000 * 30,
    ttlResolution: 100,
};

const url = new URL(NEWS_URL);
const api = setup({
    baseUrl: url.origin,
    maxAge: REQUEST_CACHE_MAX_AGE,
    readHeaders: true,
});

const responseCache = new LRU(RESPONSE_CACHE_CONFIG);

const NEWS_CACHE_KEY = "news";
async function getNews() {
    let rssResponse;

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
            let response = responseCache.get(NEWS_CACHE_KEY);
            if (response) {
                res.send(response);
                return;
            }

            news = await getNews();

            if (news) {
                let content = [];
                for (let newsItem of news) {
                    content.push(formatNewsItem(newsItem));
                }

                response = `<html><body><h1>${HEADLINE}</h1>${content.join(
                    "\n"
                )}</body></html>`;
                responseCache.set(NEWS_CACHE_KEY, response);
                res.send(response);
                return;
            }
        }

        res.send("");
    });

    var server = app.listen(5000, function () {
        console.log("Node server is running...");
    });
});
