importScripts("https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.js");

self.onmessage = function (event) {
  const dbName = event.data.dbName;

  const handler = {
    urgent: urgent,
    nearBy: nearBy,
  }

  const req = indexedDB.open(dbName)
  let userCoords;
  let distanceArr = []
  req.onsuccess = function () {
    const db = req.result;
    handler[type](db, dbName);
  }

  
  function urgent(db) {
    const calTx = db.transaction(['calendar']);
    const calendarObjectStore = calTx.objectStore('calendar');
    const results = [];
    const yesterday = moment().subtract(1, 'days');
    const tomorrow = moment().add(1, 'days');
    calendarObjectStore.openCursor().onsuccess = function (event) {
      const cursor = event.target.result;
      if (!cursor) return;
      if (yesterday.isSameOrBefore(cursor.value.start) || tomorrow.isSameOrAfter(cursor.value.end)) {
        results.push(cursor.value);
      }
      cursor.continue();
    }

    calTx.oncomplete = function () {
      const sorted = sortDatesInDescindingOrder(results);
        self.postMessage(sorted)
    }

  }

  function sortDatesInDescindingOrder(results) {
    const ascending = results.sort(function (a, b) {
      return moment(b.end).valueOf() - moment(a.end).valueOf();
    })
    return ascending;
  }

  function nearBy(db, dbName) {

    const rootTx = db.transaction(['root']);
    const rootStore = rootTx.objectStore('root');
    rootStore.get(dbName).onsuccess = function (event) {
      const record = event.target.result;

      userCoords = {
        'latitude': record.latitude,
        'longitude': record.longitude
      }
    }

    rootTx.oncomplete = function () {

      const mapTx = db.transaction(['map'], 'readwrite');

      const mapObjectStore = mapTx.objectStore('map');
      mapObjectStore.openCursor().onsuccess = function (curEvent) {
        const cursor = curEvent.target.result
        if (!cursor) return;
    
        distanceArr.push(calculateDistance(userCoords, cursor.value))
        cursor.continue()
      }
      mapTx.oncomplete = function () {
        const filtered = distanceArr.filter(function (record) {
          return record !== null;
        })
        self.postMessage(filtered)
      }
    }
  }

  function calculateDistance(userCoords, otherLocations) {
    var R = 6371; // km
    const THRESHOLD = 0.5 //km
    if (!otherLocations.latitude || !otherLocations.longitude) return null;

    const dLat = toRad(userCoords.latitude - otherLocations.latitude);
    const dLon = toRad(userCoords.longitude - otherLocations.longitude);
    const lat1 = toRad(userCoords.latitude);
    const lat2 = toRad(otherLocations.latitude);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    if (distance <= THRESHOLD) {
      const record = {
        activityId: otherLocations.activityId,
        distance: distance
      }
      return record;
    }
    return null;

  }

  function toRad(value) {
    return value * Math.PI / 180;
  }
}