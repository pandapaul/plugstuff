var autowoot = {
	button : $('#woot'),
	action : woot.click,
	start : function () {
		API.on(API.ADVANCE,action);
	},
	stop : function () {
		API.off(API.ADVANCE,action);
	}
};
autowoot.action();
autowoot.start();