# News-Frame

Small self-contained service that provides an easy to integrate widget that shows selected RSS feed in given geo location while forwarding and caching the content, so that the client doesn't hit the server directly.

## Integration

There are 4 ways how to integrate.

### 1. IFrame

The **/** endpoint returns html page that can be put directly into an iframe. Currently, this method completely lacks styling.

```
<iframe name="news" src="http://127.0.0.1:5000/" loading="lazy"></iframe>
```

[Full Example](./examples/example_iframe.html)

### 2. Dynamically filled div

The **/script** endpoint provides a hosted javascript that can be loaded and pointed towards a pre-existing div.

```
<script async src="http://127.0.0.1:5000/script?id=newsframe&height=100px"></script>

<div id="newsframe" style="display:block; width:0px; height: 0px;" >
</div>
```

[Full Example](./examples/example_div.html)

The endpoint accepts following query parameters which are used to find the div and overwrite its styling once the content is loaded:

-   **id** - Id of the div which will be filled with content.
-   **width** - Set the div's style width to this value if there is any content. Default is 100%.
-   **height** - set the div's style height to this value if there is any content. Default is 150px;
-   **className** - set the div's class name that can be then use for further styling. Default is 'com-x-newsFrame'.
-   **headline** - set the text inside the leading headline of the content. Default is 'News'.

### 3. Floating div

The content can also be shown in a floating div-window. The hosted script can use [JSFrame](https://github.com/riversun/JSFrame.js) to do that. All you need to do is to make sure JSFrame is loaded and no div id is specified.

You may use the width and height parameters to specify the initial window size and further styling using the class name. Headline parameter defines the window's title.

```
<html>
    <body>
        <script src="https://cdn.jsdelivr.net/npm/jsframe.js/lib/jsframe.min.js"></script>
        <script async src="http://127.0.0.1:5000/script"></script>
        Rest of the page content.
    </body>
</html>
```

[Full Example](./examples/example_floating_div.html)

### 4. Load and show content manually

The **/json** endpoint simply provides the channel data as json, if the client comes from the desired location. The callers can then process the data as they desire. This is how integrations 2. and 3. get their data.

## Running

1. Register and download the GeoLite2-Country.mmdb from https://dev.maxmind.com/geoip/geolite2-free-geolocation-data?lang=en

Once you have it, put it into ./data/ directory

2. Check the configuration on the top of the index.js file. Change port, news source and/or the caching values if needed.

3. The application currently doesn't require a build. You can simply run it using:

> nvm use

> npm start

If you want to run it as a deamon a server, using pm2 is recommended:

> pm2 start -n newsframe npm start

```

```
