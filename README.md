# News-Frame

Small self-contained service that provides an easy to integrate widget that shows selected RSS feed in given geo location while forwarding and caching the content, so that the client doesn't hit the server directly.

## Integration

There are generally three ways to integrate.

1. The **/** endpoint returns html page that can be put directly into an iframe. Currently, this method completely lacks styling.

```
<iframe name="news" src="SERVER/" loading="lazy"></iframe>
```

2. The **/script** endpoint provides a hosted javascript that can be loaded and pointed towards a pre-existing div. The endpoint accepts id, width and height query parameters which are used to find the div and overwrite its styling once the content is loaded.

```
<script async src="/script?id=newsframe&height=100px"></script>

<div id="newsframe" style="display:block; width:0px; height: 0px;" >
</div>
```

3. The **/json** endpoint simply provides the channel data as json, if the client comes from the desired location. The callers can then process the data as they desire. This is a basis for integration 2.

## Running

1. Register and download the GeoLite2-Country.mmdb from https://dev.maxmind.com/geoip/geolite2-free-geolocation-data?lang=en

Once you have it, put it into ./data/ directory

2. Check the configuration on the top of the index.js file. Change port, news source and/or the caching values if needed.

3. The application currently doesn't require a build. You can simply run it using:

> nvm use

> npm start

If you want to run it as a deamon a server, using pm2 is recommended:

> pm2 start -n newsframe npm start
