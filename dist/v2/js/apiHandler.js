importScripts("https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.24.0/moment.min.js");var deviceInfo=void 0,currentDevice=void 0,meta=void 0;function getTime(){return Date.now()}var requestFunctionCaller={dm:dm,statusChange:statusChange,share:share,update:update,create:create,backblaze:backblaze,updateAuth:updateAuth,comment:comment};function sendSuccessRequestToMainThread(e,t){self.postMessage({response:e,success:!0})}function sendErrorRequestToMainThread(e){console.log(e);var t={response:{message:e.message,apiRejection:!1},success:!1};e.stack&&(t.response.stack=e.stack),e.code?t.response.apiRejection=!0:instant(JSON.stringify(t.response),meta),self.postMessage(t)}function http(e){return new Promise(function(o,n){var r=new XMLHttpRequest;r.open(e.method,e.url,!0),r.setRequestHeader("X-Requested-With","XMLHttpRequest"),r.setRequestHeader("Content-Type","application/json"),r.setRequestHeader("Authorization","Bearer "+e.token),"GET"!==e.method&&(r.timeout=15e3,r.ontimeout=function(){return n({code:400,message:"Request Timed Out. Please Try Again Later"})}),r.onreadystatechange=function(){if(4===r.readyState){if(!r.status||226<r.status){if(!r.response)return;var e=JSON.parse(r.response),t={message:e.message,code:e.code};return n(t)}r.responseText?o(JSON.parse(r.responseText)):o("success")}},r.send(e.body||null)})}function fetchServerTime(a,i,c){return new Promise(function(e,t){currentDevice=a.device;var o=JSON.parse(currentDevice),n=i.apiUrl+"now?deviceId="+o.id+"&appVersion="+o.appVersion+"&os="+o.baseOs+"&deviceBrand="+o.deviceBrand+"&deviceModel="+o.deviceModel+"&registrationToken="+a.registerToken,r=c.transaction(["root"],"readwrite"),s=r.objectStore("root");s.get(i.user.uid).onsuccess=function(e){var t=e.target.result;t&&(t.officesRemoved&&(t.officesRemoved.forEach(function(e){n=n+"&removeFromOffice="+e.replace(" ","%20")}),delete t.officesRemoved),t.venuesSet&&(n+="&venues=true",delete t.venuesSet),s.put(t))},r.oncomplete=function(){http({method:"GET",url:n,body:null,token:i.user.token}).then(e).catch(t)}})}function instant(e,t){http({method:"POST",url:t.apiUrl+"services/logs",body:e,token:t.user.token}).then(function(e){console.log(e)}).catch(console.log)}function putServerTime(r){return console.log(r),new Promise(function(e,t){var o=r.db.transaction(["root"],"readwrite"),n=o.objectStore("root");n.get(r.meta.user.uid).onsuccess=function(e){var t=e.target.result;t.serverTime=r.ts-Date.now(),n.put(t)},o.oncomplete=function(){e({meta:r.meta,db:r.db})}})}function comment(e,t){return http({method:"POST",url:t.apiUrl+"activities/comment",body:JSON.stringify(e),token:t.user.token})}function geolocationApi(r,e){return new Promise(function(t,o){var n=new XMLHttpRequest;n.open("POST","https://www.googleapis.com/geolocation/v1/geolocate?key="+e.key,!0),n.setRequestHeader("Content-Type","application/json"),n.onreadystatechange=function(){if(4===n.readyState){if(400<=n.status)return o({message:n.response,body:r});var e=JSON.parse(n.response);if(!e)return o({message:"Response From geolocation Api "+e,body:r});t({latitude:e.location.lat,longitude:e.location.lng,accuracy:e.accuracy,provider:r,lastLocationTime:Date.now()})}},n.onerror=function(){o({message:n})},n.send(JSON.stringify(r))})}function dm(e,t){return console.log(e),http({method:"POST",url:t.apiUrl+"dm",body:JSON.stringify(e),token:t.user.token})}function statusChange(e,t){return http({method:"PATCH",url:t.apiUrl+"activities/change-status",body:JSON.stringify(e),token:t.user.token})}function share(e,t){return http({method:"PATCH",url:t.apiUrl+"activities/share",body:JSON.stringify(e),token:t.user.token})}function update(e,t){return http({method:"PATCH",url:t.apiUrl+"activities/update",body:JSON.stringify(e),token:t.user.token})}function create(e,t){return http({method:"POST",url:t.apiUrl+"activities/create",body:JSON.stringify(e),token:t.user.token})}function removeFromOffice(r,s,a){return new Promise(function(t,n){var e=a.transaction(["map","calendar","children","list","subscriptions","activity"],"readwrite");e.oncomplete=function(){var e=a.transaction(["root"],"readwrite"),o=e.objectStore("root");o.get(s.user.uid).onsuccess=function(e){var t=e.target.result;t&&(t.officesRemoved=r,o.put(t))},e.oncomplete=function(){console.log("run read after removal"),t({response:"Office Removed",success:!0})},e.onerror=function(e){n({response:e,success:!1})}},e.onerror=function(){console.log(tx.error)},removeActivity(r,e)})}function removeActivity(e,t){var o=t.objectStore("activity").index("office"),n=t.objectStore("list").index("office"),r=t.objectStore("children").index("office"),s=t.objectStore("map").index("office"),a=t.objectStore("calendar").index("office"),i=t.objectStore("subscriptions").index("office");e.forEach(function(e){removeByIndex(o,e),removeByIndex(n,e),removeByIndex(r,e),removeByIndex(s,e),removeByIndex(a,e),removeByIndex(i,e)})}function removeByIndex(e,t){e.openCursor(t).onsuccess=function(e){var t=e.target.result;t&&(t.delete().onsuccess=function(){t.continue()})}}function updateAuth(e,t){return http({method:"POST",url:"https://growthfile.com/json?action=update-auth",body:JSON.stringify(e),token:t.user.token})}function backblaze(e,t){return http({method:"POST",url:t.apiUrl+"services/images",body:JSON.stringify(e),token:t.user.token})}function instantUpdateDB(s,a,e){return new Promise(function(t,o){var r=indexedDB.open(e.uid);r.onsuccess=function(){var e=r.result.transaction(["activity"],"readwrite"),n=e.objectStore("activity");n.get(s.activityId).onsuccess=function(e){var t=e.target.result;if(t.editable=0,"share"===a&&(s.share.forEach(function(e){t.assignees.push(e)}),n.put(t)),"update"===a){t.schedule=s.schedule,t.attachment=s.attachment;for(var o=0;o<t.venue.length;o++)t.venue[o].geopoint={_latitude:s.venue[o].geopoint.latitude,_longitude:s.venue[o].geopoint.longitude};n.put(t)}"status"===a&&(t[a]=s[a],n.put(t))},e.oncomplete=function(){t(!0)},e.onerror=function(){o(!0)}}})}function updateReports(e,t){console.log(t),e.forEach(function(e){e.joinedDate=Number(""+e.month+e.date+e.year),t.put(e)})}function updateCalendar(n,e){var r=e.objectStore("calendar");r.index("activityId").openCursor(n.activityId).onsuccess=function(e){var t=e.target.result;if(t){var o=t.delete();o.onsuccess=function(){console.log("remove calendar"),t.continue()},o.onerror=function(){instant({message:o.error.message},meta)}}else n.schedule.forEach(function(e){e.startTime,e.endTime;var t={activityId:n.activityId,scheduleName:e.name,timestamp:n.timestamp,template:n.template,hidden:n.hidden,start:e.startTime,end:e.endTime,status:n.status,office:n.office};r.add(t)})}}function putAttachment(e,t,o){var n=t.objectStore("children"),r={activityId:e.activityId,status:e.status,template:e.template,office:e.office,attachment:e.attachment},s=o.user.phoneNumber;"employee"===e.template&&(r.employee=e.attachment["Employee Contact"].value,e.attachment["First Supervisor"].value!==s&&e.attachment["Second Supervisor"].value!==s||(r.team=1)),n.put(r)}function removeUserFromAssigneeInActivity(n,e){removeByIndex(e.objectStore("addendum").index("user"),n.user);var r=e.objectStore("activity");r.get(n.activityId).onsuccess=function(e){var t=e.target.result;if(t){var o=t.assignees.findIndex(function(e){return e.phoneNumber===n.user});-1<o&&(t.assignees.splice(o,1),r.put(t))}}}function removeActivityFromDB(e,t){if(e){var o=t.objectStore("activity"),n=t.objectStore("list"),r=t.objectStore("children"),s=t.objectStore("calendar").index("activityId"),a=t.objectStore("map").index("activityId"),i=t.objectStore("addendum").index("activityId");o.delete(e),n.delete(e),r.delete(e),removeByIndex(s,e),removeByIndex(a,e),removeByIndex(i,e)}}function updateSubscription(o,e){var n=e.objectStore("subscriptions");n.index("officeTemplate").openCursor([o.office,o.template]).onsuccess=function(e){var t=e.target.result;t?t.delete().onsuccess=function(){console.log("deleted"),t.continue()}:n.put(o)}}function createListStore(o,e){var n={activityId:o.activityId,timestamp:o.timestamp,activityName:o.activityName,status:o.status},r=e.objectStore("list");r.get(o.activityId).onsuccess=function(e){var t=e.target.result;n.createdTime=t?t.createdTime:o.timestamp,r.put(n)}}function successResponse(e,r,t,o,n){var s=t.transaction(["map","calendar","children","list","subscriptions","activity","addendum","root","users","reports"],"readwrite"),a=s.objectStore("addendum"),i=s.objectStore("activity"),c=s.objectStore("users"),u=s.objectStore("reports"),d={},m={};if(e.addendum.forEach(function(e){e.unassign&&(e.user==r.user.phoneNumber?removeActivityFromDB(e.activityId,s):removeUserFromAssigneeInActivity(e,s)),e.isComment?(e.assignee===r.user.phoneNumber?(e.key=r.user.phoneNumber+e.user,m[e.user]=e,d[e.user]?d[e.user]+=1:d[e.user]=1):(e.key=r.user.phoneNumber+e.assignee,m[e.assignee]=e),a.add(e)):(m[e.user]=e).user!==r.user.phoneNumber&&(d[e.user]?d[e.user]+=1:d[e.user]=1)}),e.locations.length){var p=s.objectStore("map");p.clear().onsuccess=function(){e.locations.forEach(function(e){p.add(e)})}}updateReports(e.statusObject,u),e.activities.forEach(function(e){e.canEdit,e.editable,e.activityName=formatTextToTitleCase(e.activityName),i.put(e),updateCalendar(e,s),putAttachment(e,s,r),e.assignees.forEach(function(o){c.get(o.phoneNumber).onsuccess=function(e){var t=e.target.result;t||(t={count:0}),t.mobile=o.phoneNumber,t.displayName=o.displayName,t.photoURL||(t.photoURL=o.photoURL),t.NAME_SEARCH=o.displayName.toLowerCase(),t.timestamp||(t.timestamp=""),c.put(t)}})}),Object.keys(m).forEach(function(o){var n=m[o],e=n.activityId;console.log(d),e?i.get(e).onsuccess=function(e){var t=e.target.result;t&&t.assignees.forEach(function(e){n.key=r.user.phoneNumber+e.phoneNumber,a.put(n),o!==r.user.phoneNumber?o!==e.phoneNumber||(c.get(o).onsuccess=function(e){var t=e.target.result;t&&(t.comment=n.comment,t.timestamp=n.timestamp,t.count?t.count+=d[o]:t.count=d[o],c.put(t))}):c.get(e.phoneNumber).onsuccess=function(e){var t=e.target.result;t&&(t.comment=n.comment,t.timestamp=n.timestamp,t.count?t.count+=d[o]:t.count=d[o],c.put(t))}})}:c.get(o).onsuccess=function(e){var t=e.target.result;if(t){if(t.comment=n.comment,t.timestamp=n.timestamp,!d[o])return c.put(t);t.count?t.count+=d[o]:t.count=d[o],c.put(t)}}}),e.templates.forEach(function(e){updateSubscription(e,s)}),updateRoot(e,s,r.user.uid,d),s.oncomplete=function(){return console.log("all completed"),o(e)},s.onerror=function(){return n(s.error)}}function updateRoot(o,e,t,n){var r=0;Object.keys(n).forEach(function(e){r+=n[e]});var s=e.objectStore("root");s.get(t).onsuccess=function(e){var t=e.target.result;t.fromTime=o.upto,t.totalCount?t.totalCount+=r:t.totalCount=r,console.log("start adding upto"),s.put(t)}}function updateIDB(a){return new Promise(function(t,o){var e=a.db.transaction(["root"]),n=e.objectStore("root"),r=void 0,s=void 0;n.get(a.meta.user.uid).onsuccess=function(e){r=e.target.result,s=r.fromTime},e.oncomplete=function(){http({method:"GET",url:a.meta.apiUrl+"read?from="+s,data:null,token:a.meta.user.token}).then(function(e){return console.log(e.statusObject),successResponse(e,a.meta,a.db,t,o)}).catch(function(e){return o(e)})}})}function formatTextToTitleCase(e){for(var t=[],o=0;o<e.length;o++)0==o?t.push(e[o].toUpperCase()):e[o-1].toLowerCase()==e[o-1].toUpperCase()?t.push(e[o].toUpperCase()):t.push(e[o].toLowerCase());return t.join("")}self.onmessage=function(s){if(meta=s.data.meta,"geolocationApi"!==s.data.type){var e=indexedDB.open(s.data.meta.user.uid);e.onsuccess=function(){var n=e.result;if("now"!==s.data.type)"instant"!==s.data.type?"Null"!==s.data.type?requestFunctionCaller[s.data.type](s.data.body,s.data.meta).then(sendSuccessRequestToMainThread).catch(sendErrorRequestToMainThread):updateIDB({meta:s.data.meta,db:n}).then(sendSuccessRequestToMainThread).catch(sendErrorRequestToMainThread):instant(s.data.body,s.data.meta);else{var r="";fetchServerTime(s.data.body,s.data.meta,n).then(function(t){var e=n.transaction(["root"],"readwrite"),o=e.objectStore("root");o.get(s.data.meta.user.uid).onsuccess=function(e){(r=e.target.result).serverTime=t.timestamp-Date.now(),o.put(r)},e.oncomplete=function(){t.removeFromOffice?Array.isArray(t.removeFromOffice)&&t.removeFromOffice.length&&removeFromOffice(t.removeFromOffice,s.data.meta,n).then(sendSuccessRequestToMainThread).catch(sendErrorRequestToMainThread):self.postMessage({response:t,success:!0})}}).catch(sendErrorRequestToMainThread)}},e.onerror=function(){}}else geolocationApi(s.data.body,s.data.meta).then(sendSuccessRequestToMainThread).catch(function(e){self.postMessage(e)})};