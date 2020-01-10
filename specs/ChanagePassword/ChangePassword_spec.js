

var UserMenuobj = require('./../../pageobjects/UserMenu/UserMenu.js');

var changepwdobj = require('./../../pageobjects/ChanagePassword/ChangePassword.js');

var tdata = require('./../../json/ChangePassword.json');

var logger = require('./../../log');

describe("Chnage Password", function() {
	
	it("Verify chnage password", function() {
		
	UserMenuobj.clickOnUserCircle();
	

		
		logger.log('info', 'Click on Usercircle');
		
		browser.sleep(4000);
		
		UserMenuobj.clickOnmyProfile();
		
		logger.log('info', 'Click on Profile');
		
		browser.sleep(3000);
		
		changepwdobj.clickonchangepassword();
		
		browser.sleep(2000);
		
		changepwdobj.entercuurentpwd("test");
		
		browser.sleep(2000);
		
		changepwdobj.enternewpassword("test1");
		
		browser.sleep(2000);
		
		changepwdobj.enternconfirmpwd("test1");
		
		 changepwdobj.clickonsavebtn();
		
		browser.sleep(6000);
		
	
		
	});
	
	
});