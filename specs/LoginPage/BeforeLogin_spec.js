
var loginPageObj = require('./../../pageobjects/LoginPage/LoginPage.js');

var page = require('./../../pageobjects/BasePage/BasePage.js'); 

var OR= require('./../../json/objects.json');


describe("verify links available on login page", function() {
	
	
	it("all links should work properly", function() {
		
		
		browser.get("https://archway-premiernutrition-qa.azurewebsites.net/login");
		
		loginPageObj.getAllLinks();
		
		
	});
	
});