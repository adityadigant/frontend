
function profileView(pushState) {
  if (pushState) {
    history.pushState(['profileView'], null, null);
  }
  if (window.addEventListener) {
    window.removeEventListener('scroll', handleScroll, false)
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
          document.getElementById('close-profile--panel').addEventListener('click', function () {
            backNav();
          });
         
          if (native.getName() === 'Android') {
            document.getElementById('uploadProfileImage').addEventListener('click', function () {
              AndroidInterface.openImagePicker();
            })
          } else {
            inputFile('uploadProfileImage').addEventListener('change', function () {
              readUploadedFile()
            });
          }

          changeDisplayName(user);
          changeEmailAddress(user);
        })

      };
    };
  };
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
  modifyHeader({
    id: 'app-main-header',
    left: backSpan.outerHTML
  });
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
        uploadBtn.id = 'uploadProfileImage'
      }

      var label = document.createElement('label');
      label.setAttribute('for', 'uploadProfileImage');
      var btnText = document.createElement('span');
      btnText.className = 'mdc-fab__icon material-icons';
      btnText.textContent = 'add_a_photo';

      label.appendChild(btnText);
      uploadBtn.appendChild(label);
      let fileInput;
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

      const dataObject = document.createElement('object');
      dataObject.type = 'image/jpeg';
      dataObject.data = uri || './img/empty-user-big.jpg';
      dataObject.id = 'user-profile--image';

      var profileImg = document.createElement('img');
      profileImg.src = './img/empty-user-big.jpg';
      profileImg.className = 'empty-user-profile'
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
      toggleBtnName.textContent = 'check';

      if (firebase.auth().currentUser.displayName) {
        nameChangeCont.innerHTML = `<div class="mdc-text-field" id='name-change-field'>
        <input type="text" id="pre-filled" class="mdc-text-field__input" value="${firebase.auth().currentUser.displayName}">
        <label class="mdc-floating-label mdc-floating-label--float-above" for="pre-filled">
         Your Name
        </label>
        <div class="mdc-line-ripple"></div>
      </div>
      `
      } else {
        nameChangeCont.appendChild(createInputForProfile('displayName', 'Name'));
      }

      nameChangeCont.appendChild(toggleBtnName);

      var emailCont = document.createElement('div');
      emailCont.id = 'email--change-container';
      emailCont.className = 'profile-psuedo-card';

      var toggleBtnEmail = document.createElement('button');
      toggleBtnEmail.className = 'mdc-icon-button material-icons';
      toggleBtnEmail.id = 'edit--email';
      toggleBtnEmail.setAttribute('aria-hidden', 'true');
      toggleBtnEmail.setAttribute('aria-pressed', 'false');
      toggleBtnEmail.textContent = 'check';

      if(firebase.auth().currentUser.email) {
        emailCont.innerHTML = `<div class="mdc-text-field" id='email-change-field'>
        <input type="text" id="pre-filled" class="mdc-text-field__input" value="${firebase.auth().currentUser.email}">
        <label class="mdc-floating-label mdc-floating-label--float-above" for="pre-filled">
         Your Email
        </label>
        <div class="mdc-line-ripple"></div>
      </div>
      `
      }
      else {
        emailCont.appendChild(createInputForProfile('email', 'Email'));
      }
    
      emailCont.appendChild(toggleBtnEmail);

      
      profileView.appendChild(profileImgCont);
      profileView.appendChild(nameChangeCont);
      profileView.appendChild(emailCont);
  


      resolve(profileView)
    });
  })
}

function updateEmailDialog() {

  if (!document.getElementById('updateEmailDialog')) {
    var aside = document.createElement('aside');
    aside.className = 'mdc-dialog mdc-dialog--open';
    aside.id = 'updateEmailDialog';
    var surface = document.createElement('div');
    surface.className = 'mdc-dialog__surface';
    surface.style.width = '90%';
    surface.style.height = 'auto';
    var section = document.createElement('section');
    section.className = 'mdc-dialog__body';
    section.id = 'refresh-login'

    var footer = document.createElement('footer');
    footer.className = 'mdc-dialog__footer';

    var canel = document.createElement('button');
    canel.type = 'button';
    canel.className = 'mdc-button mdc-dialog__footer__button mdc-dialog__footer__button--cancel update-email-cancel';
    canel.textContent = 'Cancel';
    canel.style.backgroundColor = '#3498db';

    footer.appendChild(canel);

    surface.appendChild(section);
    surface.appendChild(footer)
    aside.appendChild(surface);
    document.body.appendChild(aside);

  }
}


function timeDiff(lastSignInTime) {
  var currentDate = moment().format('YYY-MM-DD HH:mm');
  var authSignInTime = moment(lastSignInTime).format('YYY-MM-DD HH:mm');

  return moment(currentDate).diff(moment(authSignInTime), 'minutes');
}

function newSignIn(value) {
  updateEmailDialog()
  const dialogSelector = document.querySelector('#updateEmailDialog')
  var emailDialog = new mdc.dialog.MDCDialog(dialogSelector);
  emailDialog.show();


  try {
    ui = new firebaseui.auth.AuthUI(firebase.auth());
    ui.start('#refresh-login', firebaseUiConfig(value));
    setTimeout(function () {

      document.querySelector('.firebaseui-id-phone-number').disabled = true;
      document.querySelector('.firebaseui-label').remove();
      document.querySelector('.firebaseui-title').textContent = 'Verify your phone Number to Update your Email address';

    }, 500)

    emailDialog.listen('MDCDialog:cancel', function () {
      ui.delete();
      const emailField = new mdc.textField.MDCTextField(document.getElementById('email'));
      emailField.value = firebase.auth().currentUser.email;
      dialogSelector.remove();
    });
  } catch (e) {
    handleError({
      message: `${e.message} from newSignIn function during email updation`
    });
    snacks('Please try again later');
  }
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
  const pre = 'data:image/jpeg;base64,';
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

function changeDisplayName() {
  const name = new mdc.textField.MDCTextField(document.getElementById('name-change-field'))
  const nameChangeButton = document.getElementById('edit--name')
  nameChangeButton.addEventListener('click',function(){
    nameChangeButton.color = '0399f4'
    firebase.auth().currentUser.updateProfile({
      displayName:name.value
    }).then(successDialog).catch(function(error){
      snacks('Please Try again later');
      handleError({message:`${error} at updateProfile in changeDisplayName`})
    })
  })
}

function changeEmailAddress() {
  const email = new mdc.textField.MDCTextField(document.getElementById('email-change-field'))
  const auth =firebase.auth().currentUser;
  const value = email.value;
  const editEmail = document.getElementById('edit--email');
  editEmail.addEventListener('click',function(){
    if (value === auth.email) {
      snacks('You have already set this as your email address');
      return;
    }
    if (timeDiff(auth.metadata.lastSignInTime) <= 5) {
      updateEmail(auth, value);
    } else {
      newSignIn(value);
    }
  })
}

function updateEmail(user, email) {

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

function createInputForProfile(key, type, classtype) {
  const mainTextField = document.createElement('div');
  mainTextField.className = `mdc-text-field mdc-text-field--dense ${classtype} attachment--text-field`

  mainTextField.dataset.key = key
  mainTextField.dataset.type = type
  mainTextField.id = key.replace(/\s/g, '')
  const mainInput = document.createElement('input')
  mainInput.className = 'mdc-text-field__input'

  if (type && key === 'displayName') {
    mainInput.placeholder = 'Your Name'
  }
  if (type && key === 'email') {
    mainInput.placeholder = 'Your Email'
  }

  const ripple = document.createElement('div')
  ripple.className = 'mdc-line-ripple'

  mainTextField.appendChild(mainInput)
  mainTextField.appendChild(ripple)
  return mainTextField
}