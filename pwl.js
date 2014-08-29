//Plug.dj persistent wait list
var pwl = {};
pwl.data = {};
pwl.engaged = false;
pwl.userRestoredMessageDefault = '@username rejoined within 1 hour of leaving and has been restored to position @position in the wait list.';
pwl.userRestoredMessage = pwl.userRestoredMessageDefault;

pwl.waitListUpdateCallback = function(waitList) {
  var timestamp = new Date().getTime();
  for(i=0;i<waitList.length;i++) {
    if(!pwl.data[waitList[i].id]) {
      pwl.data[waitList[i].id] = {};
    }
    pwl.data[waitList[i].id].wlIndex = i;
    pwl.data[waitList[i].id].timestamp = timestamp;
  }
  for(var k in pwl.data) {
    if(pwl.data.hasOwnProperty(k)) {
      if(pwl.data[k].timestamp !== timestamp && $.isEmptyObject(API.getUser(k))) {
        pwl.data[k].leftAt = timestamp;
      }
    }
  }
};

pwl.userJoinCallback = function(user) {
  if(pwl.data[user.id] && pwl.shouldUserBeRestored(pwl.data[user.id])) {
    var restoreToPosition = Math.min(API.getWaitList().length, pwl.data[user.id].wlIndex + 1);
    if(pwl.fullAuto && API.hasPermission(null,API.ROLE.MANAGER)) {
      var moveDJ = function(usersInWaitList) {
        var userFound = false;
        for(i=0;i<usersInWaitList.length;i++) {
          if(usersInWaitList[i].id === user.id) {
            API.moderateMoveDJ(user.id, restoreToPosition);
            API.off(API.WAIT_LIST_UPDATE, moveDJ);
            break;
          }
        }
      };
      API.on(API.WAIT_LIST_UPDATE, moveDJ);
      API.moderateAddDJ(user.id);
      API.sendChat('PWL: ' + pwl.userRestoredMessage.replace(/@username/i,user.username).replace(/@position/i,restoreToPosition));
    } else {
      API.sendChat('PWL: ' + user.username + ' rejoined within 1 hour of leaving and should be restored to position ' + restoreToPosition + ' in the wait list.');
    }
  }
};

pwl.shouldUserBeRestored = function(storedUserData) {
  var now = new Date().getTime();
  return storedUserData.leftAt + 5000 < now && storedUserData.leftAt + 3600000 > now && storedUserData.wlPosition > -1;
};

pwl.chatCallback = function(chatData) {
  if(chatData.message[0] !== ';' && chatData.message[0] !== '!') return;
  var command = chatData.message.toLowerCase().substring(1);
  if(command === 'pwlrunning') {
    if(pwl.engaged) {
      API.sendChat('PWL is running, @' + chatData.un);
    }
  } else if(command === 'wtfispwl') {
    if(pwl.engaged) {
      API.sendChat('PWL is a Persistent Wait List. If you leave while in the wait list but return within an hour, it\'ll put you back where you were.');
    }
  }
};

pwl.init = function(fullAuto) {
  pwl.stop(true);
  pwl.fullAuto = fullAuto;
  API.on(API.USER_JOIN, pwl.userJoinCallback);
  API.on(API.USER_LEAVE, pwl.userLeaveCallback);
  API.on(API.CHAT, pwl.chatCallback);
  pwl.engaged = true;
  if(fullAuto) {
    API.sendChat('PWL: Engaged in full auto.');
  } else {
    API.sendChat('PWL: Engaged.');
  }
};

pwl.stop = function(stealth) {
  if(!stealth) {
    API.sendChat('PWL: Disengaged.');
  }
  API.off(API.USER_JOIN, pwl.userJoinCallback);
  API.off(API.USER_LEAVE, pwl.userLeaveCallback);
  API.off(API.CHAT, pwl.chatCallback);
  pwl.engaged = false;
};

pwl.gui = $('<div/>');
pwl.gui.attr('id','pwlGui');
pwl.gui.attr('style',"z-index:999;padding:10px;text-align:center;background:#282C35;border-radius:5px;position:absolute;left:10px;top:75px");
pwl.gui.toggle = $('<div/>');
pwl.gui.toggle.attr('id','pwlGui');
pwl.gui.toggle.css('cursor','pointer');
pwl.gui.toggle.css('display','inline-block');
pwl.gui.toggle.html('PWL Off');
pwl.gui.customize = $('<div/>');
pwl.gui.customize.attr('id','pwlCustomize');
pwl.gui.customize.css('font-size','x-small');
pwl.gui.customize.css('cursor','pointer');
pwl.gui.customize.css('display','inline-block');
pwl.gui.customize.html('customize');
pwl.gui.customize.input = $('<input type="text"/>');
pwl.gui.customize.input.hide();
pwl.gui.customize.input.attr('id','pwlCustomizeInput');
pwl.gui.customize.input.attr('maxlength',240);
pwl.gui.customize.input.css('margin-top',10);
pwl.gui.customize.input.css('width',200);
pwl.gui.customize.input.css('font-size','smaller');
pwl.gui.customize.input.val(pwl.userRestoredMessage);

pwl.gui.normalColor = '#eee';
pwl.gui.hoverColor = '#00b5e6';

pwl.gui.toggle.hover(function(){$(this).css('color',pwl.gui.hoverColor);}, function(){$(this).css('color',pwl.gui.normalColor);});
pwl.gui.customize.hover(function(){$(this).css('color',pwl.gui.hoverColor);}, function(){$(this).css('color',pwl.gui.normalColor);});

pwl.gui.append(pwl.gui.toggle);
pwl.gui.append('<br>');
pwl.gui.append(pwl.gui.customize);
pwl.gui.append('<br>');
pwl.gui.append(pwl.gui.customize.input);

pwl.gui.toggle.click(function(){
  if(pwl.engaged) {
    pwl.stop();
    $(this).html('PWL Off');
  } else {
    pwl.init(API.hasPermission(null, API.ROLE.MANAGER));
    $(this).html('PWL On');
  }
});

pwl.gui.customize.click(function() {
  pwl.gui.customize.input.fadeToggle();
});

pwl.gui.customize.input.keyup(function() {
  if(!this.value.trim().length) {
    this.value = pwl.userRestoredMessageDefault;
  }
  pwl.userRestoredMessage = this.value;
});

pwl.showControls = function() {
  $('#room').append(pwl.gui);
}();