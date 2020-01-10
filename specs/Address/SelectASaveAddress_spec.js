var checkoutobj = require('./../../pageobjects/Checkout/Checkout.js');

var selectasaveadddobj = require('./../../pageobjects/Address/SelectASaveAddress.js');

var OR = require('./../../json/objects.json');

var logger = require('./../../log');




describe("Select A SaveAddress", function() {
	
	
	it("user should be able to select s a save address", function() {
		
	
		selectasaveadddobj.clickOnselectsaveaddrss();
		
		browser.sleep(2000);
		
		selectasaveadddobj.searchAddress("test");
		
		browser.sleep(2000);
		
		selectasaveadddobj.clickOnselectlink();
		
		browser.sleep(2000);
		
		
		
		
	});
	
	
});