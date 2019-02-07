var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
  return typeof obj === "undefined" ? "undefined" : _typeof2(obj);
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
};

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });
  } else {
    obj[key] = value;
  }return obj;
}

function profileView(pushState) {
  if (pushState) {
    history.pushState(['profileView'], null, null);
  }
  if (window.addEventListener) {
    window.removeEventListener('scroll', handleScroll, false);
  }

  document.body.style.backgroundColor = '#eeeeee';
  var user = firebase.auth().currentUser;
  var dbName = user.uid;
  var req = indexedDB.open(dbName);
  req.onsuccess = function () {
    var db = req.result;
    var rootTx = db.transaction(['root'], 'readwrite');
    var rootObjectStore = rootTx.objectStore('root');
    rootObjectStore.get(dbName).onsuccess = function (event) {
      var record = event.target.result;
      record.view = 'profile';
      rootObjectStore.put(record);
      rootTx.oncomplete = function () {
        createProfileHeader();
        createProfilePanel(db).then(function (view) {
          if (!document.getElementById('app-current-panel')) return;

          document.getElementById('app-current-panel').innerHTML = view.outerHTML;
          disableInputs();
          document.getElementById('close-profile--panel').addEventListener('click', function () {
            backNav();
          });

          if (native.getName() === 'Android') {
            document.getElementById('uploadProfileImage').addEventListener('click', function () {
              AndroidInterface.openImagePicker();
            });
          } else {
            inputFile('uploadProfileImage').addEventListener('change', function () {
              readUploadedFile();
            });
          }

          changeDisplayName(user);
          changeEmailAddress(user);
        });
      };
    };
  };
  sendCurrentViewNameToAndroid('profile');
}

function inputFile(selector) {
  return document.getElementById(selector);
}

function createProfileHeader() {

  var backSpan = document.createElement('span');
  backSpan.id = 'close-profile--panel';
  var backIcon = document.createElement('i');
  backIcon.className = 'material-icons';

  backIcon.textContent = 'arrow_back';
  backSpan.appendChild(backIcon);
  modifyHeader({ id: 'app-main-header', left: backSpan.outerHTML });
}

function createProfilePanel(db) {
  return new Promise(function (resolve) {
    getImageFromNumber(db, firebase.auth().currentUser.phoneNumber).then(function (uri) {

      var profileView = document.createElement('div');
      profileView.id = 'profile-view--container';
      profileView.className = 'mdc-top-app-bar--fixed-adjust mdc-theme--background';

      var uploadBtn = document.createElement('button');
      uploadBtn.className = 'mdc-fab';
      if (native.getName() === 'Android') {
        uploadBtn.id = 'uploadProfileImage';
      }

      var label = document.createElement('label');
      label.setAttribute('for', 'uploadProfileImage');
      var btnText = document.createElement('span');
      btnText.className = 'mdc-fab__icon material-icons';
      btnText.textContent = 'add_a_photo';

      label.appendChild(btnText);
      uploadBtn.appendChild(label);
      var fileInput = void 0;
      if (native.getName() !== 'Android') {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.style.display = 'none';
        fileInput.id = 'uploadProfileImage';
        fileInput.accept = 'image/jpeg;';
      }

      var profileImgCont = document.createElement('div');
      profileImgCont.id = 'profile--image-container';
      profileImgCont.className = 'profile-container--main';

      var dataObject = document.createElement('object');
      dataObject.type = 'image/jpeg';
      dataObject.data = uri || './img/empty-user-big.jpg';
      dataObject.id = 'user-profile--image';

      var profileImg = document.createElement('img');
      profileImg.src = './img/empty-user-big.jpg';
      profileImg.className = 'empty-user-profile';
      dataObject.appendChild(profileImg);

      var overlay = document.createElement('div');
      overlay.className = 'insert-overlay';

      profileImgCont.appendChild(dataObject);
      profileImgCont.appendChild(overlay);
      profileImgCont.appendChild(uploadBtn);
      if (native.getName() !== 'Android') {
        label.appendChild(fileInput);
      }

      var nameChangeCont = document.createElement('div');
      nameChangeCont.id = 'name--change-container';
      nameChangeCont.className = 'profile-psuedo-card';

      var toggleBtnName = document.createElement('button');
      toggleBtnName.className = 'mdc-icon-button material-icons';
      toggleBtnName.id = 'edit--name';

      toggleBtnName.setAttribute('aria-hidden', 'true');
      toggleBtnName.setAttribute('aria-pressed', 'false');
      toggleBtnName.setAttribute('data-toggle-on-content', 'check');
      toggleBtnName.setAttribute('data-toggle-on-label', 'check');
      toggleBtnName.setAttribute('data-toggle-off-content', 'edit');
      toggleBtnName.setAttribute('data-toggle-off-label', 'displayName');

      toggleBtnName.textContent = 'edit';

      nameChangeCont.appendChild(createInputForProfile('displayName', 'Name'));
      nameChangeCont.appendChild(toggleBtnName);

      var emailCont = document.createElement('div');
      emailCont.id = 'email--change-container';
      emailCont.className = 'profile-psuedo-card';

      var toggleBtnEmail = document.createElement('button');
      toggleBtnEmail.className = 'mdc-icon-button material-icons';
      toggleBtnEmail.id = 'edit--email';
      toggleBtnEmail.setAttribute('aria-hidden', 'true');
      toggleBtnEmail.setAttribute('aria-pressed', 'false');
      toggleBtnEmail.setAttribute('data-toggle-on-content', 'check');
      toggleBtnEmail.setAttribute('data-toggle-on-label', 'check');
      toggleBtnEmail.setAttribute('data-toggle-off-content', 'edit');
      toggleBtnEmail.setAttribute('data-toggle-off-label', 'updateEmail');

      toggleBtnEmail.textContent = 'email';

      emailCont.appendChild(createInputForProfile('email', 'Email'));
      emailCont.appendChild(toggleBtnEmail);

      var refreshAuth = document.createElement('div');
      refreshAuth.id = 'ui-auth';
      refreshAuth.className = '';

      var changeNumCont = document.createElement('div');
      changeNumCont.id = 'change--number-container';

      var mainChange = document.createElement('div');
      mainChange.id = 'phone-number--change-container';
      mainChange.className = 'mdc-layout-grid__inner';

      changeNumCont.appendChild(mainChange);
      // changeNumCont.appendChild(submitCont)

      profileView.appendChild(profileImgCont);
      profileView.appendChild(nameChangeCont);
      profileView.appendChild(emailCont);
      profileView.appendChild(refreshAuth);
      profileView.appendChild(changeNumCont);

      resolve(profileView);
    });
  });
}

function toggleIconData(icon, inputField) {
  var iconEl = document.getElementById(icon);

  var toggleButton = new mdc.iconButton.MDCIconButtonToggle(iconEl);
  toggleButton['root_'].addEventListener('MDCIconButtonToggle:change', function (_ref) {
    var detail = _ref.detail;

    if (!detail.isOn) {
      inputField['input_'].disabled = true;
      inputField['input_'].style.borderBottom = 'none';
      var key = this.dataset.toggleOffLabel;
      var text = inputField.value;
      handleFieldInput(key, text);
      inputField['lineRipple_'].deactivate();
    } else {
      console.log(inputField);
      inputField['input_'].style.borderBottom = '1px solid rgba(0,0,0,.42)';
      inputField['input_'].disabled = false;
      inputField['lineRipple_'].activate();

      localStorage.getItem('deviceType') === 'Android' ? AndroidInterface.startKeyboard() : '';
      inputField['input_'].focus();
    }
  });
}

function handleFieldInput(key, value) {
  var user = firebase.auth().currentUser;
  console.log(typeof value === 'undefined' ? 'undefined' : _typeof(value));
  if (key === 'displayName') {
    user.updateProfile(_defineProperty({}, key, value)).then(function () {
      successDialog();
    }).catch(authUpdatedError);
  }

  if (key === 'updateEmail') {
    if (value === firebase.auth().currentUser.email) {
      snacks('This email address already exists');
      return;
    }
    if (timeDiff(firebase.auth().currentUser.metadata.lastSignInTime) <= 5) {
      console.log('less than 5');
      updateEmail(firebase.auth().currentUser, value);
    } else {
      newSignIn(value);
    }
  }
}

function timeDiff(lastSignInTime) {
  var currentDate = moment().format('YYY-MM-DD HH:mm');
  var authSignInTime = moment(lastSignInTime).format('YYY-MM-DD HH:mm');

  return moment(currentDate).diff(moment(authSignInTime), 'minutes');
}

function newSignIn(value) {
  var login = document.createElement('div');
  login.id = 'refresh-login';
  login.className = 'mdc-elevation--z3';

  document.getElementById('ui-auth').innerHTML = login.outerHTML;

  // document.querySelector('.app').style.display = 'none'

  var ui = new firebaseui.auth.AuthUI(firebase.auth());

  // DOM element to insert firebaseui login UI
  ui.start('#refresh-login', firebaseUiConfig(value));

  setTimeout(function () {
    document.querySelector('.firebaseui-id-phone-number').value = firebase.auth().currentUser.phoneNumber;
    document.querySelector('.firebaseui-id-phone-number').disabled = true;
    document.querySelector('.firebaseui-label').remove();
  }, 300);
}

function readUploadedFile(image) {
  if (native.getName() === 'Android') {
    sendBase64ImageToBackblaze(image);
    return;
  }

  var file = inputFile('uploadProfileImage').files[0];
  var reader = new FileReader();

  reader.addEventListener("load", function () {
    sendBase64ImageToBackblaze(reader.result);
    return;
  }, false);

  if (file) {
    reader.readAsDataURL(file);
  }
}
function sendBase64ImageToBackblaze(base64) {
  var selector = document.getElementById('user-profile--image');
  var container = document.getElementById('profile--image-container');
  var pre = 'data:image/jpeg;base64,';
  if (selector) {
    selector.data = pre + base64;
  }
  if (container) {
    document.getElementById('profile--image-container').appendChild(loader('profile--loader'));
  }
  var body = {
    'imageBase64': pre + base64
  };
  requestCreator('backblaze', body);
}

function authUpdatedError(error) {
  snacks(error.message);
}

function changeDisplayName(user) {
  var displayNameField = getInputText('#displayName');

  if (user.displayName) {
    displayNameField.value = user.displayName;
  }

  toggleIconData('edit--name', displayNameField);
}

function changeEmailAddress(user) {
  var emailField = getInputText('#email');
  if (user.email) {
    emailField.value = user.email;
  }

  toggleIconData('edit--email', emailField);
}

function updateEmail(user, email) {
  console.log(email);
  user.updateEmail(email).then(emailUpdateSuccess).catch(authUpdatedError);
}

function emailUpdateSuccess() {
  var user = firebase.auth().currentUser;
  console.log(user);
  user.sendEmailVerification().then(emailVerificationSuccess).catch(emailVerificationError);
}

function emailVerificationSuccess() {
  successDialog();
  snacks('Verification link has been send to your email address');
}

function emailVerificationError(error) {
  snacks(error.message);
}

function handleReauthError(error) {
  console.log(error);
}

function disableInputs() {
  getInputText('#displayName')['input_'].disabled = true;
  getInputText('#email')['input_'].disabled = true;
}