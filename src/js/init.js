firebase.initializeApp({
  apiKey: 'AIzaSyA4s7gp7SFid_by1vLVZDmcKbkEcsStBAo',
  authDomain: 'growthfile-207204.firebaseapp.com',
  databaseURL: 'https://growthfile-207204.firebaseio.com',
  projectId: 'growthfile-207204',
  storageBucket: 'growthfile-207204.appspot.com',
  messagingSenderId: '701025551237'
})

let native = function () {
  return {
    setName: function (device) {
      localStorage.setItem('deviceType', device);
    },
    getName: function () {
      return localStorage.getItem('deviceType');
    },
    setIosInfo: function (iosDeviceInfo) {
      const splitByName = iosDeviceInfo.split("&")
      const deviceInfo = {
        baseOs: splitByName[0],
        deviceBrand: splitByName[1],
        deviceModel: splitByName[2],
        appVersion: Number(splitByName[3]),
        osVersion: splitByName[4],
        id: splitByName[5],
        initConnection: splitByName[6]
      }

      localStorage.setItem('iosUUID', JSON.stringify(deviceInfo))
    },
    getIosInfo: function () {
      return localStorage.getItem('iosUUID');
    },
    getInfo: function () {
      if (!this.getName()) {
        return JSON.stringify({
          'id': '123',
          'appVersion': 4,
          'baseOs': 'macOs'
        })
      }
      if (this.getName() === 'Android') {
        try {
          return AndroidId.getDeviceId();
        }
        catch(e){
          requestCreator('instant',JSON.stringify({message:e.message}))
          return JSON.stringify({
            baseOs:this.getName(),
            deviceBrand: '',
            deviceModel: '',
            appVersion: 4,
            osVersion: '',
            id: '',
          })
        }
      }
      return this.getIosInfo();
    }
  }
}();


window.onerror = function (msg, url, lineNo, columnNo, error) {
  const errorJS = {
    message: {
      msg: error.message,
      url: url,
      lineNo: lineNo,
      columnNo: columnNo,
      stack:error.stack,
      name:error.name,
      device:native.getInfo(),
      state:history.state[0]
    }
  }
  requestCreator('instant', JSON.stringify(errorJS))
}  

// initialize smooth scrolling
window.scrollBy({
  top: 100,
  left: 0,
  behavior: 'smooth'
})



window.addEventListener('load', function () {
  if (!window.Worker && !window.indexedDB) {
    const title = 'Device Incompatibility'
    const message = 'Your Device is Incompatible with Growthfile. Please Upgrade your Android Version'
    const messageData = {
      title: title,
      message: message,
      cancelable: false,
      button: {
        text: '',
        show: false,
        clickAction: {
          redirection: {
            value: false,
            text: ''
          }
        }
      }
    }
    Android.notification(JSON.stringify(messageData))
    return
  }

  moment.updateLocale('en', {
    calendar: {
      lastDay: '[yesterday]',
      sameDay: 'LT',
      nextDay: '[Tomorrow at] LT',
      lastWeek: 'dddd',
      nextWeek: 'dddd [at] LT',
      sameElse: 'L'
    },

    months: [
      'January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December'
    ]

  })

  layoutGrid()

  startApp()

})

window.onpopstate = function (event) {

  if (!event.state) return;
  if (event.state[0] === 'listView') {
    window[event.state[0]]()
    return;
  }
  window[event.state[0]](event.state[1], false)
}

function backNav() {
  history.back();
}

function firebaseUiConfig(value) {

  return  {
    callbacks: {
      signInSuccessWithAuthResult: function(authResult) {
      
        if(value) {
          updateEmail(authResult.user,value);
        }
        else {
          init(authResult.user);
        }
        return false;
      },
      uiShown: function() {
      
      }
    },
    // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
    signInFlow: 'popup',
    signInOptions: [
      // Leave the lines as is for the providers you want to offer your users.
     {
      provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
      recaptchaParameters: {
        type: 'image', // 'audio'
        size: 'normal', // 'invisible' or 'compact'
        badge: 'bottomleft' //' bottomright' or 'inline' applies to invisible.
      },
      defaultCountry: 'IN',
     }
    ]
  
  };
}

function userSignedOut() {
  const login = document.createElement('div')
  login.id = 'login-container'
  document.body.appendChild(login)

  const ui = new firebaseui.auth.AuthUI(firebase.auth() || '')
  ui.start('#login-container', firebaseUiConfig());

}

function layoutGrid() {
  const layout = document.createElement('div')
  layout.classList.add('mdc-layout-grid', 'mdc-typography', 'app')
  layout.id = "main-layout-app"
  const layoutInner = document.createElement('div')
  layoutInner.className = 'mdc-layout-grid__inner cell-space'

  const headerDiv = document.createElement('div')
  headerDiv.id = 'header'
  const currentPanel = document.createElement('div')
  currentPanel.id = 'app-current-panel'
  currentPanel.className = 'mdc-layout-grid__cell--span-12'

  const snackbar = document.createElement('div')
  snackbar.id = 'snackbar-container'

  headerDiv.appendChild(createHeader('app-main-header'))
  layoutInner.appendChild(headerDiv)
  layoutInner.appendChild(currentPanel)
  layoutInner.appendChild(snackbar)
  layout.appendChild(layoutInner)
  document.body.innerHTML = layout.outerHTML
  imageViewDialog();
}


function createHeader(id) {

  const header = document.createElement('header')
  header.className = 'mdc-top-app-bar mdc-top-app-bar--fixed mdc-elevation--z1'
  header.id = id
  
  const row = document.createElement('div')
  row.className = 'mdc-top-app-bar__row'

  const sectionStart = document.createElement('section')
  sectionStart.className = 'mdc-top-app-bar__section mdc-top-app-bar__section--align-start'

  const leftUI = document.createElement('div')
  leftUI.id = id+'view-type'
  leftUI.className = 'view-type'
  sectionStart.appendChild(leftUI)

  const sectionEnd = document.createElement('div')
  sectionEnd.className = 'mdc-top-app-bar__section mdc-top-app-bar__section--align-end'

  const rightUI = document.createElement('div')
  rightUI.id = id+'action-data'
  
  rightUI.className = 'action-data'
  
  sectionEnd.appendChild(rightUI)
  row.appendChild(sectionStart)
  row.appendChild(sectionEnd)
  header.appendChild(row)
  return header
}


function drawerDom() {
  const div = document.createElement('div')
  div.id = 'drawer-parent';
 
  const aside = document.createElement('aside')
  aside.className = 'mdc-drawer mdc-drawer--temporary mdc-typography'

  const nav = document.createElement('nav')
  nav.className = 'mdc-drawer__drawer'

  const header = document.createElement('header')
  header.className = 'mdc-drawer__header drawer--header'

  const headerContent = document.createElement('div')
  headerContent.className = 'mdc-drawer__header-content'

  const ImageDiv = document.createElement('div')
  ImageDiv.className = 'drawer--header-div'
  ImageDiv.onclick = function () {
    profileView(true)

  }
  const headerIcon = document.createElement('img')
  headerIcon.className = 'drawer-header-icon'

  headerIcon.src = firebase.auth().currentUser.photoURL || './img/empty-user.jpg'

  const headerDetails = document.createElement('div')
  headerDetails.className = 'header--details'

  const name = document.createElement('div')
  name.className = 'mdc-typography--subtitle'
  name.textContent = firebase.auth().currentUser.displayName || firebase.auth().currentUser.phoneNumber

  headerDetails.appendChild(name)

  ImageDiv.appendChild(headerIcon)
  headerContent.appendChild(ImageDiv)
  headerContent.appendChild(headerDetails)
  header.appendChild(headerContent)

  const navContent = document.createElement('nav')

  navContent.className = 'mdc-drawer__content mdc-list filter-sort--list'

  nav.appendChild(header)
  nav.appendChild(navContent)
  aside.appendChild(nav)
  div.appendChild(aside)
  document.body.appendChild(div);
}






function imageViewDialog() {

  const aside = document.createElement('aside')

  aside.id = 'viewImage--dialog-component'
  aside.className = 'mdc-dialog'
  aside.role = 'alertdialog'

  const dialogSurface = document.createElement('div')
  dialogSurface.className = 'mdc-dialog__surface'

  const section = document.createElement('section')
  section.className = 'mdc-dialog__content'

  const image = document.createElement("img")
  image.src = ''
  image.style.width = '100%'
  section.appendChild(image)

  dialogSurface.appendChild(section)

  aside.appendChild(dialogSurface)
  const backdrop = document.createElement('div')
  backdrop.className = 'mdc-dialog__backdrop'
  aside.appendChild(backdrop)

  document.body.appendChild(aside)
}



function startApp() {
  firebase.auth().onAuthStateChanged(function (auth) {

    if (!auth) {
      document.getElementById("main-layout-app").style.display = 'none'
      userSignedOut()
      return
    }
    if(localStorage.getItem('dbexist')) {
      init(auth)
    }
  })
}
// new day suggest
// if location changes
let app = function () {
  return {
    today: function () {
      return moment().format("DD/MM/YYYY");
    },
    tomorrow: function () {
      return moment(this.today()).add(1, 'day');
    },
    getLastLocationTime: function () {
      return new Promise(function (resolve, reject) {
        getRootRecord().then(function (rootRecord) {
          resolve(rootRecord.location.lastLocationTime);
        }).catch(function (error) {
          reject(error)
        })
      })
    },
    isNewDay: function () {
      return new Promise(function (resolve, reject) {
        app.getLastLocationTime().then(function (time) {
          if (moment(time).isSame(moment(), 'day')) {
            resolve(false);
          } else {
            resolve(true);
          }
        }).catch(function (error) {
          reject(error)
        })
      })
    }
  }
}();


function idbVersionLessThan2(auth) {
  return new Promise(function (resolve, reject) {
    let value = false;
    const req = indexedDB.open(auth.uid, 2);
    let db;
    req.onupgradeneeded = function (evt) {
      if (evt.oldVersion === 1) {
        value = true
      } else {
        value = false;
      }
    }
    req.onsuccess = function () {
      db = req.result;
      db.close();
      resolve(value)
    }
    req.onerror = function () {
      reject({error:req.error,device:native.getInfo()})
    }
  })
}

function removeIDBInstance(auth) {

  return new Promise(function (resolve, reject) {
    const failure = {
      message: 'Please Restart The App',
      error: '',
      device:native.getInfo()
    };

    const req = indexedDB.deleteDatabase(auth.uid)
    req.onsuccess = function () {
      resolve(true)
    }
    req.onblocked = function () {
      failure.error = 'Couldnt delete DB because it is busy.App was openend when new code transition took place';
      reject(failure)
    }
    req.onerror = function () {
      failure.error = req.error
      reject(failure)
    }
  })
}

function init(auth) {
  
  drawerDom();
  document.getElementById("main-layout-app").style.display = 'block'
  
  idbVersionLessThan2(auth).then(function (lessThanTwo) {

    if (localStorage.getItem('dbexist')) {
      from = 1;
      if (lessThanTwo) {
        resetApp(auth, from);
      } else {
        startInitializatioOfList(auth);
      }
      return;
    }

    resetApp(auth, 0)
  }).catch(function(error){
    requestCreator('instant',JSON.stringify({message:error}));
  });
}

function resetApp(auth, from) {
  removeIDBInstance(auth).then(function () {
    localStorage.removeItem('dbexist');
    history.pushState(null,null,null);
    document.getElementById('growthfile').appendChild(loader('init-loader'))
    
    setTimeout(function(){
      snacks('Growthfile is Loading. Please Wait');
    },1000)

    requestCreator('now', {
      device: native.getInfo(),
      from: from
    });

  }).catch(function (error) {
    snacks(error.message);
    requestCreator('instant',JSON.stringify({message:error}));
  })
}

function startInitializatioOfList(auth) {
  localStorage.removeItem('clickedActivity');
  app.isNewDay(auth).then(function (isNew) {
    setInterval(function () {
      manageLocation();
    }, 5000);
    
  
    requestCreator('now', {
      device: native.getInfo(),
      from: ''
    });
  
    suggestCheckIn(isNew).then(function () {
      listView({urgent:isNew,nearby:isNew});
    }).catch(function(error){
        requestCreator('instant',JSON.stringify({message:error}))
    })
  }).catch(function(error){
    requestCreator('instant',JSON.stringify({message:error}))
  })
}