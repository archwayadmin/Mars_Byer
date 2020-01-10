var loginPageObj = require('./../../pageobjects/LoginPage/LoginPage.js');

var page = require('./../../pageobjects/BasePage/BasePage.js');

var OR = require('./../../json/objects.json');

var tdata = require('./../../json/login.json');

var logger= require('./../../log');



describe("Create Account", function() {
	
	
	
	it("User can create Account successfully", function() {
		
		element(by.xpath("//button[@class='btn btn-link']")).click();
		
		browser.sleep(3000);
		
		element(by.xpath("//input[@id='Username']")).sendKeys("");
		
		element(by.xpath("//input[@id='Password']")).sendKeys("");
			
		element(by.xpath("//input[@id='ConfirmPassword']")).sendKeys("");
		
		element(by.xpath("//input[@id='FirstName']")).sendKeys("");
		
		element(by.xpath("//input[@id='LastName']")).sendKeys("");
		
		element(by.xpath("//input[@id='Phone']")).sendKeys("");
		
		element(by.xpath("//input[@id='Email']")).sendKeys("");
		
		
		
		
		
	});
	
	
});