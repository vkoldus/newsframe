const express = require("express");
const axios = require("axios").default;
const Reader = require("@maxmind/geoip2-node").Reader;
const { XMLParser } = require("fast-xml-parser");
const { setup } = require("axios-cache-adapter");
const { URL } = require("url");
const LRU = require("lru-cache");
const fs = require("fs");
const util = require("util");
const readFile = (fileName) => util.promisify(fs.readFile)(fileName, "utf8");

const SERVER_PORT = 5000;
const PUBLIC_HOST = "http://127.0.0.1:5000";
const COUNTRY_CODES_TO_SHOW_IN = ["RU"];
const NEWS_URL = "http://feeds.bbci.co.uk/russian/rss.xml";
const HEADLINE = "BBC";
const REQUEST_CACHE_MAX_AGE = 5 * 60 * 1000;
const HOSTED_JS_MAX_AGE = 5 * 60 * 1000;
const RESPONSE_CACHE_CONFIG = {
    max: 1,
    ttl: 1000 * 5,
    ttlResolution: 100,
};

const app = express();
const parser = new XMLParser();
const url = new URL(NEWS_URL);
const api = setup({
    baseUrl: url.origin,
    maxAge: REQUEST_CACHE_MAX_AGE,
    readHeaders: true,
});
const responseCache = new LRU(RESPONSE_CACHE_CONFIG);
let hostedScript = null;

const NEWS_CACHE_KEY = "news";
const NEWS_JSON_CACHE_KEY = "news_json";

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

    const news = parser.parse(rssResponse.data);
    if (!news) {
        console.error("Could not parse news content.");
        return null;
    }

    return news.rss.channel.item;
}

function formatResponse(newsList) {
    const formattedItems = newsList.map(
        (item) =>
            `<h2><a href='${item.link}'>${item.title}<a></h2><p>${item.description}</p>`
    );

    const style = `<style>
    body {
        font-family: 'arial';
        font-size: 10px;
    }
    </style>`;

    return `<html><body>${style}<h1>${HEADLINE}</h1>${formattedItems.join(
        "\n"
    )}</body></html>`;
}

async function getAndFormatNews() {
    const news = await getNews();

    if (news) {
        return formatResponse(news);
    } else {
        return null;
    }
}

async function seedCache() {
    console.log("Making first news request, seeding cache.");
    const cacheSeed = await getAndFormatNews();
    if (cacheSeed) {
        responseCache.set(NEWS_CACHE_KEY, cacheSeed);
    }
}

function sendResponseJson(res, payload) {
    res.set({
        "content-type": "application/json; charset=utf-8",
        "access-control-allow-origin": "*",
    });
    res.send(payload);
}

function sendResponseJs(res, payload) {
    res.set({
        "content-type": "text/javascript; charset=utf-8",
        "access-control-allow-origin": "*",
        "cache-control": `max-age=${HOSTED_JS_MAX_AGE}`,
    });
    res.send(payload);
}

function sendResponseHtml(res, payload) {
    res.set({
        "content-type": "text/html; charset=utf-8",
        "access-control-allow-origin": "*",
    });
    res.send(payload);
}

function shouldShowInThisCountry(req, reader) {
    // for testing
    // return true;

    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    if (ip.startsWith("::ffff:")) {
        ip = ip.substring(7);
    }

    let country = "RU";
    try {
        const searchResult = reader.country(ip);
        country = searchResult.country.isoCode;
    } catch (e) {
        console.log("Could not find address", ip, e);
        return false;
    }

    return COUNTRY_CODES_TO_SHOW_IN.includes(country);
}

async function main() {
    const reader = await Reader.open("data/GeoLite2-Country.mmdb");
    await seedCache();
    hostedScript = await readFile("src/integration.js");

    app.get("/", async (req, res) => {
        if (shouldShowInThisCountry(req, reader)) {
            let response = responseCache.get(NEWS_CACHE_KEY);
            if (response) {
                sendResponseHtml(res, response);
                return;
            }

            response = await getAndFormatNews();
            if (response) {
                responseCache.set(NEWS_CACHE_KEY, response);
                sendResponseHtml(res, response);
                return;
            }
        }

        sendResponseHtml(res, "");
    });

    app.get("/json", async (req, res) => {
        if (shouldShowInThisCountry(req, reader)) {
            let response = responseCache.get(NEWS_JSON_CACHE_KEY);
            if (response) {
                sendResponseJson(res, response);
                return;
            }

            news = await getNews();
            if (news) {
                responseCache.set(NEWS_JSON_CACHE_KEY, news);
                sendResponseJson(res, news);
                return;
            }
        }

        sendResponseJson(res, {});
    });

    app.get("/script", async (req, res) => {
        if (shouldShowInThisCountry(req, reader)) {
            let id = req.query.id;
            if (id != null) {
                sendResponseJs(
                    res,
                    'let divId = "' +
                        req.query.id +
                        '";' +
                        'let newsUrl = "' +
                        PUBLIC_HOST +
                        '/json";' +
                        hostedScript
                );
                return;
            }
        }

        sendResponseJs(res, "");
    });

    const server = app.listen(SERVER_PORT, function () {
        console.log(`Server listening on port ${SERVER_PORT}...`);
    });
}

main().catch((e) => {
    console.error("Server terminated with error", e);
});
