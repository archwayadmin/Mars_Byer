

var page = require('./../../pageobjects/BasePage/BasePage.js');

var MYprofileobj = require('./../../pageobjects/MyProfile/MyProfile.js');

var UserMenuobj = require('./../../pageobjects/UserMenu/UserMenu.js');

var tdata = require('./../../json/MyProfile.json');

var logger = require('./../../log');

describe("User Profile updation", function() {
	

	
	beforeEach(function() {
        originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 200000;
     });

     afterEach(function() {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
     });
     
     browser.ignoreSynchronization = true;
	
	
	it("user should be able to click on  profile successfully", function() {
		
		
		UserMenuobj.clickOnUserCircle();
		
		logger.log('info', 'Click on Usercircle');
		
		browser.sleep(4000);
		
		UserMenuobj.clickOnmyProfile();
		
		logger.log('info', 'Click on Profile');
		
		browser.sleep(4000);
		
		
	
		
	});
	
	
	

	
	it("user should be able to update   profile successfully", function() {
		
	
		
          MYprofileobj.enterfname(tdata.testdata.FirstName);
          
       
          
          browser.sleep(8000);
		
		
		MYprofileobj.entersname(tdata.testdata.LastName);
		
		browser.sleep(8000);
		
		
		MYprofileobj.enteremPhonenumber(tdata.testdata.PhoneNumber);
		
		
	    MYprofileobj.clickOnSave();
	    
	    browser.sleep(13000);
	    
	    
	    logger.log('info', 'Click on save');
		
		//browser.sleep(6000);
		
	
		
	});
	
	
	it("Verify if user is on my profile page", function() {
		
		expect(browser.getCurrentUrl()).toContain("profile");
		
		
	});
	
	
    it(' Verify if firstname & lastname updated sucessfully', function () {
    	
    
        expect(MYprofileobj.getfirsname().getAttribute("value")).toContain(tdata.testdata.FirstName);
        
        
        expect(MYprofileobj.getlname().getAttribute("value")).toContain(tdata.testdata.LastName);
        
  
  	  
});
    

    
	
    
    




	
});