
var page = require('./../../pageobjects/BasePage/BasePage.js');

var checkoutobj = require('./../../pageobjects/Checkout/Checkout.js');

var Additemobj = require('./../../pageobjects/AddItem/AddItem.js');

var tdata = require('./../../json/Checkout.json');

var logger = require('./../../log');

var selectwraper = require('./../../Select-Wrapper.js');

var myselect = new selectwraper(by.xpath("//select[@id='Country']"));

var myselect1 = new selectwraper(by.xpath("//select[@id='State']"));

var myselect2 = new selectwraper(by.xpath("//select[@id='ShippingMethod']"));

describe("CheckOut Verfication", function() {
	
	beforeEach(function() {
        originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 200000;
     });

     afterEach(function() {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
     });
     
     browser.ignoreSynchronization = true;
     
     
     
     
    
     
     
     
    // verify some content present on checkout screen
     
   
   
     
     it("checkout case for One time Address", function() {
    	 
   		
    	 Additemobj.clickOnCheckout();
    	 
    	 logger.log('info','Click on checkout');
    	 
    	 
		   browser.sleep(5000);
    	 
    	 
    	 //checkoutobj.clickOnEnterOneTimeAddress();
    	 
    	 logger.log('info','Click on One time Address');
    	 
    	
    	 
    	 
    	/* myselect.selectByText(tdata.testdata.selectcountry);
    	 
    	 logger.log('info','select country');
    	 
    	 browser.sleep(2000);
    	 
    	 
    	 checkoutobj.enterFirstName(tdata.testdata.firstname);
    	 
    	 logger.log('info','Enter first namet');
    	 
    	 browser.sleep(2000);
    	 
    	 checkoutobj.enterLastName(tdata.testdata.LastName);
    	 
    	 logger.log('info','Enter Last Name');
    	 
    	 browser.sleep(2000);
    	 
    	 checkoutobj.entercompanyName(tdata.testdata.companyName);
    	 
    	 logger.log('info','Enter company Name');
    	 
    	 browser.sleep(2000);
    	 
    	checkoutobj.enteraddress1Name(tdata.testdata.address1);
    	
    	logger.log('info','Enter Address1');
    		
    	browser.sleep(2000);
    	
    	checkoutobj.enteraddress2Name(tdata.testdata.address2);
    	
    	logger.log('info','Enter Address2');
    	
    	browser.sleep(2000);
    		
    		
    	checkoutobj.enterCityName(tdata.testdata.CityName);
    	
    	logger.log('info','Enter city Name');
    	
    	browser.sleep(3000);
    		
    	myselect1.selectByText(tdata.testdata.selectstate);
    	
    	logger.log('info','Select State');
    		
    	browser.sleep(2000);  
    	
    		checkoutobj.enterzipCodeName(tdata.testdata.zipCod);
    		
    		logger.log('info','Enter zipcodet');
    		
    		browser.sleep(2000);
    		
    		checkoutobj.enterphoneNumberName(tdata.testdata.phoneNumber);
    		
    		logger.log('info','Enter Phone');
    		
    		browser.sleep(2000);
    		
    		checkoutobj.clickOnSave();
    		
    		logger.log('info','Click on Save');
    		
    		browser.sleep(6000);
    		
    		checkoutobj.clickOnSave();
    		
    		logger.log('info','Click on save and continue');
    		
    		// selecting the shipping method
    		
    		myselect2.selectByText(tdata.testdata.selectShippingMethod);
    		
    		logger.log('info','Select shipping Method');
    		
    		browser.sleep(3000);
    		
    		checkoutobj.clickonsaveAndContinue();
    		
    		logger.log('info','Click on Save and continue');
    		
    		checkoutobj.enterComments(tdata.testdata.comments);
    		
    		logger.log('info','Enter Comments');
    		
    		checkoutobj.enterdeliveryInstruction(tdata.testdata.deliveryInstruction);
    		
    		logger.log('info','Enter dummy instruction');
    		
    		checkoutobj.enterwarehouseInstruction(tdata.testdata.warehouseInstruction); 
    		
    		logger.log('info','Enter wareHouse inst..');
    		
    		// verification of submit btn presence and is enabled
    		
    		var subtbn=checkoutobj.getsubmitOrderbtn();
    		
    		expect(subtbn.isDisplayed()).toBeTruthy();
    		
    		expect(subtbn.isPresent()).toBeTruthy();
    		
    		expect(subtbn.isEnabled()).toBeTruthy();
    		
    	// click on submit btn to submit the order
    		
    		checkoutobj.clickOnsubmitOrder();
    		
    		logger.log('info','Click on Submit order');
    		
    		//button[@class='btn btn-primary mt-4']*/
     	
     });
    	 
   it("checkout process", function() {
	   
	   checkoutobj.clickonsaveAndContinue();
	   
	   browser.sleep(3000);
	   
	   checkoutobj.clickOnsubmitOrder();
	   
	   browser.sleep(10000);
		
   
   	
   });
     
     
    
     
     it("Verify order has submitted", function() {
    	 
    	 
        var ordersubttext=checkoutobj.getordersubttext();
    
    	   ordersubttext.getText().then(function(text){
		   
		  expect(text).toContain(tdata.testdata.OrderSubmittedText) ;
		      
		   
	   });
    	   
     });
	   
	   
 
 
  
     it("Verify submited order Number ", function() {
    	 
    	 
    	 browser.getCurrentUrl().then(function(text){
    		 
    		 console.log("order submitted url is:"+text);
    		 
    		 var ordernum= checkoutobj.getordernumber();
    		 
    		 var actual_orderNumber=ordernum.getText();
    		 
    		 // priting the product number on console 
    		
    			 
    			 expect(text).toContain(actual_orderNumber);
    			 
    		 
    	 });
    	 
    	 it("Order ID Number Text is present when order is confirmed", function() {
    		 
    		var ordenumtext= checkoutobj.getordernum();
    		
    		ordenumtext.getText().then(function(text){
    			
    			console.log("order number text is:"+text);
    			
    			expect(ordenumtext.isDisplayed()).toBeTruthy();
    			
    			expect(ordenumtext).toContain(tdata.testdata.ordernumbertext);
    			
    			
    		});
    		
    		
    		 
    		 
    		 
    	 	
    	 });
    	 
    	 
    	 
    	 xit("Date Submitted Text is present when order is confirmed", function() {
    		 
    		 
    		 
    		 
    		 var datesubtext=checkoutobj.getdatesbmt();
     		
    		 datesubtext.getText().then(function(text){
     			
     			console.log("order number text is:"+text);
     			
     			expect(datesubtext.isDisplayed()).toBeTruthy();
     			
     			expect(datesubtext).toContain(tdata.testdata.datesubmittesText);
    		 
     		 }); 
    		 
     	 	
    	 });
    	 
    	 
    	 
	 xit(" Verify Date Submitted  is the current date when order is confirmed", function() {
    		 
    		 var ordersubmitdate= checkoutobj.getactuldate();
    		 
    		var currentdate= checkoutobj.currentdate();
    		
    		
    		// verifying that order submit date is the date order submitted/placed
    		
     		expect(ordersubmitdate.getText()).toBe(currentdate);
    		
    		 
     		 }); 
    		 
     	 	
    	 });
    	 
    	 
    	 
    	 xit("Shipping Method Text is present when order is confirmed", function() {
    		 
    	 
    		 var shippingmethodtext= checkoutobj.getshipplabel();
    		 
    		 shippingmethodtext.getText().then(function(text){
     			
     			console.log("Shipping Method text is:"+text);
     			
     			expect(text).toContain(tdata.testdata.ShippingMethodText);
    		 
    		 
     		 });
     	 	
    	 });
    	 
    	 
    	 xit(" vrify Shipping Method  is same that user has selected while palcing the order", function() {
    		 
        	 
    		 var shippingmethodtype= checkoutobj.getshippmethodval();
     		
    		 
    		 shippingmethodtype.getText().then(function(text){
    			 
    			 console.log("shipping method is:"+text);
    			 
    			 expect(text).toContain(tdata.testdata.selectShippingMethod);
    			 
    			 
    			 
    		 });
    		
    		 
    	
    		 
    		 
     		 });
     	 	
    	
    	 
  
    	 
    	 
    	 xit("Subtotal Text is present when order is confirmed", function() {
    		 
    		 
    		 
    		 
    		 var subtotaltext= checkoutobj.getsubtotal();
      		
    		 subtotaltext.getText().then(function(text){
      			
      			console.log("order number text is:"+text);
      			
      			expect(text).toContain(tdata.testdata.SubtotalText);
     		 
     		 
      		 });
    		 
    		 
    		 
    		 
    		  
     	 	
    	 });
    	 
    	 
    	 
    	 
	 xit(" verify Subtotal value is correct", function() {
    		 
    		var num1,num2; 
    		 
    	var subtotalval=checkoutobj.getsubtotal();
    	
    	subtotalval.getText().then(function(num1){
    		
    		
    		//console.log("subtotalval is:"+num1.replace(/[^0-9\.]+/g,""));
    		
    		
  
    		});
    	
    	
    	
          var ordertotal=checkoutobj.getordertotalval();
		
          ordertotal.getText().then(function(num2){
			
			//console.log("ordertotal is :"+num2.replace(/[^0-9\.]+/g,""));
    		
    
    
    	});
    	
    	
    	
    	expect(num1).toBe(num2);
    	
     	 	
    	
    	 
    
    
	
});
	 
	 
	 
	 xit(" verify print option", function() {
		 
		var print= checkoutobj.getprinttext();
		
		expect(print.isPresent()).toBeTruthy();
		
		expect(print.isEnabled()).toBeTruthy();
		 
		 
		 
	 	
	 });
	 
});
