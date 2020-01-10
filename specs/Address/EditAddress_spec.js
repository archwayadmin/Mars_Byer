var page = require('./../../pageobjects/BasePage/BasePage.js');

var addressobj = require('./../../pageobjects/Address/EditAddress.js');

var usermenuobj = require('./../../pageobjects/UserMenu/UserMenu.js');

var OR = require('./../../json/objects.json');

var logger = require('./../../log');

var selectwraper = require('./../../Select-Wrapper.js');

var myselect = new selectwraper(by.xpath("//select[@id='Country']"));


describe("Verify the Buyer Edit Address and save button functionality", function() {
	
	beforeEach(function() {
        originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 200000;
     });

     afterEach(function() {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
     });
     
     browser.ignoreSynchronization = true;
	
     var ele1=usermenuobj.addressesElement();
		
		var ele=usermenuobj.userCircleElement();
		
		var addele=addressobj.addressMessage();
	
	
	it("Veriy if Address icon is present ", function() {
		
		
		
		ele.isPresent().then(function(result){
			
			if(result){
				
				usermenuobj.clickOnUserCircle();
				
				browser.sleep(7000);
				
				usermenuobj.clickOnaddresses();
				
				browser.sleep(7000);
				
				//expect(ele1.isPresent()).toBeTruthy(false);

			}
			
			
		});
		
		
	
		
		it("verify searching for user in address text box", function() {
			
		
			console.log("df");
			//usermenuobj.clickOnaddresses();
		
			
			addressobj.search("AAA");
			
			browser.sleep(7000);
			
			expect(addele.isPresent()).toBeTruthy();
			
			
			
		});
		
		
		
		

		
		
		
	});
	
	
	
	
	
});