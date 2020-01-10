
var loginPageObj = require('./../../pageobjects/LoginPage/LoginPage.js');

var page = require('./../../pageobjects/BasePage/BasePage.js');

var homepageobj = require('./../../pageobjects/HomePage/HomePage.js');

var tdata = require('./../../json/login.json');

var UserMenuobj = require('./../../pageobjects/UserMenu/UserMenu.js');

//var dataReaderObj=require('./../../utils/DataReader.js');

var logger= require('./../../log');







describe("Log out ", function() {
	
	
	it("User should log out successfully from application", function() {
		
		// click on usercircle icon
		
    var usercir	=UserMenuobj.getuserCircleElement();
		
		usercir.click();
		
		browser.sleep(4000);
		
		 var userlogout=UserMenuobj.getlogoutElement();
		 
		 userlogout.click();
		 
	
		
		
	});
	
	it("verify successfull Logout", function() {
		
       var logout=tdata.testdata.logouturl;
		 
		 expect(browser.getCurrentUrl()).toMatch(logout);
		 
		 expect(browser.getCurrentUrl()).toContain(tdata.testdata.logout);
		
	});
	
	
	
});