var deviceInfo=void 0,currentDevice=void 0,meta=void 0;function getTime(){return Date.now()}function getWebWorkerVersion(){var e=new URLSearchParams(self.location.search);return Number(e.get("version"))}var requestFunctionCaller={dm:dm,statusChange:statusChange,share:share,update:update,create:create,backblaze:backblaze,updateAuth:updateAuth,comment:comment,changePhoneNumber:changePhoneNumber,newBankAccount:newBankAccount,removeBankAccount:removeBankAccount,subscription:createSubscription,searchOffice:searchOffice,checkIns:checkIns,idProof:idProof,device:device,acquisition:acquisition,fcmToken:fcmToken,pan:pan,aadhar:aadhar,profile:profile};function sendSuccessRequestToMainThread(e,t){self.postMessage({response:e,success:!0,id:t})}function sendErrorRequestToMainThread(e){var t={message:e.message,body:e,apiRejection:!1,success:!1,id:e.id,requestType:e.requestType};e.stack&&(t.stack=e.stack),e.code?t.apiRejection=!0:instant(JSON.stringify(t),meta),self.postMessage(t)}function handleNow(n,r){fetchServerTime(n.meta,r).then(function(t){var e=r.transaction(["root"],"readwrite"),o=e.objectStore("root");o.get(n.meta.user.uid).onsuccess=function(e){rootRecord=e.target.result,rootRecord.serverTime=t.timestamp-Date.now(),o.put(rootRecord)},e.oncomplete=function(){if(!t.removeFromOffice)return self.postMessage({response:t,success:!0,id:n.id});Array.isArray(t.removeFromOffice)&&t.removeFromOffice.length&&removeFromOffice(t.removeFromOffice,n.meta,r).then(function(e){sendSuccessRequestToMainThread(e,workerId)}).catch(function(e){e.id=n.id,e.requestType=n.type,sendErrorRequestToMainThread(e)})}}).catch(function(e){e.id=n.id,e.requestType=n.type,sendErrorRequestToMainThread(e)})}function http(e){var t=!(1<arguments.length&&void 0!==arguments[1])||arguments[1];return new Promise(function(o,n){var r=new XMLHttpRequest;r.open(e.method,e.url,!0),t&&(r.setRequestHeader("Content-Type","application/json"),r.setRequestHeader("X-Requested-With","XMLHttpRequest"),r.setRequestHeader("Authorization","Bearer "+e.token)),r.timeout=3e4,r.ontimeout=function(){return n({code:"request-timed-out",message:"Request time out. Try again later"})},r.onreadystatechange=function(){if(4===r.readyState){if(!r.status||226<r.status){if(!r.response)return;var e=JSON.parse(r.response),t={message:e.message,code:e.code};return n(t)}r.responseText?o(JSON.parse(r.responseText)):o("success")}},r.send(e.body||null)})}function fetchServerTime(i,a){return new Promise(function(e,t){var o=i.apiUrl+"now",n=a.transaction(["root"],"readwrite"),r=n.objectStore("root");r.get(i.user.uid).onsuccess=function(e){var t=e.target.result;t&&(t.officesRemoved&&(t.officesRemoved.forEach(function(e){o=o+"&removeFromOffice="+e.replace(" ","%20")}),delete t.officesRemoved),r.put(t))},n.oncomplete=function(){http({method:"GET",url:o,body:null,token:i.user.token}).then(e).catch(t)}})}function instant(e,t){http({method:"POST",url:t.apiUrl+"services/logs",body:e,token:t.user.token}).then(console.log).catch(console.log)}function comment(e,t){return http({method:"POST",url:t.apiUrl+"activities/comment",body:JSON.stringify(e),token:t.user.token,timeout:15e3})}function changePhoneNumber(e,t){return console.log("change number"),http({method:"POST",url:t.apiUrl+"changePhoneNumber",body:JSON.stringify(e),token:t.user.token,timeout:null})}function removeBankAccount(e,t){return http({method:"DELETE",url:t.apiUrl+"services/accounts",body:JSON.stringify(e),token:t.user.token,timeout:null})}function newBankAccount(e,t){return http({method:"PUT",url:t.apiUrl+"profile/linkedAccount",body:JSON.stringify(e),token:t.user.token,timeout:null})}function searchOffice(e,t){return http({method:"GET",url:t.apiUrl+"services/search?q="+e.query,body:JSON.stringify(e),token:t.user.token,timeout:null})}function checkIns(e,t){return http({method:"POST",url:t.apiUrl+"services/checkIns",body:JSON.stringify(e),token:t.user.token,timeout:null})}function idProof(e,t){return http({method:"POST",url:t.apiUrl+"services/idProof",body:JSON.stringify(e),token:t.user.token,timeout:null})}function device(e,t){return http({method:"PUT",url:t.apiUrl+"profile/device",body:JSON.stringify(e),token:t.user.token,timeout:null})}function acquisition(e,t){return http({method:"PUT",url:t.apiUrl+"profile/acquisition",body:JSON.stringify(e),token:t.user.token,timeout:null})}function fcmToken(e,t){return http({method:"PUT",url:t.apiUrl+"profile/fcmToken",body:JSON.stringify(e),token:t.user.token,timeout:null})}function pan(e,t){return http({method:"PUT",url:t.apiUrl+"profile/pan",body:JSON.stringify(e),token:t.user.token,timeout:null})}function aadhar(e,t){return http({method:"PUT",url:t.apiUrl+"profile/aadhar",body:JSON.stringify(e),token:t.user.token,timeout:null})}function profile(e,t){return http({method:"GET",url:t.apiUrl+"profile/",body:null,token:t.user.token,timeout:null})}function createSubscription(e,t){return http({method:"POST",url:t.apiUrl+"services/subscription",body:JSON.stringify(e),token:t.user.token,timeout:null})}function dm(e,t){return console.log(e),http({method:"POST",url:t.apiUrl+"dm",body:JSON.stringify(e),token:t.user.token,timeout:15e3})}function statusChange(e,t){return http({method:"PATCH",url:t.apiUrl+"activities/change-status",body:JSON.stringify(e),token:t.user.token,timeout:15e3})}function share(e,t){return http({method:"PATCH",url:t.apiUrl+"activities/share",body:JSON.stringify(e),token:t.user.token,timeout:15e3})}function update(e,t){return http({method:"PATCH",url:t.apiUrl+"activities/update",body:JSON.stringify(e),token:t.user.token,timeout:15e3})}function create(e,t){return http({method:"POST",url:t.apiUrl+"activities/create",body:JSON.stringify(e),token:t.user.token,timeout:null})}function acquisition(e,t){return http({method:"PUT",url:t.apiUrl+"profile/acquisition",body:JSON.stringify(e),token:t.user.token,timeout:null})}function geolocationApi(r,i,a){return new Promise(function(t,o){var n=new XMLHttpRequest;n.open("POST","https://www.googleapis.com/geolocation/v1/geolocate?key="+i.mapKey,!0),n.setRequestHeader("Content-Type","application/json"),n.onreadystatechange=function(){if(4===n.readyState){if(400<=n.status)return 0<a?void setTimeout(function(){geolocationApi(r,i,a-=1).then(t).catch(o)},1e3):o({message:JSON.parse(n.response).error.message,body:{geolocationResponse:JSON.parse(n.response),geolocationBody:r}});var e=JSON.parse(n.response);return e?t({latitude:e.location.lat,longitude:e.location.lng,accuracy:e.accuracy,provider:r,lastLocationTime:Date.now()}):0<a?void setTimeout(function(){geolocationApi(r,i,a-=1).then(t).catch(o)},1e3):o({message:"Response From geolocation Api "+e,body:r})}},n.onerror=function(){if(!(0<a))return o({message:n});setTimeout(function(){geolocationApi(r,i,a-=1).then(t).catch(o)},1e3)},n.send(JSON.stringify(r))})}function removeFromOffice(r,i,a){return new Promise(function(t,n){var e=a.transaction(["map","calendar","children","subscriptions","activity"],"readwrite");e.oncomplete=function(){var e=a.transaction(["root"],"readwrite"),o=e.objectStore("root");o.get(i.user.uid).onsuccess=function(e){var t=e.target.result;t&&(t.officesRemoved=r,o.put(t))},e.oncomplete=function(){console.log("run read after removal"),t({response:"Office Removed",success:!0})},e.onerror=function(e){n({response:e,success:!1})}},e.onerror=function(){console.log(tx.error)},removeActivity(r,e)})}function removeActivity(o,n){["activity","children","map","calendar","subscriptions"].forEach(function(e){var t=n.objectStore(e).index("office");o.forEach(function(e){removeByIndex(t,e)})})}function removeByIndex(e,t){e.openCursor(t).onsuccess=function(e){var t=e.target.result;t&&(t.delete(),t.continue())}}function updateAuth(e,t){return http({method:"POST",url:"https://growthfile.com/json?action=update-auth",body:JSON.stringify(e),token:t.user.token,timeout:15e3})}function backblaze(e,t){return http({method:"POST",url:t.apiUrl+"services/images",body:JSON.stringify(e),token:t.user.token,timeout:3e4})}function updateAttendance(){var e=0<arguments.length&&void 0!==arguments[0]?arguments[0]:[],t=arguments[1];e.forEach(function(e){e.id&&(e.editable=1,t.put(e))})}function updateReimbursements(){var e=0<arguments.length&&void 0!==arguments[0]?arguments[0]:[],t=arguments[1];e.forEach(function(e){e.id&&t.put(e)})}function updatePayments(){var e=0<arguments.length&&void 0!==arguments[0]?arguments[0]:[],t=arguments[1];e.forEach(function(e){e.id&&t.put(e)})}function updateCalendar(n,e){var r=e.objectStore("calendar");r.index("activityId").openCursor(n.activityId).onsuccess=function(e){var t=e.target.result;if(t){var o=t.delete();t.continue(),o.onsuccess=function(){console.log("remove calendar")},o.onerror=function(){instant(JSON.stringify({message:o.error.message}),meta)}}else n.schedule.forEach(function(e){var t={activityId:n.activityId,scheduleName:e.name,timestamp:n.timestamp,template:n.template,hidden:n.hidden,start:e.startTime,end:e.endTime,status:n.status,office:n.office};r.add(t)})}}function putMap(e,t){e.activityId&&t.objectStore("map").put(e)}function putAttachment(e,t,o){if(e.activityId){var n=t.objectStore("children"),r={activityId:e.activityId,status:e.status,template:e.template,office:e.office,attachment:e.attachment},i=o.user.phoneNumber;"employee"===e.template&&(e.attachment.hasOwnProperty("Employee Contact")&&(r.employee=e.attachment["Employee Contact"].value),e.attachment.hasOwnProperty("Phone Number")&&(r.employee=e.attachment["Phone Number"].value),e.attachment.hasOwnProperty("First Supervisor")&&e.attachment["First Supervisor"].value===i&&(r.team=1)),n.put(r)}}function removeUserFromAssigneeInActivity(n,e){removeByIndex(e.objectStore("addendum").index("user"),n.user);var r=e.objectStore("activity");r.get(n.activityId).onsuccess=function(e){var t=e.target.result;if(t){var o=t.assignees.findIndex(function(e){return e.phoneNumber===n.user});-1<o&&(t.assignees.splice(o,1),r.put(t))}}}function removeActivityFromDB(t,o){if(t){var e=o.objectStore("activity"),n=o.objectStore("children");e.delete(t),n.delete(t),["calendar","map","addendum"].forEach(function(e){removeByIndex(o.objectStore(e).index("activityId"),t)})}}function putSubscription(e,t){t.objectStore("subscriptions").put(e)}function successResponse(e,r,t,o,n){var i=t.transaction(["map","calendar","children","subscriptions","activity","addendum","root","users","attendance","reimbursement","payment"],"readwrite"),a=i.objectStore("addendum"),s=i.objectStore("activity"),u=i.objectStore("users"),c=i.objectStore("attendance"),d=i.objectStore("reimbursement"),m=i.objectStore("payment"),p={},l={};e.addendum.forEach(function(e){e.hasOwnProperty("user")&&(e.unassign&&(e.user==r.user.phoneNumber?removeActivityFromDB(e.activityId,i):removeUserFromAssigneeInActivity(e,i)),e.isComment?(e.hasOwnProperty("assignee")?e.assignee===r.user.phoneNumber?(e.key=r.user.phoneNumber+e.user,l[e.user]?l[e.user].push(e):l[e.user]=[e],p[e.user]?p[e.user]+=1:p[e.user]=1):(e.key=r.user.phoneNumber+e.assignee,l[e.assignee]?l[e.assignee].push(e):l[e.assignee]=[e]):(e.key=r.user.phoneNumber+e.user,l[e.user]?l[e.user].push(e):l[e.user]=[e],e.user!==r.user.phoneNumber&&(p[e.user]?p[e.user]+=1:p[e.user]=1)),a.add(e)):(e.key=r.user.phoneNumber+e.user,l[e.user]?l[e.user].push(e):l[e.user]=[e],e.user!==r.user.phoneNumber&&(p[e.user]?p[e.user]+=1:p[e.user]=1)))}),e.locations.forEach(function(e){putMap(e,i)}),updateAttendance(e.attendances,c),updateReimbursements(e.reimbursements,d),updatePayments(e.payments,m),e.activities.forEach(function(e){e.activityId&&(e.canEdit,e.editable,s.put(e),updateCalendar(e,i),putAttachment(e,i,r),e.assignees.forEach(function(o){u.get(o.phoneNumber).onsuccess=function(e){var t=e.target.result;t||(t={count:0}),t.mobile=o.phoneNumber,t.displayName=o.displayName,t.photoURL||(t.photoURL=o.photoURL),t.NAME_SEARCH=o.displayName.toLowerCase(),t.timestamp||(t.timestamp=""),u.put(t)}}))}),Object.keys(l).forEach(function(n){l[n].forEach(function(o){if(o.isComment&&o.assignee)return updateUserStore(u,n,o,p);var e=o.activityId;s.get(e).onsuccess=function(e){var t=e.target.result;t&&t.assignees.forEach(function(e){o.key=r.user.phoneNumber+e.phoneNumber,a.put(o),n===r.user.phoneNumber&&updateUserStore(u,e.phoneNumber,o,p),n===e.phoneNumber&&updateUserStore(u,n,o,p)})}})}),e.products&&e.products.forEach(function(e){putAttachment(e,i,r)}),e.templates.forEach(function(e){"CANCELLED"!==e.status&&(e.activityId?putSubscription(e,i):instant(JSON.stringify({message:"activityId missing from template object",body:e}),r))}),updateRoot(e,i,r.user.uid,p),i.oncomplete=function(){return console.log("all completed"),o(e)},i.onerror=function(){return n(i.error)}}function updateUserStore(o,n,r,i){o.get(n).onsuccess=function(e){var t=e.target.result;if(t||(t={count:0,displayName:"",photoURL:"",mobile:n}),t.comment=r.comment,t.timestamp=r.timestamp,r.isComment&&!i[n])return o.put(t);t.count?t.count+=i[n]:t.count=i[n],o.put(t)}}function updateRoot(o,e,t,n){var r=0;Object.keys(n).forEach(function(e){r+=n[e]});var i=e.objectStore("root");i.get(t).onsuccess=function(e){var t=e.target.result;t.fromTime=o.upto,t.totalCount?t.totalCount+=r:t.totalCount=r,console.log("start adding upto"),i.put(t)}}function updateIDB(a){return new Promise(function(t,o){var e=a.db.transaction(["root"]),n=e.objectStore("root"),r=void 0,i=void 0;n.get(a.payload.meta.user.uid).onsuccess=function(e){r=e.target.result,i=r.fromTime},e.oncomplete=function(){http({method:"GET",url:a.payload.meta.apiUrl+"read1?from="+i,data:null,token:a.payload.meta.user.token}).then(function(e){return console.log("read completed"),successResponse(e,a.payload.meta,a.db,t,o)}).catch(function(e){return o(e)})}})}self.onmessage=function(t){console.log(t),meta=t.data.meta;var o=t.data.id;if("geolocationApi"!==t.data.type){var n=indexedDB.open(t.data.meta.user.uid);n.onsuccess=function(){var e=n.result;return"now"===t.data.type?handleNow(t.data,e):"instant"===t.data.type?instant(t.data.body,t.data.meta):void("Null"!==t.data.type?requestFunctionCaller[t.data.type](t.data.body,t.data.meta).then(function(e){sendSuccessRequestToMainThread(e,o)}).catch(function(e){e.id=o,e.requestType=t.data.type,sendErrorRequestToMainThread(e)}):updateIDB({payload:t.data,db:e}).then(function(e){sendSuccessRequestToMainThread(e,o)}).catch(function(e){e.id=o,e.requestType=t.data.type,sendErrorRequestToMainThread(e)}))}}else geolocationApi(t.data.body,t.data.meta,3).then(function(e){sendSuccessRequestToMainThread(e,o)}).catch(function(e){e.id=o,self.postMessage(e)})};