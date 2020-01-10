var page = require('./../../pageobjects/BasePage/BasePage.js');

describe("home page", function() {


	it("verify links", function() {
		
		browser.get("https://archway-premiernutrition-seller-qa.azurewebsites.net/login");
		

		browser.driver.manage().window().maximize();	
		

		var ele=element(by.xpath("//input[@id='username']"));
		
		browser.
		
	
		ele.sendKeys("test");
		

		element(by.xpath("//input[@id='password']")).sendKeys("tmpadmin@123");
		

		element(by.xpath("//button[@id='submitBtn']")).click();
		
		
		element.all(by.tagName("a")).getText().then(function(text){
			
			for(var i=0; i<text.length; i++){
				
				
				console.log(text[i]);
			}
			
			
			
			
		});
		
		

	});

	it("verify title", function() {
		
		browser.getTitle().then(function(title){
			
			if(title){
				
				
				console.log("test case pass");
			}
			
			else{
				
				console.log("Test case fail");
			}
			
		});
		

	});

	it("verify ", function() {

	});


	
});