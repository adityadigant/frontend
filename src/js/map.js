var map;
var globMark;
let o;
let selectedSubs;
ApplicationState = {
  office: '',
  location: '',
  knownLocation: false,
  venue: '',
  iframeVersion: 9,
}

function showNoLocationFound(error) {
  document.getElementById('start-load').classList.add('hidden');
  handleError({
    message: error.message,
    body: JSON.stringify(error.stack)
  })
  document.getElementById('app-current-panel').innerHTML = `
    <div class="center-abs location-not-found">
    <i class='material-icons mdc-theme--secondary'>location_off</i>
    <p class='mdc-typography--headline5'>
    Failed To Detect Your Location
    </p>
    <button class="mdc-button mdc-theme--primary-bg" id='try-again'>
    <span class="mdc-button__label mdc-theme--on-primary">RETRY</span>
    </button>
    </div>`
  document.getElementById('try-again').addEventListener('click', function (evt) {
    document.querySelector('.center-abs.location-not-found').classList.add('hidden')
    openMap()
  })
}



function mapView(location) {


  document.getElementById('app-header').classList.add('hidden');

  ApplicationState.location = location
  history.pushState(['mapView'], null, null);
  const panel = document.getElementById('app-current-panel')
  panel.innerHTML = mapDom();
  document.getElementById('map-view').style.height = '100%';

  const latLng = {
    lat: location.latitude,
    lng: location.longitude
  }
  console.log(latLng)
  const offsetBounds = new GetOffsetBounds(location, 0.5);

  const o = {
    north: offsetBounds.north(),
    south: offsetBounds.south(),
    east: offsetBounds.east(),
    west: offsetBounds.west()
  };

  if (!document.getElementById('map')) return;
  console.log(google);

  const map = new google.maps.Map(document.getElementById('map'), {
    center: latLng,
    zoom: 20,
    disableDefaultUI: true,
    restriction: {
      latLngBounds: o,
      strictBounds: true,
    },
    zoomControl: true
  })

  var marker = new google.maps.Marker({
    position: latLng,
    icon: './img/bluecircle.png',
    map:map
  });
  
  var radiusCircle = new google.maps.Circle({
    strokeColor: '#89273E',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#89273E',
    fillOpacity: 0.35,
    map: map,
    center: latLng,
    radius: location.accuracy
  });

  google.maps.event.addListenerOnce(map, 'idle', function () {
    console.log('idle_once');
    loadNearByLocations(o, map, location).then(function (markers) {

      if (!markers.length) return createUnkownCheckIn()
      document.getElementById('map').style.display = 'block'
      loadCardData(markers)
    })
  });
}

function createUnkownCheckIn() {

  const offices = Object.keys(ApplicationState.officeWithCheckInSubs);
  ApplicationState.knownLocation = false;
  const prom = []
  offices.forEach(function (office) {
    const copy = JSON.parse(JSON.stringify(ApplicationState.officeWithCheckInSubs[office]));
    const vd = copy.venue[0]
    copy.venue = [{
      geopoint: {
        latitude: '',
        longitude: ''
      },
      location: '',
      address: '',
      venueDescriptor: vd
    }]
    copy.share = [];
    prom.push(requestCreator('create', copy))
  })

  // cardProd.open();
  Promise.all(prom).then(function () {

    // cardProd.close()
    successDialog('Check-In Created')
    ApplicationState.lastCheckInCreated = Date.now()
    localStorage.setItem('ApplicationState', JSON.stringify(ApplicationState));
    getSuggestions()
  }).catch(function (error) {
    snacks(error.response.message);
    // cardProd.close()
  })
}

function loadCardData(markers) {
  document.getElementById('start-load').classList.add('hidden');
  ApplicationState.knownLocation = true;
  const venues = `<ul class='mdc-list mdc-list  mdc-list--two-line mdc-list--avatar-list' id='selected-venue'>
  ${renderVenue(markers)}
</ul>`
  const dialog = new Dialog('Where are you ? ', venues, 'choose-venue').create('simple');
  dialog.open();
  dialog.scrimClickAction = ''
  const ul = new mdc.list.MDCList(document.getElementById('selected-venue'))
  bottomDialog(dialog, ul)
  ul.listen('MDCList:action', function (evt) {
    if (evt.detail.index === markers.length + 1) return createUnkownCheckIn();

    const checkInRequestBody = setVenueForCheckIn(value, ApplicationState.officeWithCheckInSubs[value.office])
    requestCreator('create', checkInRequestBody).then(function () {
      successDialog('Check-In Created')
      cardProd.close();
      ApplicationState.lastCheckInCreated = Date.now()
      localStorage.setItem('ApplicationState', JSON.stringify(ApplicationState));
      getSuggestions();
    }).catch(function (error) {


      snacks(error.response.message);
      cardProd.close()
    })
  })
};

function renderVenue(markers) {


  if (markers.length == 1) {
    return venueList(markers[0]) + loadUnkwown();
  };

  if (markers.length > 1) {
    let string = '';
    markers.forEach(function (venue) {
      string += venueList(venue);
    })
    string += loadUnkwown();
    return string;
  };
}

function loadUnkwown() {
  return ` <li class='mdc-list-item venue-list-item  pl-0 pr-0'>
  <span class="mdc-list-item__graphic material-icons" aria-hidden="true">location_on</span>
    Unkwown location
    <span class="mdc-list-item__meta material-icons" aria-hidden="true">keyboard_arrow_right</span>
  </li>`
}


function venueList(venue) {


  return `<li class='mdc-list-item venue-list-item  pl-0 pr-0'>
    <span class="mdc-list-item__graphic material-icons" aria-hidden="true">location_on</span>
    <span class="mdc-list-item__text">
      <span class="mdc-list-item__primary-text">${venue.location}</span>
      <span class="mdc-list-item__secondary-text">${venue.office}</span>
    </span>
    <span class="mdc-list-item__meta material-icons" aria-hidden="true">keyboard_arrow_right</span>
    </li>
  
    `


}

function showNoOfficeFound() {
  const content = `<h3 class='mdc-typography--headline6'>No Office Found For ${firebase.auth().currentUser.phoneNumber}</h3>
  <p>Please Contact Your Administrator</p>
  `
  const dialog = new Dialog('No Office Found', content).create('simple');
  dialog.scrimClickAction = ''
  dialog.open();
}

function getAllSubscriptions() {
  return new Promise(function (resolve, reject) {

    const tx = db.transaction("subscriptions");
    const result = [];
    tx.objectStore('subscriptions').openCursor().onsuccess = function (event) {
      const cursor = event.target.result;
      if (!cursor) return;
      if (cursor.value.status === 'CANCELLED') {
        cursor.continue();
        return;
      }
      result.push(cursor.value)
      cursor.continue();
    }
    tx.oncomplete = function () {

      return resolve(result)


    }
  })
}



function toggleCardHeight(toggle, cardSelector) {
  const el = document.getElementById('map-view');
  const card = document.getElementById(cardSelector);
  if (toggle) {
    el.classList.add('hidden')
    card.classList.remove('hidden');
    card.style.height = '100%';
    document.getElementById('app-header').classList.add('hidden')

  } else {
    el.classList.remove('hidden');
    document.getElementById('selection-box').classList.remove('hidden');
    card.classList.add('hidden');
    document.getElementById('app-header').classList.remove('hidden')

  }
}


function mapDom() {
  return `
  <div id='map-view' class=''>
    <div id='map'></div>
    
    </div>
  `
}

function snapView() {
  history.pushState(['snapView'], null, null)
  if (native.getName() === "Android") {
    AndroidInterface.startCamera("setFilePath");
    return
  }
  webkit.messageHandlers.startCamera.postMessage("setFilePath")
}

function setFilePathFailed(error) {
  snacks(error);
}

function setFilePath(base64) {

  const backIcon = `<a class='mdc-top-app-bar__navigation-icon'><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></a>`
  const header = getHeader('app-header', backIcon, '');
  header.root_.classList.remove('hidden')

  const url = `data:image/jpg;base64,${base64}`
  document.getElementById('app-current-panel').innerHTML = `

  <div class='image-container'>
  <div id='snap' class="snap-bckg">
  <div class="form-meta snap-form">
    <div class="mdc-text-field mdc-text-field--no-label mdc-text-field--textarea" id='snap-textarea'>
        <textarea
        class="mdc-text-field__input  snap-text mdc-theme--on-primary" rows="1" cols="100"></textarea></div>
        <button id='snap-submit' class="mdc-fab app-fab--absolute mdc-theme--primary-bg  mdc-ripple-upgraded"
      style="z-index: 9;">
      <svg class="mdc-button__icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/><path d="M0 0h24v24H0z" fill="none"/></svg>
      </button>
  </div>
  </div>

  </div>
  `

  const content = document.getElementById('snap')
  const textarea = new mdc.textField.MDCTextField(document.getElementById('snap-textarea'))
  const submit = new mdc.ripple.MDCRipple(document.getElementById('snap-submit'))


  textarea.focus();
  textarea.input_.addEventListener('keyup', function () {
    this.style.paddingTop = '25px';
    this.style.height = '5px'
    this.style.height = (this.scrollHeight) + "px";
    if (this.scrollHeight <= 300) {
      submit.root_.style.bottom = (this.scrollHeight - 20) + "px";
    }
  });
  submit.root_.addEventListener('click', function () {
    const textValue = textarea.value;
    const offices = Object.keys(ApplicationState.officeWithCheckInSubs);

    progressBar.open();

    if (offices.length == 1) {
      const sub = ApplicationState.officeWithCheckInSubs[offices[0]]
      sub.attachment.Photo.value = url
      sub.attachment.Comment.value = textValue;
      requestCreator('create', setVenueForCheckIn(ApplicationState.venue, sub)).then(function () {
        getSuggestions()
        successDialog('Check-In Created')
        progressBar.close()
      }).catch(function (error) {
        snacks(error.message)
        progressBar.close()
      })
      return;
    }

    const dialog = new Dialog('Send To', radioList(offices)).create();
    const list = new mdc.list.MDCList(document.getElementById('dialog-office'))
    dialog.open();
    dialog.listen('MDCDialog:opened', () => {
      list.layout();
      list.singleSelection = true
    });

    dialog.listen('MDCDialog:closed', function (evt) {
      if (evt.detail.action !== 'accept') return;
      const sub = ApplicationState.officeWithCheckInSubs[offices[list.selectedIndex]]
      sub.attachment.Photo.value = url
      sub.attachment.Comment.value = textValue;
      requestCreator('create', setVenueForCheckIn(ApplicationState.venue, sub)).then(function () {
        getSuggestions()
        successDialog('Check-In Created')
        progressBar.close()
      }).catch(function (error) {
        progressBar.close()
        snacks(error.response.message)
      })
    })
  })


  const image = new Image();
  image.onload = function () {

    const orientation = getOrientation(image);
    content.style.backgroundImage = `url(${url})`
    if (orientation == 'landscape' || orientation == 'sqaure') {
      content.style.backgroundSize = 'contain'
    }
  }
  image.src = url;
}



function mdcDefaultSelect(data, label, id, option) {
  const template = `<div class="mdc-select" id=${id}>
  <i class="mdc-select__dropdown-icon"></i>
  <select class="mdc-select__native-control">
  <option disabled selected></option>
  ${data.map(function(value){
    return ` <option value='${value}'>
    ${value}
    </option>`
}).join("")}
${option}

  </select>
  <label class='mdc-floating-label'>${label}</label>
  <div class="mdc-line-ripple"></div>
</div>`
  return template;
}


function mdcSelectVenue(venues, label, id) {
  const template = `<div class="mdc-select" id=${id}>
  <i class="mdc-select__dropdown-icon"></i>
  <select class="mdc-select__native-control">
  <option disabled selected value=${JSON.stringify('0')}></option>
  <option value=${JSON.stringify('1')}>UNKNOWN LOCATION</option>

  ${venues.map(function(value){
    return ` <option value='${JSON.stringify(value)}'>
    ${value.location}
    </option>`
  }).join("")}
  
</select>
  <label class='mdc-floating-label'>${label}</label>
  <div class="mdc-line-ripple"></div>
</div>`
  return template;
}



function getOrientation(image) {
  if (image.width > image.height) return 'landscape'
  if (image.height > image.width) return 'potrait'
  if (image.width == image.height) return 'square'
}

function focusMarker(map, latLng, zoom) {
  map.setZoom(zoom);
  map.panTo(latLng);
}

function GetOffsetBounds(latlng, offset) {
  const radius = 6378
  const d = (180 / Math.PI);
  this.latLng = latlng
  this.ratio = (offset / radius) * d;
  this.radioLon = (this.ratio) / Math.cos(this.latLng.latitude * Math.PI / 180)
}

GetOffsetBounds.prototype.north = function () {
  return this.latLng.latitude + this.ratio
}
GetOffsetBounds.prototype.south = function () {
  return this.latLng.latitude - this.ratio
}
GetOffsetBounds.prototype.east = function () {
  return this.latLng.longitude + this.radioLon
}
GetOffsetBounds.prototype.west = function () {
  return this.latLng.longitude - this.radioLon
}


function loadNearByLocations(o, map, location) {
  return new Promise(function (resolve, reject) {
    var infowindow = new google.maps.InfoWindow();
    const result = []
    let lastOpen;
    const tx = db.transaction(['map'])
    const store = tx.objectStore('map');
    const index = store.index('bounds');
    const idbRange = IDBKeyRange.bound([o.south, o.west], [o.north, o.east]);
    const bounds = map.getBounds();
   
    index.openCursor(idbRange).onsuccess = function (event) {
      const cursor = event.target.result;
      if (!cursor) return;

      if (!ApplicationState.officeWithCheckInSubs[cursor.value.office]) {
        cursor.continue();
        return;
      };
     
      result.push(cursor.value)
   

      var marker = new google.maps.Marker({
        position: {
          lat: cursor.value.latitude,
          lng: cursor.value.longitude
        },

        icon: {
          url: './img/m.png',
          size: new google.maps.Size(71, 71),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(17, 34),
          scaledSize: new google.maps.Size(25, 25)
        },
        id: cursor.value.activityId,
        value: JSON.stringify(cursor.value)
      });


      marker.setMap(map);
      const content = `<span>${cursor.value.location}</span>`
      google.maps.event.addListener(marker, 'click', (function (marker, content, infowindow) {
        return function () {
          if (lastOpen) {
            lastOpen.close();
          };
          infowindow.setContent(content);
          infowindow.open(map, marker);
          lastOpen = infowindow;
        };
      })(marker, content, infowindow));
      bounds.extend(marker.getPosition())
      cursor.continue();
    }
    tx.oncomplete = function () {
      map.fitBounds(bounds);
      console.log(result)

      return resolve(result)
    }
  })
}

function radioList(offices) {
  return `<ul class='mdc-list' role='radiogroup' id='dialog-office'>
            ${offices.map(function(office,idx){
              return ` <li class="mdc-list-item" role="radio" aria-checked="${idx ? 'false':'true'}" tabindex=${idx ? '':'0'}>
              <span class="mdc-list-item__graphic">
                <div class="mdc-radio">
                  <input class="mdc-radio__native-control"
                          type="radio"
                          id='demo-list-radio-item-${idx}'
                          name="demo-list-radio-item-group"
                          value="1">
                    <div class="mdc-radio__background">
                      <div class="mdc-radio__outer-circle"></div>
                      <div class="mdc-radio__inner-circle"></div>
                    </div>
                  </div>
                </span>
                <label class="mdc-list-item__text" for="demo-list-radio-item-${idx}">${office}</label>
              </li>`
              }).join("")}
            <ul>`
}