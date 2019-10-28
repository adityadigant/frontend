var deviceInfo=void 0,currentDevice=void 0,meta=void 0;function getTime(){return Date.now()}var requestFunctionCaller={dm:dm,statusChange:statusChange,share:share,update:update,create:create,backblaze:backblaze,updateAuth:updateAuth,comment:comment,changePhoneNumber:changePhoneNumber,paymentMethods:paymentMethods,newBankAccount:newBankAccount,removeBankAccount:removeBankAccount};function sendSuccessRequestToMainThread(e,t){self.postMessage({response:e,success:!0})}function sendErrorRequestToMainThread(e){console.log(e);var t={response:{message:e.message,apiRejection:!1},success:!1};e.stack&&(t.response.stack=e.stack),e.code?t.response.apiRejection=!0:instant(JSON.stringify(t.response),meta),self.postMessage(t)}function http(e){return new Promise(function(o,n){var r=new XMLHttpRequest;r.open(e.method,e.url,!0),r.setRequestHeader("X-Requested-With","XMLHttpRequest"),r.setRequestHeader("Content-Type","application/json"),r.setRequestHeader("Authorization","Bearer "+e.token),"GET"!==e.method&&e.timeout&&(r.timeout=e.timeout,r.ontimeout=function(){return n({code:400,message:"Request Timed Out. Please Try Again Later"})}),r.onreadystatechange=function(){if(4===r.readyState){if(!r.status||226<r.status){if(!r.response)return;var e=JSON.parse(r.response),t={message:e.message,code:e.code};return n(t)}r.responseText?o(JSON.parse(r.responseText)):o("success")}},r.send(e.body||null)})}function fetchServerTime(s,i,c){return new Promise(function(e,t){currentDevice=s.device;var o=JSON.parse(currentDevice),n=i.apiUrl+"now?deviceId="+o.id+"&appVersion="+o.appVersion+"&os="+o.baseOs+"&deviceBrand="+o.deviceBrand+"&deviceModel="+o.deviceModel+"&registrationToken="+s.registerToken+"&idb_version="+c.version,r=c.transaction(["root"],"readwrite"),a=r.objectStore("root");a.get(i.user.uid).onsuccess=function(e){var t=e.target.result;t&&(t.officesRemoved&&(t.officesRemoved.forEach(function(e){n=n+"&removeFromOffice="+e.replace(" ","%20")}),delete t.officesRemoved),t.venuesSet&&(n+="&venues=true",delete t.venuesSet),a.put(t))},r.oncomplete=function(){http({method:"GET",url:n,body:null,token:i.user.token}).then(e).catch(t)}})}function instant(e,t){http({method:"POST",url:t.apiUrl+"services/logs",body:e,token:t.user.token}).then(function(e){console.log(e)}).catch(console.log)}function putServerTime(r){return console.log(r),new Promise(function(e,t){var o=r.db.transaction(["root"],"readwrite"),n=o.objectStore("root");n.get(r.meta.user.uid).onsuccess=function(e){var t=e.target.result;t.serverTime=r.ts-Date.now(),n.put(t)},o.oncomplete=function(){e({meta:r.meta,db:r.db})}})}function comment(e,t){return http({method:"POST",url:t.apiUrl+"activities/comment",body:JSON.stringify(e),token:t.user.token,timeout:15e3})}function changePhoneNumber(e,t){return console.log("change number"),http({method:"POST",url:t.apiUrl+"changePhoneNumber",body:JSON.stringify(e),token:t.user.token,timeout:null})}function paymentMethods(e,t){return http({method:"GET",url:t.apiUrl+"paymentMethods",body:null,token:t.user.token,timeout:null})}function removeBankAccount(e,t){return http({method:"DELETE",url:t.apiUrl+"paymentMethods/bankAccount?bankAccount="+e.bankAccount,body:null,token:t.user.token,timeout:null})}function newBankAccount(e,t){return http({method:"POST",url:t.apiUrl+"paymentMethods",body:JSON.stringify(e),token:t.user.token,timeout:null})}function geolocationApi(r,a,s){return new Promise(function(t,o){var n=new XMLHttpRequest;n.open("POST","https://www.googleapis.com/geolocation/v1/geolocate?key="+a.key,!0),n.setRequestHeader("Content-Type","application/json"),n.onreadystatechange=function(){if(4===n.readyState){if(400<=n.status)return 0<s?void setTimeout(function(){geolocationApi(r,a,s-=1).then(t).catch(o)},1e3):o({message:JSON.parse(n.response).error.message,body:{geolocationResponse:JSON.parse(n.response),geolocationBody:r}});var e=JSON.parse(n.response);return e?t({latitude:e.location.lat,longitude:e.location.lng,accuracy:e.accuracy,provider:r,lastLocationTime:Date.now()}):0<s?void setTimeout(function(){geolocationApi(r,a,s-=1).then(t).catch(o)},1e3):o({message:"Response From geolocation Api "+e,body:r})}},n.onerror=function(){if(!(0<s))return o({message:n});setTimeout(function(){geolocationApi(r,a,s-=1).then(t).catch(o)},1e3)},n.send(JSON.stringify(r))})}function dm(e,t){return console.log(e),http({method:"POST",url:t.apiUrl+"dm",body:JSON.stringify(e),token:t.user.token,timeout:15e3})}function statusChange(e,t){return http({method:"PATCH",url:t.apiUrl+"activities/change-status",body:JSON.stringify(e),token:t.user.token,timeout:15e3})}function share(e,t){return http({method:"PATCH",url:t.apiUrl+"activities/share",body:JSON.stringify(e),token:t.user.token,timeout:15e3})}function update(e,t){return http({method:"PATCH",url:t.apiUrl+"activities/update",body:JSON.stringify(e),token:t.user.token,timeout:15e3})}function create(e,t){return http({method:"POST",url:t.apiUrl+"activities/create",body:JSON.stringify(e),token:t.user.token,timeout:15e3})}function removeFromOffice(r,a,s){return new Promise(function(t,n){var e=s.transaction(["map","calendar","children","subscriptions","activity"],"readwrite");e.oncomplete=function(){var e=s.transaction(["root"],"readwrite"),o=e.objectStore("root");o.get(a.user.uid).onsuccess=function(e){var t=e.target.result;t&&(t.officesRemoved=r,o.put(t))},e.oncomplete=function(){console.log("run read after removal"),t({response:"Office Removed",success:!0})},e.onerror=function(e){n({response:e,success:!1})}},e.onerror=function(){console.log(tx.error)},removeActivity(r,e)})}function removeActivity(e,t){var o=t.objectStore("activity").index("office"),n=t.objectStore("children").index("office"),r=t.objectStore("map").index("office"),a=t.objectStore("calendar").index("office"),s=t.objectStore("subscriptions").index("office");e.forEach(function(e){removeByIndex(o,e),removeByIndex(n,e),removeByIndex(r,e),removeByIndex(a,e),removeByIndex(s,e)})}function removeByIndex(e,t){e.openCursor(t).onsuccess=function(e){var t=e.target.result;t&&(t.delete(),t.continue())}}function updateAuth(e,t){return http({method:"POST",url:"https://growthfile.com/json?action=update-auth",body:JSON.stringify(e),token:t.user.token,timeout:15e3})}function backblaze(e,t){return http({method:"POST",url:t.apiUrl+"services/images",body:JSON.stringify(e),token:t.user.token,timeout:3e4})}function updateAttendance(){var e=0<arguments.length&&void 0!==arguments[0]?arguments[0]:[],t=arguments[1];e.forEach(function(e){e.editable=!0,t.put(e)})}function updateReimbursements(){var e=0<arguments.length&&void 0!==arguments[0]?arguments[0]:[],t=arguments[1];e.forEach(function(e){t.put(e)})}function updatePayments(){var e=0<arguments.length&&void 0!==arguments[0]?arguments[0]:[],t=arguments[1];e.forEach(function(e){t.put(e)})}function updateCalendar(n,e){var r=e.objectStore("calendar");r.index("activityId").openCursor(n.activityId).onsuccess=function(e){var t=e.target.result;if(t){var o=t.delete();t.continue(),o.onsuccess=function(){console.log("remove calendar")},o.onerror=function(){instant({message:o.error.message},meta)}}else n.schedule.forEach(function(e){e.startTime,e.endTime;var t={activityId:n.activityId,scheduleName:e.name,timestamp:n.timestamp,template:n.template,hidden:n.hidden,start:e.startTime,end:e.endTime,status:n.status,office:n.office};r.add(t)})}}function putAttachment(e,t,o){var n=t.objectStore("children"),r={activityId:e.activityId,status:e.status,template:e.template,office:e.office,attachment:e.attachment},a=o.user.phoneNumber;"employee"===e.template&&(r.employee=e.attachment["Employee Contact"].value,e.attachment["First Supervisor"].value!==a&&e.attachment["Second Supervisor"].value!==a||(r.team=1)),n.put(r)}function removeUserFromAssigneeInActivity(n,e){removeByIndex(e.objectStore("addendum").index("user"),n.user);var r=e.objectStore("activity");r.get(n.activityId).onsuccess=function(e){var t=e.target.result;if(t){var o=t.assignees.findIndex(function(e){return e.phoneNumber===n.user});-1<o&&(t.assignees.splice(o,1),r.put(t))}}}function removeActivityFromDB(e,t){if(e){var o=t.objectStore("activity"),n=t.objectStore("children"),r=t.objectStore("calendar").index("activityId"),a=t.objectStore("map").index("activityId"),s=t.objectStore("addendum").index("activityId");o.delete(e),n.delete(e),removeByIndex(r,e),removeByIndex(a,e),removeByIndex(s,e)}}function updateSubscription(n,e){var r=e.objectStore("subscriptions");r.index("officeTemplate").openCursor([n.office,n.template]).onsuccess=function(e){var t=e.target.result;if(t){var o=t.delete();t.continue(),o.onsuccess=function(){console.log("deleted")}}else r.put(n)}}function successResponse(e,r,t,o,n){var a=t.transaction(["map","calendar","children","subscriptions","activity","addendum","root","users","attendance","reimbursement","payment"],"readwrite"),s=a.objectStore("addendum"),i=a.objectStore("activity"),c=a.objectStore("users"),u=a.objectStore("attendance"),d=a.objectStore("reimbursement"),m=a.objectStore("payment"),p={},l={};if(e.addendum.forEach(function(e){e.unassign&&(e.user==r.user.phoneNumber?removeActivityFromDB(e.activityId,a):removeUserFromAssigneeInActivity(e,a)),e.isComment?(e.assignee===r.user.phoneNumber?(e.key=r.user.phoneNumber+e.user,l[e.user]?l[e.user].push(e):l[e.user]=[e],p[e.user]?p[e.user]+=1:p[e.user]=1):(e.key=r.user.phoneNumber+e.assignee,l[e.assignee]?l[e.assignee].push(e):l[e.assignee]=[e]),s.add(e)):(e.key=r.user.phoneNumber+e.user,l[e.user]?l[e.user].push(e):l[e.user]=[e],e.user!==r.user.phoneNumber&&(p[e.user]?p[e.user]+=1:p[e.user]=1))}),e.locations.length){var f=a.objectStore("map");f.clear().onsuccess=function(){e.locations.forEach(function(e){f.add(e)})}}function h(o,n,r){o.get(n).onsuccess=function(e){var t=e.target.result;if(t||(t={count:0,displayName:"",photoURL:"",mobile:n}),t.comment=r.comment,t.timestamp=r.timestamp,r.isComment&&!p[n])return o.put(t);t.count?t.count+=p[n]:t.count=p[n],o.put(t)}}console.log("attendace length",e.attendances.length),console.log("reim length",e.reimbursements.length),console.log("payments length",e.payments.length),updateAttendance(e.attendances,u),updateReimbursements(e.reimbursements,d),updatePayments(e.payments,m),e.activities.forEach(function(e){e.canEdit,e.editable,e.activityName=formatTextToTitleCase(e.activityName),i.put(e),updateCalendar(e,a),putAttachment(e,a,r),e.assignees.forEach(function(o){c.get(o.phoneNumber).onsuccess=function(e){var t=e.target.result;t||(t={count:0}),t.mobile=o.phoneNumber,t.displayName=o.displayName,t.photoURL||(t.photoURL=o.photoURL),t.NAME_SEARCH=o.displayName.toLowerCase(),t.timestamp||(t.timestamp=""),c.put(t)}})}),Object.keys(l).forEach(function(n){l[n].forEach(function(o){if(o.isComment)return h(c,n,o);var e=o.activityId;i.get(e).onsuccess=function(e){var t=e.target.result;t&&t.assignees.forEach(function(e){o.key=r.user.phoneNumber+e.phoneNumber,s.put(o),n===r.user.phoneNumber&&h(c,e.phoneNumber,o),n===e.phoneNumber&&h(c,n,o)})}})}),e.templates.forEach(function(e){"CANCELLED"!==e.status&&updateSubscription(e,a)}),updateRoot(e,a,r.user.uid,p),a.oncomplete=function(){return console.log("all completed"),o(e)},a.onerror=function(){return n(a.error)}}function updateRoot(e,t,o,n){var r=0;Object.keys(n).forEach(function(e){r+=n[e]});var a=t.objectStore("root");a.get(o).onsuccess=function(e){var t=e.target.result;t.fromTime=0,t.totalCount?t.totalCount+=r:t.totalCount=r,console.log("start adding upto"),a.put(t)}}function updateIDB(s){return new Promise(function(t,o){var e=s.db.transaction(["root"]),n=e.objectStore("root"),r=void 0,a=void 0;n.get(s.meta.user.uid).onsuccess=function(e){r=e.target.result,a=r.fromTime},e.oncomplete=function(){http({method:"GET",url:s.meta.apiUrl+"read?from="+a,data:null,token:s.meta.user.token}).then(function(e){return successResponse(e,s.meta,s.db,t,o)}).catch(function(e){return o(e)})}})}function formatTextToTitleCase(e){for(var t=[],o=0;o<e.length;o++)0==o?t.push(e[o].toUpperCase()):e[o-1].toLowerCase()==e[o-1].toUpperCase()?t.push(e[o].toUpperCase()):t.push(e[o].toLowerCase());return t.join("")}self.onmessage=function(a){if(meta=a.data.meta,"geolocationApi"!==a.data.type){var e=indexedDB.open(a.data.meta.user.uid);e.onsuccess=function(){var n=e.result;if("now"!==a.data.type)"instant"!==a.data.type?"Null"!==a.data.type?requestFunctionCaller[a.data.type](a.data.body,a.data.meta).then(sendSuccessRequestToMainThread).catch(sendErrorRequestToMainThread):updateIDB({meta:a.data.meta,db:n}).then(sendSuccessRequestToMainThread).catch(sendErrorRequestToMainThread):instant(a.data.body,a.data.meta);else{var r="";fetchServerTime(a.data.body,a.data.meta,n).then(function(t){var e=n.transaction(["root"],"readwrite"),o=e.objectStore("root");o.get(a.data.meta.user.uid).onsuccess=function(e){(r=e.target.result).serverTime=t.timestamp-Date.now(),o.put(r)},e.oncomplete=function(){t.removeFromOffice?Array.isArray(t.removeFromOffice)&&t.removeFromOffice.length&&removeFromOffice(t.removeFromOffice,a.data.meta,n).then(sendSuccessRequestToMainThread).catch(sendErrorRequestToMainThread):self.postMessage({response:t,success:!0})}}).catch(sendErrorRequestToMainThread)}},e.onerror=function(){}}else geolocationApi(a.data.body,a.data.meta,3).then(sendSuccessRequestToMainThread).catch(function(e){self.postMessage(e)})};