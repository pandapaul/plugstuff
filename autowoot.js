var autowoot = {
	button : $('#woot'),
	action : woot.click,
	start : function () {
		API.on(API.DJ_ADVANCE,action);
	},
	stop : function () {
		API.off(API.DJ_ADVANCE,action);
	}
};
autowoot.action();
autowoot.start();