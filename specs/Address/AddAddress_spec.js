var page = require('./../../pageobjects/BasePage/BasePage.js');

var addressobj = require('./../../pageobjects/Address/EditAddress.js');

var usermenuobj = require('./../../pageobjects/UserMenu/UserMenu.js');

var tdata = require('./../../json/Address.json');

var OR = require('./../../json/objects.json');

var logger = require('./../../log');

var usermenuobj = require('./../../pageobjects/UserMenu/UserMenu.js');

var selectwraper = require('./../../Select-Wrapper.js');

var myselect = new selectwraper(by.xpath("//select[@id='Country']"));

var myselect1 = new selectwraper(by.xpath("//select[@id='State']"));


describe('Verify user can update  New Address', function () {
	
	 beforeEach(function() {
	        originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
	        jasmine.DEFAULT_TIMEOUT_INTERVAL = 200000;
	    });

	    afterEach(function() {
	      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
	    });
	    
	    browser.ignoreSynchronization = true;
	    
	   
	
	    
	    
	 it("Verify if user can create a New Address", function() {
		 
		 
		  usermenuobj.clickOnUserCircle();
			
			browser.sleep(5000);
			
			usermenuobj.clickOnaddresses();
			
			
			browser.sleep(5000);
			
			addressobj.clickOnAddAddress();
			
			browser.sleep(4000);
			
			myselect.selectByText("Canada ");
			
			browser.sleep(2000);
			
			addressobj.enterFirsName("Test");
			
			browser.sleep(2000);
			
			addressobj.enterLastName("test");
			
			browser.sleep(2000);
			
			addressobj.enterCompanyName(tdata.testdata.companyName);
			
			
			addressobj.enterStreet1Name("test1");
			
			
			addressobj.enterStreet2Name("test");
			
			
			//addressobj.enterCityName("test");
			
			
			addressobj.enterCityName("");
			
			
			// checking error ele is present
			
			if(element(by.xpath("//span[contains(text(),'City is required')]")).isPresent()){
				
				console.log("error message present")
				
			}
			else{
				
				cosole.log("not ")
			}
			myselect1.selectByText("Alberta");
			
			
			
			
			addressobj.enterZipcodeName("A1A 1A1");
			
			
			addressobj.enterPhone("1234567899");
			
			
			addressobj.clickOnSaveBtn();
			
			console.log(element(by.css('#abc')).element(by.css('#def')).isPresent());
		
			
	  });
	 
	

	xit(' Verify company  is required', function () {
		
		
		
		var cpmpanymsg= element(by.xpath("//span[contains(text(),'Company name or first name and last name fields ar')]"));

		expect(cpmpanymsg.getText()).toEqual('Company name or first name and last name fields are required');
	});
	

	xit(' Address 1 is required', function () {
		
		
		var addmsg= element(by.xpath("//input[@id='Street1']"));
		
		expect(addmsg.getText()).toEqual('Address 1 is required');

	});
	
	

	xit(' Verify the Mandatory Field Alert : City is required', function () {
		
		   usermenuobj.clickOnUserCircle();
			
			browser.sleep(5000);
			
			usermenuobj.clickOnaddresses();
			
			addressobj.clickOnAddAddress();
			
			addressobj.clickOnSaveBtn(); 
		
		var msg=element(by.xpath("//span[contains(text(),'City is required')]"));
		
		
		expect(msg.getText()).toEqual('City is required');
		

		
	});
	
	
	
	xit(' Verify the Mandatory Field Alert : State is required', function () {
		
		
		var statemsg= element(by.xpath("//select[@id='State']"));
		
		expect(statemsg.getText()).toEqual('State is required');
		
	});	

	xit('Verify the Mandatory Field Alert : Zip Code is required', function () {

		var zipmsg= element(by.xpath("//input[@id='zipCode']"));
		
		expect(zipmsg.getText()).toEqual('Zip Code is required');

	});
	
	
	
	
	

	
	});
	

