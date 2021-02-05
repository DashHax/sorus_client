import { writable } from "svelte/store";

const GeoLocation = writable({ lat: 0, lng: 0, acc: 9999 });

let retryCount = 3;
let currentTry = 0;
let geoID = null;
let started = false;

function startWatch(e:GeolocationPosition) {
    currentTry = 0;
    if (!started)
        started = true;
    GeoLocation.update(item => {
        item.acc = e.coords.accuracy;
        item.lat = e.coords.latitude;
        item.lng = e.coords.longitude;

        return item;
    });
}

function errorWatch(e:GeolocationPositionError) {
    if (currentTry < retryCount) {
        currentTry++;
        startGeolocation();
    } else {
        console.log(e);
        window.notify("Could not start geolocation! Please make sure you switched on your Location Service.");
    }
}

function startGeolocation() {
    if (!started) {
        geoID = navigator.geolocation.watchPosition(startWatch, errorWatch, {
            enableHighAccuracy: true,
            timeout: 5000
        });
    }
}

function stopGeolocation() {
    navigator.geolocation.clearWatch(geoID);
    started = false;
}

export {
    GeoLocation, startGeolocation, stopGeolocation
}