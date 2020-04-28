const appKey = new AppKeys();
let progressBar;
var db;
let snackBar;
let DB_VERSION = 31;
var EMAIL_REAUTH;
var firebaseUI;
var sliderIndex = 1;
var sliderTimeout = 10000;
var potentialAlternatePhoneNumbers;
var firebaseDeepLink;
var facebookDeepLink;
var updatedWifiAddresses = {
  addresses: {},
  timestamp: null
}
var isNewUser = false;

function setFirebaseAnalyticsUserId(id) {
  if (window.AndroidInterface && window.AndroidInterface.setFirebaseAnalyticsUserId) {
    window.AndroidInterface.setFirebaseAnalyticsUserId(id)
    return
  }
  if (window.messageHandlers && window.messageHandlers.firebaseAnalytics) {
    window.messageHandlers.firebaseAnalytics.postMessage({
      command: 'setFirebaseAnalyticsUserId',
      id: id
    })
    return
  }
  console.log('No native apis found');
}

function logFirebaseAnlyticsEvent(name, params) {
  if (!name) {
    return;
  }

  if (window.AndroidInterface && window.AndroidInterface.logFirebaseAnlyticsEvent) {
    // Call Android interface
    window.AndroidInterface.logFirebaseAnlyticsEvent(name, JSON.stringify(params));
  } else if (window.webkit &&
    window.webkit.messageHandlers &&
    window.webkit.messageHandlers.firebaseAnalytics) {
    // Call iOS interface
    var message = {
      name: name,
      parameters: params,
      command: 'logFirebaseAnlyticsEvent'
    };
    window.webkit.messageHandlers.firebaseAnalytics.postMessage(message);
  } else {
    // No Android or iOS interface found
    console.log("No native APIs found.");
  }
}

function setFirebaseAnalyticsUserProperty(name, value) {
  if (!name || !value) {
    return;
  }

  if (window.AndroidInterface && window.AndroidInterface.setFirebaseAnalyticsUserProperty) {
    // Call Android interface
    window.AndroidInterface.setFirebaseAnalyticsUserProperty(name, value);
  } else if (window.webkit &&
    window.webkit.messageHandlers &&
    window.webkit.messageHandlers.firebaseAnalytics) {
    // Call iOS interface
    var message = {
      command: 'setFirebaseAnalyticsUserProperty',
      name: name,
      value: value
    };
    window.webkit.messageHandlers.firebaseAnalytics.postMessage(message);
  } else {
    // No Android or iOS interface found
    console.log("No native APIs found.");
  }
}

function parseFacebookDeeplink(link) {

  console.log("fb link ", link)
  const url = new URL(link);
  const query = new URLSearchParams(url.search);
  facebookDeepLink = query;
  if (!firebase.auth().currentUser) return;
}

/**
 * long dynamic link intercepted by device containing query parameters
 * @param {string} link 
 */

function parseDynamicLink(link) {
  const url = new URL(link);
  firebaseDeepLink = new URLSearchParams(url.search);
  if (!firebase.auth().currentUser) return;
}

/**
 * 
 * @param {string} componentValue 
 * package name of app through thich link was shared
 */
function linkSharedComponent(componentValue) {
  console.log(componentValue);
  logFirebaseAnlyticsEvent('share', {
    method: componentValue,
    content_type: 'text'
  });
}
/**
 * 
 * @param {String} wifiString 
 */
function updatedWifiScans(wifiString) {
  console.log("updated wifi", wifiString)
  const result = {}
  const splitBySeperator = wifiString.split(",")
  splitBySeperator.forEach(function (value) {
    const url = new URLSearchParams(value);
    if (url.has('ssid')) {
      url.delete('ssid')
    }
    if (!url.has('macAddress')) return;
    result[url.get("macAddress")] = true
  })
  updatedWifiAddresses.addresses = result;
  updatedWifiAddresses.timestamp = Date.now()

};

/**
 * Global error logger
 */

window.addEventListener('error', function (event) {
  this.console.error(event.message)
  if (event.message.toLowerCase().indexOf('script error') > -1) return;
  handleError({
    message: 'global error :' + event.message,
    body: {
      lineno: event.lineno,
      filename: event.filename,
      colno: event.colno,
      error: JSON.stringify({
        stack: event.error.stack,
        message: event.error.message
      })
    }
  })
})

/**
 * 
 * @param {Event} source 
 *  load placeholder user image if image url fails to load 
 */
function imgErr(source) {
  source.onerror = '';
  source.src = './img/empty-user.jpg';
  return true;
}

let native = function () {
  var deviceInfo = '';
  return {
    setFCMToken: function (token) {
      localStorage.setItem('token', token)
    },
    getFCMToken: function () {
      return localStorage.getItem('token')
    },
    setName: function (device) {
      localStorage.setItem('deviceType', device);
    },
    getName: function () {
      return localStorage.getItem('deviceType');
    },

    setIosInfo: function (iosDeviceInfo) {
      const queryString = new URLSearchParams(iosDeviceInfo);
      var obj = {}
      queryString.forEach(function (val, key) {
        if (key === 'appVersion') {
          obj[key] = Number(val)
        } else {
          obj[key] = val
        }
      })
      deviceInfo = obj
    },
    getInfo: function () {
      if (!this.getName()) return false;
      if (this.getName() === 'Android') {
        deviceInfo = getAndroidDeviceInformation()
        return deviceInfo
      }
      return deviceInfo;
    }
  }
}();


/**
 * Call different JNI Android Methods to access device information
 */
function getAndroidDeviceInformation() {
  return JSON.stringify({
    'id': AndroidInterface.getId(),
    'deviceBrand': AndroidInterface.getDeviceBrand(),
    'deviceModel': AndroidInterface.getDeviceModel(),
    'osVersion': AndroidInterface.getOsVersion(),
    'baseOs': AndroidInterface.getBaseOs(),
    'radioVersion': AndroidInterface.getRadioVersion(),
    'appVersion': Number(AndroidInterface.getAppVersion()),
  })
}

window.onpopstate = function (event) {
  const nonRefreshViews = {
    'mapView': true,
    'userSignedOut': true,
    'profileCheck': true,
    'login': true,
    'addView': true,
    'share': true
  }
  if (!event.state) return;
  if (nonRefreshViews[event.state[0]]) return

  if (event.state[0] === 'reportView') {
    this.reportView(event.state[1])
    return;
  }
  if (event.state[0] === 'emailUpdation' || event.state[0] === 'emailVerificationWait') {
    history.go(-1);
    return;
  };
  if (window[event.state[0]]) {
    window[event.state[0]](event.state[1]);
  }
}


window.addEventListener('load', function () {

  firebase.initializeApp(appKey.getKeys())
  progressBar = new mdc.linearProgress.MDCLinearProgress(document.querySelector('#app-header .mdc-linear-progress'))
  snackBar = new mdc.snackbar.MDCSnackbar(document.querySelector('.mdc-snackbar'));
  topBar = new mdc.topAppBar.MDCTopAppBar(document.querySelector('.mdc-top-app-bar'))
  const panel = this.document.getElementById('app-current-panel');

  if (!window.Worker && !window.indexedDB) {
    const incompatibleDialog = new Dialog('App Incompatiblity', 'Growthfile  is incompatible with this device').create();
    incompatibleDialog.open();
    return;
  }

  firebase.auth().onAuthStateChanged(function (auth) {
    if (!auth) {
      logReportEvent("IN Slider");

      history.pushState(['userSignedOut'], null, null);
      userSignedOut()
      return;
    }



    const header = new mdc.topAppBar.MDCTopAppBar(document.getElementById('app-header'));
    header.listen('MDCTopAppBar:nav', handleNav);
    header.root_.classList.add("hidden");
    if (appKey.getMode() === 'production' && !native.getInfo()) return redirect()

    panel.classList.remove('hidden');
    if (EMAIL_REAUTH) {
      history.pushState(['reportView'], null, null);
      history.pushState(['profileView'], null, null);
      history.pushState(['emailUpdation'], null, null);
      emailUpdation(false, function () {
        EMAIL_REAUTH = false
        history.back()
      })
      return;
    }

    localStorage.setItem('error', JSON.stringify({}));
    localStorage.removeItem('storedLinks');
    checkNetworkValidation();
  });
})



function checkNetworkValidation() {
  if (!navigator.onLine) {
    failureScreen({
      message: 'You Are Currently Offline. Please Check Your Internet Connection',
      icon: 'wifi_off',
      title: 'BROKEN INTERNET CONNECTION'
    }, checkNetworkValidation)
    return;
  }
  startApp();
}



function firebaseUiConfig() {

  return {
    callbacks: {
      signInSuccessWithAuthResult: function (authResult) {
        setFirebaseAnalyticsUserId(firebase.auth().currentUser.uid);

        isNewUser = authResult.additionalUserInfo.isNewUser;
        if (!authResult.additionalUserInfo.isNewUser) {
          logReportEvent("login");
          logFirebaseAnlyticsEvent("login", {
            method: firebase.auth.PhoneAuthProvider.PROVIDER_ID
          })
          return false
        };

        firebase.auth().currentUser.getIdTokenResult().then(function (tokenResult) {

          if (isAdmin(tokenResult)) {
            logReportEvent("Sign Up Admin");
            setFirebaseAnalyticsUserProperty("isAdmin", "true");
          } else {
            logReportEvent("Sign Up");
          };
          const signUpParams = {
            method: firebase.auth.PhoneAuthProvider.PROVIDER_ID
          }
          var queryLink = firebaseDeepLink || facebookDeepLink;
          if (queryLink) {
            signUpParams.source = queryLink.get("utm_source");
            signUpParams.medium = queryLink.get("utm_medium");
            signUpParams.campaign = queryLink.get("utm_campaign")
          }

          logFirebaseAnlyticsEvent("sign_up", signUpParams);
        })
        return false;
      },
      signInFailure: function (error) {
        return handleUIError(error)
      },
      uiShown: function () {
        logFirebaseAnlyticsEvent('auth_page_open', {})
        const span = createElement('span', {
          className: 'text-center mdc-typography--subtitle1 legal-links',
        })
        span.appendChild(createElement('a', {
          textContent: 'Privacy policy',
          href: 'https://growthfile.com/legal#privacy-policy',
          target: '_blank'
        }))
        span.appendChild(createElement('span', {
          textContent: ' & '
        }))
        span.appendChild(createElement('a', {
          textContent: 'Terms of use',
          href: 'https://growthfile.com/legal#terms-of-use-user',
          target: '_blank'
        }))
        document.getElementById('login-container').appendChild(span)
      }
    },
    signInFlow: 'popup',
    signInOptions: [{
      provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
      recaptchaParameters: {
        type: 'image', // 'audio'
        size: 'invisible', // 'invisible' or 'compact'
        badge: 'bottomright' //' bottomright' or 'inline' applies to invisible.
      },
      defaultCountry: 'IN',

    }]
  };
}

function initializeFirebaseUI() {
  document.getElementById("app-header").classList.remove("hidden");
  const backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
  <span class="mdc-top-app-bar__title">Login</span>
  `;
  header = setHeader(backIcon, '');
  header.listen('MDCTopAppBar:nav', handleNav);
  firebaseUI = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(firebase.auth());
  firebaseUI.start(document.getElementById('login-container'), firebaseUiConfig());

}


function userSignedOut() {
  progressBar.close();
  document.getElementById("dialog-container").innerHTML = '';
  document.getElementById('step-ui').innerHTML = '';
  document.getElementById("app-header").classList.add("hidden");
  if (firebaseUI) {
    firebaseUI.delete();
  }

  const panel = document.getElementById('app-current-panel');
  panel.innerHTML = `
    <div class='slider' id='app-slider' style='background-image:url("./img/welcome.jpeg")'>
      
    <div class="action-button-container">
          <div class="submit-button-cont">
              <div class='dot-container'>
                <span class='dot active'></span>
                <span class='dot'></span>
                <span class='dot'></span>
              </div>
              <button class="mdc-button mdc-button--raised submit-btn" data-mdc-auto-init="MDCRipple"
                  id='login-btn'>
                  <div class="mdc-button__ripple"></div>
                  
                  <span class="mdc-button__label">Agree & Continue</span>
              </button>
          </div>
        </div>
    </div>
  `;


  const sliderEl = document.getElementById('app-slider');
  const btn = new mdc.ripple.MDCRipple(document.getElementById('login-btn'));
  btn.root_.addEventListener('click', function () {
    removeSwipe()
    panel.innerHTML = '';
    history.pushState(['login'], null, null);
    initializeFirebaseUI();
  })

  // var interval = setInterval(function () {
  sliderSwipe('right')
  // }, sliderTimeout);
  swipe(sliderEl, sliderSwipe);
}




function sliderSwipe(direction) {
  if (direction === 'left') {
    if (sliderIndex <= 1) {
      sliderIndex = 3;
    } else {
      sliderIndex--

    }
  }

  if (direction === 'right') {
    if (sliderIndex >= 3) {
      sliderIndex = 1;
    } else {
      sliderIndex++
    }
  }

  loadSlider();
  [...document.querySelectorAll('.dot')].forEach(function (dotEl, index) {
    dotEl.classList.remove('active');
    if (index == sliderIndex - 1) {
      dotEl.classList.add('active')
    }
  })
}

function loadSlider() {

  let src = '';

  switch (sliderIndex) {
    case 1:
      src = './img/welcome.jpeg'
      break;
    case 2:
      src = './img/proof.jpeg'
      break;
    case 3:
      src = './img/payments.jpeg'
      break;
  }

  document.getElementById('app-slider').style.backgroundImage = `url('${src}')`
}


function loadingScreen(data) {
  const panel = document.getElementById('app-current-panel');

  panel.innerHTML = `
  <div class='splash-content loading-screen' id='loading-screen' style="background-image:url(${data.src});">
    <div class='text-container'> 
      <p class='text'>${data.text} . . .</p>
    </div>  
  </div>
  `

}

function startApp() {
  const dbName = firebase.auth().currentUser.uid
  const req = window.indexedDB.open(dbName, DB_VERSION);
  req.onupgradeneeded = function (evt) {
    db = req.result;
    db.onerror = function () {
      handleError({
        message: `${db.error.message}`,
      })
      return;
    };
    switch (evt.oldVersion) {
      case 0:
        createObjectStores(db, dbName)
        break;
      case 30:
        createSubscriptionObjectStore(db);
        createMapObjectStore(db);
        createCalendarObjectStore(db);
        break;
    }

    if (db.objectStoreNames.contains('root')) {
      var rootStore = req.transaction.objectStore('root')
      rootStore.get(dbName).onsuccess = function (rootEvent) {
        const record = rootEvent.target.result;
        record.fromTime = 0;
        rootStore.put(record);
      }
    };



    console.log('version upgrade')
  }





  req.onsuccess = function () {
    console.log("request success")
    db = req.result;
    console.log("run app")
    loadingScreen({
      text:'Fetching details',
      src:'./img/fetching-details.jpg'
    })    
    const queryLink = facebookDeepLink || firebaseDeepLink;

    // regulator().then(console.log).catch(console.error)
    // if (queryLink) {
    //   requestCreator('acquisition', {
    //     source: queryLink.get('utm_source'),
    //     medium: queryLink.get('utm_medium'),
    //     campaign: queryLink.get('utm_camapign'),
    //     office: queryLink.get('office'),
    //     action: queryLink.get('action')
    //   }).then().catch(console.error)
    //   return
    // }



    // requestCreator('fcmToken', {
    //   token: native.getFCMToken()
    // }).then(console.log).catch(console.error)

    // requestCreator('newBankAccount', {
    //   bankAccount: '1234567891234',
    //   ifsc: 'qwert1234567',
    //   address1: 'Rohini sector A4, 283 284',
    //   email: firebase.auth().currentUser.email,
    //   upi: '+919999288921@upi',
    //   displayName: firebase.auth().currentUser.displayName
    // }).then(function (response) {
    //   console.log(response)
    // }).catch(console.error)

    // toDataURL('../src/img/currency_large.png', function (dataURL) {
    //   requestCreator('pan', {
    //     image: dataURL
    //   }).then(console.log).catch(console.error)
    //   requestCreator('aadhar', {
    //     front: dataURL,
    //     back: dataURL
    //   }).then(console.log).catch(console.error)
    // })

    // requestCreator('now').then(console.log).catch(console.error)
    // requestCreator('profile').then(console.log).catch(console.error)


    //   let rootRecord;
    //   const rootTx = db.transaction('root', 'readwrite');
    //   const store = rootTx.objectStore('root');
    //   store.get(dbName).onsuccess = function (transactionEvent) {
    //     rootRecord = transactionEvent.target.result;
    //     rootRecord.linkedAccounts = res.linkedAccounts || [];
    //     potentialAlternatePhoneNumbers = res.potentialAlternatePhoneNumbers || [];
    //     if (res.idProof) {
    //       rootRecord.idProof = res.idProof
    //     }
    //     store.put(rootRecord);
    //   }
    //   rootTx.oncomplete = function () {
    //     if (!rootRecord.fromTime) return requestCreator('Null').then(openMap).catch(console.error)
    //     openMap()
    //     runRead({
    //       read: '1'
    //     })
    //   }
    // }).catch(console.error)
  };

  req.onerror = function () {
    handleError({
      message: `${req.error.name}`,
      body: JSON.stringify(req.error.message)
    })
  }

}




function regulator() {
  const queryLink = facebookDeepLink || firebaseDeepLink;
  const deviceInfo = native.getInfo();
 
  return new Promise(function (resolve, reject) {
    var prom = queryLink ? requestCreator('acquisition', {
      source: queryLink.get('utm_source'),
      medium: queryLink.get('utm_medium'),
      campaign: queryLink.get('utm_camapign'),
      office: queryLink.get('office'),
    }) : Promise.resolve();
    prom
      .then(function () {
        return requestCreator('now')
      })
      .then(function () {
        return appLocation(3)
      })
      .then(function (geopoint) {
        return handleCheckin(geopoint)
      })
      .then(function () {
        if (localStorage.getItem(deviceInfo)) return Promise.resolve();
        return requestCreator('device', native.getInfo())
      })
      .then(function () {
        localStorage.setItem('deviceInfo', JSON.stringify(deviceInfo))
        return requestCreator('fcmToken', native.getFCMToken())
      })
      .then(function () {
        console.log('all completed')
      })
      .catch(function (error) {
        if(error.type === 'geolocation') return handleLocationError(error)
        snacks(error.message);
      })
  })
}



function handleCheckin(geopoint, noUser) {
  const queryLink = firebaseDeepLink || facebookDeepLink;
  if (queryLink && queryLink.get('action') === 'get-subscription') {
    const subscription = {
      attachment: {
        Comment: {
          type: 'string',
          value: ''
        },
        Photo: {
          type: 'base64',
          value: ''
        }
      },
      template: 'check-in',
      office: queryLink.get('office'),
      schedule: [],
      venue: ['Check-in Location'],
      status: 'PENDING'
    }
    ApplicationState.officeWithCheckInSubs = subscription;
    mapView(geopoint)
    return
  }
  getCheckInSubs().then(function (checkInSubs) {
    if (Object.keys(checkInSubs).length) {
      ApplicationState.officeWithCheckInSubs = checkInSubs;
      return mapView(geopoint)
    }
    if (noUser) {
      // no user found

      return
    }
    requestCreator('Null').then(function () {
      handleCheckin(geopoint, true)
    })
  });
}

function initProfileView() {

  document.getElementById('app-header').classList.remove('hidden')
  history.pushState(['profileCheck'], null, null)
  profileCheck();
}



function miniProfileCard(content, headerTitle, action) {

  return `<div class='mdc-card profile-update-init'>
  
  <div class='content-area'>
  <div id='primary-content'>
  
  ${content}
  </div>
  </div>
  ${action}
</div>`


}


function increaseStep(stepNumber) {

  const prevNumber = stepNumber - 1;
  if (prevNumber == 0) {
    document.getElementById(`step${stepNumber}`).classList.add('is-active');
    return;
  }
  document.getElementById(`step${prevNumber}`).classList.remove('is-active');
  document.getElementById(`step${prevNumber}`).classList.add('is-complete');
  document.getElementById(`step${stepNumber}`).classList.add('is-active');

}

function checkForPhoto() {
  const auth = firebase.auth().currentUser;
  if (auth.photoURL) {
    increaseStep(3)
    checkForEmail();
    return;
  }


  setHeader(`<span class="mdc-top-app-bar__title">Add Photo</span>`, '');

  logReportEvent("Profile Completion Photo")
  logFirebaseAnlyticsEvent("profile_completion_photo")

  increaseStep(2)
  const content = `

      <div class='photo-container'>
      <img src="./img/empty-user.jpg" id="image-update">
      <button class="mdc-fab mdc-theme--primary-bg" aria-label="Favorite">
        <span class="mdc-fab__icon material-icons mdc-theme--on-primary">camera</span>
        <input type='file' accept='image/jpeg;capture=camera' id='choose'>
      </button>
      </div>
  
      `
  document.getElementById('app-current-panel').innerHTML = miniProfileCard(content, ' <span class="mdc-top-app-bar__title">Add Your Profile Picture</span>', '')
  document.getElementById('choose').addEventListener('change', function (evt) {
    getImageBase64(evt).then(function (dataURL) {
      document.getElementById('image-update').src = dataURL;
      return requestCreator('backblaze', {
        'imageBase64': dataURL
      })
    }).then(function () {
      increaseStep(3)
      checkForEmail()
    }).catch(function (error) {
      increaseStep(3)
      checkForEmail()
      snacks(error.message)
    })
  })

}

function checkForEmail() {

  const auth = firebase.auth().currentUser;
  if (auth.email && auth.emailVerified) {
    openReportView();
    return
  }

  getRootRecord().then(function (record) {
    if (record.skipEmail) {
      openReportView();
      return
    }

    logReportEvent("Profile Completion Email")
    logFirebaseAnlyticsEvent("profile_completion_email")
    increaseStep(3)
    emailUpdation(true, function () {
      openReportView();
    });
  })

}


function checkEmptyIdProofs(record) {
  if (!record.idProof) return true;
  const keys = Object.keys(record.idProof);
  let isEmpty = false;
  keys.forEach(function (key) {
    if (!record.idProof[key].number || !record.idProof[key].front || !record.idProof[key].back) {
      isEmpty = true;
      return;
    }
  })
  return isEmpty;
}

function getProfileInformation() {
  return new Promise(function (resolve, reject) {
    let record;

    getRootRecord().then(function (record) {
      if (!record.aadhar || !record.pan || !record.linkedAccounts) {
        requestCreator('profile').then(function (response) {
          const dbName = firebase.auth().currentUser.uid;
          const rootTx = db.transaction('root', 'readwrite');
          const store = rootTx.objectStore('root');
          store.get(dbName).onsuccess = function (event) {
            record = event.target.result;
            delete record.idProof;
            record.linkedAccounts = response.linkSharedComponent;
            record.pan = response.pan;
            record.aadhar = response.aadhar;
            store.put(record);
          }
          rootTx.oncomplete = function () {
            return resolve(record)
          }
        }).catch(reject)
        return
      }
      return resolve(record)
    });
  })
}

// function checkForId() {
//   getProfileInformation().then(function(record){
//     if (record.skipIdproofs || !checkEmptyIdProofs(record)) {
//       increaseStep(5);
//       checkForBankAccount();
//     }
//     logReportEvent("Profile Completion Id")
//     logFirebaseAnlyticsEvent("profile_completion_id")
//     increaseStep(4);
//     idProofView(checkForBankAccount);

//   }).catch()

// }


// function checkForBankAccount() {

//   getRootRecord().then(function (record) {
//     if (record.skipBankAccountAdd || record.linkedAccounts.length) {
//       openReportView();
//       return;
//     }
//     logReportEvent("Profile Completion bank account")
//     logFirebaseAnlyticsEvent("profile_completion_bank_account")
//     increaseStep(5)
//     addNewBankAccount(function () {
//       loadingScreen();
//       openReportView()
//     });
//   })
// }


function resizeAndCompressImage(image, compressionFactor) {
  var canvas = document.createElement('canvas');
  const canvasDimension = new CanvasDimension(image.width, image.height);
  canvasDimension.setMaxHeight(screen.height)
  canvasDimension.setMaxWidth(screen.width);
  const newDimension = canvasDimension.getNewDimension()
  canvas.width = newDimension.width
  canvas.height = newDimension.height;
  var ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, newDimension.width, newDimension.height);
  const newDataUrl = canvas.toDataURL('image/jpeg', compressionFactor);
  return newDataUrl;

}

function CanvasDimension(width, height) {
  this.MAX_HEIGHT = ''
  this.MAX_WIDTH = ''
  this.width = width;
  this.height = height;
}
CanvasDimension.prototype.setMaxWidth = function (MAX_WIDTH) {
  this.MAX_WIDTH = MAX_WIDTH
}
CanvasDimension.prototype.setMaxHeight = function (MAX_HEIGHT) {
  this.MAX_HEIGHT = MAX_HEIGHT
}
CanvasDimension.prototype.getNewDimension = function () {
  if (this.width > this.height) {
    if (this.width > this.MAX_WIDTH) {
      this.height *= this.MAX_WIDTH / this.width;
      this.width = this.MAX_WIDTH;
    }
  } else {
    if (this.height > this.MAX_HEIGHT) {
      this.width *= this.MAX_HEIGHT / this.height;
      this.height = this.MAX_HEIGHT
    }
  }

  return {
    width: this.width,
    height: this.height
  }
}



function showReLoginDialog(heading, contentText) {
  const content = `<h3 class="mdc-typography--headline6 mdc-theme--primary">${contentText}</h3>`
  const dialog = new Dialog(heading, content).create();
  dialog.open();
  dialog.buttons_[1].textContent = 'RE-LOGIN';
  return dialog;


}

function getProfileCompletionTabs() {
  const dom = `<div class="step-container mdc-top-app-bar--fixed-adjust">
  <div class="progress">
    <div class="progress-track"></div>
    <div id="step1" class="progress-step">
      <i class='material-icons'>person</i>
    </div>
    <div id="step2" class="progress-step">
      <i class='material-icons'>camera</i>
    </div>
    <div id="step3" class="progress-step">
      <i class='material-icons'>email</i>
    </div>
    <div id="step4" class="progress-step">
      <i class='material-icons'>verified_user</i>
     </div>
    <div id="step5" class="progress-step">
      <i class='material-icons'>payment</i>
    </div>
  </div>

</div>`
  return dom
}

function profileCheck() {
  const auth = firebase.auth().currentUser;
  document.getElementById('step-ui').innerHTML = getProfileCompletionTabs();
  if (!auth.displayName) {
    logReportEvent("Profile Completion Name")
    logFirebaseAnlyticsEvent("profile_completion_name")
    document.getElementById("app-header").classList.remove('hidden');
    increaseStep(1)
    updateName(function () {
      checkForPhoto();
    });
    return
  };

  increaseStep(2)
  checkForPhoto();
}

function areObjectStoreValid(names) {
  const stores = ['map', 'children', 'calendar', 'root', 'subscriptions', 'list', 'users', 'activity', 'addendum', ]
  for (let index = 0; index < stores.length; index++) {
    const el = stores[index];
    if (!names.contains(el)) {
      return {
        'not-present': el,
        isValid: false
      };
    }
  }
  return {
    'not-present': '',
    isValid: true
  };
}

function getEmployeeDetails(range, indexName) {
  return new Promise(function (resolve, reject) {
    const tx = db.transaction(['children']);
    const store = tx.objectStore('children');
    const index = store.index(indexName)
    const getEmployee = index.getAll(range);

    getEmployee.onsuccess = function (event) {
      const result = event.target.result;

      console.log(result);

      return resolve(result)
    }
    getEmployee.onerror = function () {
      return reject({
        message: getEmployee.error,
        body: ''
      })
    }
  })
}

function createObjectStores(db, uid) {

  const activity = db.createObjectStore('activity', {
    keyPath: 'activityId'
  })

  activity.createIndex('timestamp', 'timestamp')
  activity.createIndex('office', 'office')
  activity.createIndex('hidden', 'hidden')
  activity.createIndex('template', 'template');
  activity.createIndex('status', 'status')

  const users = db.createObjectStore('users', {
    keyPath: 'mobile'
  })

  users.createIndex('displayName', 'displayName')
  users.createIndex('isUpdated', 'isUpdated')
  users.createIndex('count', 'count')
  users.createIndex('mobile', 'mobile')
  users.createIndex('timestamp', 'timestamp')
  users.createIndex('NAME_SEARCH', 'NAME_SEARCH')
  const addendum = db.createObjectStore('addendum', {
    autoIncrement: true
  })

  addendum.createIndex('activityId', 'activityId')
  addendum.createIndex('user', 'user');
  addendum.createIndex('key', 'key')
  addendum.createIndex('KeyTimestamp', ['timestamp', 'key'])


  createSubscriptionObjectStore(db)
  createCalendarObjectStore(db);
  createMapObjectStore(db)

  const children = db.createObjectStore('children', {
    keyPath: 'activityId'
  })

  children.createIndex('template', 'template');
  children.createIndex('office', 'office');
  children.createIndex('templateStatus', ['template', 'status']);
  children.createIndex('officeTemplate', ['office', 'template']);
  children.createIndex('employees', 'employee');
  children.createIndex('employeeOffice', ['employee', 'office'])
  children.createIndex('team', 'team')
  children.createIndex('teamOffice', ['team', 'office'])

  createReportObjectStores(db)
  createRootObjectStore(db, uid, 0)
}

function createCalendarObjectStore(db) {
  if (db.objectStoreNames.contains('calendar')) {
    db.deleteObjectStore('calendar')
  }
  const calendar = db.createObjectStore('calendar', {
    autoIncrement: true
  })

  calendar.createIndex('activityId', 'activityId')
  calendar.createIndex('timestamp', 'timestamp')
  calendar.createIndex('start', 'start')
  calendar.createIndex('end', 'end')
  calendar.createIndex('templateOffice', ['template', 'office']);

}

function createSubscriptionObjectStore(db) {
  if (db.objectStoreNames.contains('subscriptions')) {
    db.deleteObjectStore('subscriptions')
  }
  const subscriptions = db.createObjectStore('subscriptions', {
    keyPath: 'activityId'
  })
  subscriptions.createIndex('office', 'office')
  subscriptions.createIndex('template', 'template')
  subscriptions.createIndex('officeTemplate', ['office', 'template'])
  subscriptions.createIndex('validSubscription', ['office', 'template', 'status'])
  subscriptions.createIndex('templateStatus', ['template', 'status'])
  subscriptions.createIndex('status', 'status');
  subscriptions.createIndex('report', 'report');
}

function createMapObjectStore(db) {
  if (db.objectStoreNames.contains('map')) {
    db.deleteObjectStore('map')
  }
  const map = db.createObjectStore('map', {
    keyPath: 'activityId'
  })
  map.createIndex('location', 'location')
  map.createIndex('latitude', 'latitude')
  map.createIndex('longitude', 'longitude')
  map.createIndex('byOffice', ['office', 'location'])
  map.createIndex('bounds', ['latitude', 'longitude'])
  map.createIndex('office', 'office');
  map.createIndex('status', 'status');
}


function createReportObjectStores(db) {
  if (!db.objectStoreNames.contains('attendance')) {

    const attendance = db.createObjectStore('attendance', {
      keyPath: 'id',
    })
    attendance.createIndex('key', 'key')
    attendance.createIndex('date', 'date')
    attendance.createIndex('month', 'month')
    attendance.createIndex('office', 'office')
    attendance.createIndex('attendance', 'attendance');
  }
  if (!db.objectStoreNames.contains('payment')) {

    const payments = db.createObjectStore('payment', {
      keyPath: 'id'
    })

    payments.createIndex('key', 'key')
    payments.createIndex('date', 'date')
    payments.createIndex('month', 'month')
    payments.createIndex('year', 'year')
    payments.createIndex('status', 'status')
    payments.createIndex('office', 'office')
  }
  if (!db.objectStoreNames.contains('reimbursement')) {

    const reimbursements = db.createObjectStore('reimbursement', {
      keyPath: 'id'
    });
    reimbursements.createIndex('key', 'key')
    reimbursements.createIndex('date', 'date')
    reimbursements.createIndex('month', 'month')
    reimbursements.createIndex('year', 'year')
    reimbursements.createIndex('office', 'office')
  }

}


function createRootObjectStore(db, uid, fromTime) {
  const root = db.createObjectStore('root', {
    keyPath: 'uid'
  });
  root.put({
    uid: uid,
    fromTime: fromTime,
    location: ''
  })
}

function redirect() {
  firebase.auth().signOut().then(function () {
    window.location = 'https://www.growthfile.com';
  }).catch(function (error) {
    console.log(error)
    window.location = 'https://www.growthfile.com';
    handleError({
      message: `${error} from redirect`
    })
  });
}


function hasDataInDB() {
  return new Promise(function (resolve) {
    const tx = db.transaction(['activity', 'subscriptions'])
    const activityStoreCountReq = tx.objectStore('activity').count()
    const subscriptionStoreCountReq = tx.objectStore('subscriptions').count()
    let activityStoreSize;
    let subscriptionStoreSize;

    activityStoreCountReq.onsuccess = function () {
      activityStoreSize = activityStoreCountReq.result;
    }
    subscriptionStoreCountReq.onsuccess = function () {
      subscriptionStoreSize = subscriptionStoreCountReq.result;
    }
    tx.oncomplete = function () {
      if (!activityStoreSize && !subscriptionStoreSize) return resolve(false)
      return resolve(true)
    }
  })
}

function getCheckInSubs() {
  return new Promise(function (resolve) {
    const checkInSubs = {};
    const tx = db.transaction('subscriptions');
    tx.objectStore('subscriptions')
      .index('templateStatus')
      .openCursor(IDBKeyRange.bound(['check-in', 'CONFIRMED'], ['check-in', 'PENDING']))
      .onsuccess = function (event) {
        const cursor = event.target.result;
        if (!cursor) return;
        if (!cursor.value.attachment || !cursor.value.venue || !cursor.value.schedule) {
          cursor.continue();
          return;
        }
        if (checkInSubs[cursor.value.office]) {
          if (checkInSubs[cursor.value.office].timestamp <= cursor.value.timestamp) {
            checkInSubs[cursor.value.office] = cursor.value;
          }
        } else {
          checkInSubs[cursor.value.office] = cursor.value
        }
        cursor.continue();
      }
    tx.oncomplete = function () {
      return resolve(checkInSubs)
    }
  })
};

function openMap() {
  document.getElementById('app-header').classList.add("hidden")
  document.getElementById('step-ui').innerHTML = ''
  progressBar.open();
  const storeNames = ['activity', 'addendum', 'children', 'subscriptions', 'map', 'attendance', 'reimbursement', 'payment']
  Promise.all([appLocation(3), firebase.auth().currentUser.getIdTokenResult(), getCheckInSubs(), checkIDBCount(storeNames)]).then(function (result) {
    const geopoint = result[0];
    const tokenResult = result[1];
    const checkInSubs = result[2];
    const totalRecords = result[3];
    const auth = firebase.auth().currentUser;
    progressBar.close();

    if (Object.keys(checkInSubs).length) {
      if (isNewUser) {
        setFirebaseAnalyticsUserProperty("hasCheckin", "true");
      }
      handleLocationForMap(geopoint, checkInSubs);
      return;
    }

    if (isAdmin(tokenResult)) {
      handleLocationForMap(geopoint, checkInSubs)
      return
    }

    if (firebaseDeepLink) {
      const action = firebaseDeepLink.get('action')
      if (action && action === 'get-subscription') {

        sendSubscriptionData({
          "share": [{
            phoneNumber: auth.phoneNumber,
            displayName: auth.displayName,
            email: auth.email
          }],
          "template": "subscription",
          "office": firebaseDeepLink.get('office')
        }, geopoint)
      }
      return
    }

    if (totalRecords) {
      openReportView()
      return;
    }

    ApplicationState.location = geopoint;
    localStorage.setItem('ApplicationState', JSON.stringify(ApplicationState));
    if (potentialAlternatePhoneNumbers.length) {
      chooseAlternativePhoneNumber(potentialAlternatePhoneNumbers, geopoint);
      return
    };

  }).catch(function (error) {
    console.log(error)
    handleError({
      message: error.message,
      body: error
    })
  })
}

function checkIDBCount(storeNames) {
  return new Promise(function (resolve, reject) {
    let totalCount = 0;
    const tx = db.transaction(storeNames)
    storeNames.forEach(function (name) {
      if (!db.objectStoreNames.contains(name)) return;
      const store = tx.objectStore(name)
      const req = store.count();
      req.onsuccess = function () {
        totalCount += req.result
      }
    })
    tx.oncomplete = function () {
      return resolve(totalCount)
    }
    tx.onerror = function () {
      return reject({
        message: tx.error.message,
        body: tx.error
      })
    }
  })
}

function handleLocationForMap(geopoint, checkInSubs) {
  ApplicationState.officeWithCheckInSubs = checkInSubs;
  const oldState = localStorage.getItem('ApplicationState')
  if (!oldState) return mapView(geopoint);
  const oldApplicationState = JSON.parse(oldState);
  if (!oldApplicationState.lastCheckInCreated) return mapView(geopoint);
  const isOlder = isLastLocationOlderThanThreshold(oldApplicationState.lastCheckInCreated, 300)
  const hasChangedLocation = isLocationMoreThanThreshold(calculateDistanceBetweenTwoPoints(oldApplicationState.location, geopoint))
  if (isOlder || hasChangedLocation) return mapView(geopoint);
  ApplicationState = oldApplicationState;
  openReportView()
}


function openReportView() {
  logReportEvent('IN Reports')
  logReportEvent('IN ReportsView');
  logFirebaseAnlyticsEvent("report_view")
  history.pushState(['reportView'], null, null)
  reportView()
}

function fillVenueInSub(sub, venue) {
  const vd = sub.venue[0];
  sub.venue = [{
    geopoint: {
      latitude: venue.latitude || '',
      longitude: venue.longitude || ''
    },
    location: venue.location || '',
    address: venue.address || '',
    venueDescriptor: vd
  }];
  return sub;
}


function reloadPage() {
  window.location.reload(true);
}


function updateFromTime(fromTime) {
  return new Promise(function (resolve, reject) {
    const keyPath = firebase.auth().currentUser.uid;
    const tx = db.transaction('root', 'readwrite');
    const store = tx.objectStore('root');
    store.get(keyPath).onsuccess = function (e) {
      const record = e.target.result;
      record.fromTime = fromTime
      store.put(record);
    }
    tx.oncomplete = function () {
      resolve(true)
    }

  })
}