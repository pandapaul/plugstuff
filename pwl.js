//Plug.dj persistent wait list
var pwl = {};
pwl.data = {};
pwl.engaged = false;
pwl.userLeaveCallback = function(user) {
  pwl.data[user.id] = {};
  pwl.data[user.id].leftAt = new Date().getTime();
  pwl.data[user.id].wlIndex = user.wlIndex;
  //console.log('user ' + user.username + ' left. saving data: leftAt = ' + pwl.data[user.id].leftAt + ' & wlIndex = ' + pwl.data[user.id].wlIndex);
}
pwl.userJoinCallback = function(user) {
  if(pwl.data[user.id]) {
    if(pwl.shouldUserBeRestored(pwl.data[user.id])) {
      var restoreToPosition = Math.min(API.getWaitList().length, pwl.data[user.id].wlIndex + 1);
      if(pwl.fullAuto && API.hasPermission(null,API.ROLE.MANAGER)) {
        var moveDJ = function(usersInWaitList) {
          var userFound = false;
          for(var i=0;i<usersInWaitList.length;i++) {
            if(usersInWaitList[i].id = user.id) {
              API.moderateMoveDJ(user.id, restoreToPosition);
              API.off(API.WAIT_LIST_UPDATE, moveDJ);
              break;
            }
          }
        };
        API.on(API.WAIT_LIST_UPDATE, moveDJ);
        API.moderateAddDJ(user.id);
        API.sendChat('PWL: ' + user.username + ' rejoined within 1 hour of leaving and has been restored to position ' + restoreToPosition + ' in the wait list.');
      } else {
        API.sendChat('PWL: ' + user.username + ' rejoined within 1 hour of leaving and should be restored to position ' + restoreToPosition + ' in the wait list.');
      }
    }
  }
}
pwl.shouldUserBeRestored = function(storedUserData) {
  var now = new Date().getTime();
  return storedUserData.leftAt + 5000 < now && storedUserData.leftAt + 3600000 > now && storedUserData.wlIndex > -1;
}
pwl.chatCallback = function(chatData) {
  if(chatData.message[0] !== ';' && chatData.message[0] !== '!') return;
  if(chatData.message.toLowerCase().substring(1) === 'pwlrunning') {
    if(pwl.engaged) {
      API.sendChat('PWL is running, @' + chatData.from);
    }
  }
}
pwl.init = function(fullAuto) {
  pwl.stop(true);
  pwl.fullAuto = fullAuto;
  if(fullAuto) {
    API.sendChat('PWL: Engaged in full auto.');
  } else {
    API.sendChat('PWL: Engaged.');
  }
  API.on(API.USER_JOIN, pwl.userJoinCallback);
  API.on(API.USER_LEAVE, pwl.userLeaveCallback);
  API.on(API.CHAT, pwl.chatCallback);
  pwl.engaged = true;
}
pwl.stop = function(stealth) {
  if(!stealth) {
    API.sendChat('PWL: Disengaged.');
  }
  API.off(API.USER_JOIN, pwl.userJoinCallback);
  API.off(API.USER_LEAVE, pwl.userLeaveCallback);
  API.off(API.CHAT, pwl.chatCallback);
  pwl.engaged = false;
}
pwl.showControls = function() {
  $('#room').append($('<div id="pwlDiv" style="padding-top:10px;text-align:center;cursor:pointer;background:#282C35;border-radius:5px;width:100px;height:30px;position:absolute;left:10px;top:50px">PWL Off</div>'));
  $('#pwlDiv').click(function(){
    if(pwl.engaged) {
      pwl.stop();
      $(this).html('PWL Off');
    } else {
      pwl.init(API.hasPermission(null, API.ROLE.MANAGER));
      $(this).html('PWL On');
    }
  });
  
}();
