var checkoutobj = require('./../../pageobjects/Checkout/Checkout.js');

var multipleaddobj = require('./../../pageobjects/Address/MultipleAddress.js');

var Additemobj = require('./../../pageobjects/AddItem/AddItem.js');

var tdata = require('./../../json/Checkout.json');

var logger = require('./../../log');

var logger = require('./../../log');

var selectwraper = require('./../../Select-Wrapper.js');

var myselect = new selectwraper(by.xpath("//select[@id='Country']"));

var myselect1 = new selectwraper(by.xpath("//select[@id='State']"));

var myselect2 = new selectwraper(by.xpath("//select[@id='ShippingMethod']"));


describe(" Verify Mutiple Address", function() {
	
	
	
	it("User should be able to select multiple Address", function() {
		
	
   	     Additemobj.clickOnCheckout();
   	     
   	  logger.log('info','Click Checkout');
   	     
   	     browser.sleep(4000);
		
		multipleaddobj.clickonmultiselectBtn();
		
		logger.log('info','Click on Multiselect Address');
		
		  browser.sleep(3000);
		
		//multipleaddobj.entervalueInSearch("PNC");
		
		
		
		// below are optional, either check address OR check safter search
		
		//multipleaddobj.clickOnAddressChkbox();
		
		//browser.sleep(2000);
		
		// click on first checkbox
		
		multipleaddobj.clickonafterSearchChkbox();
		
		logger.log('info','Click on first item ');
		
		browser.sleep(2000);
		
		
		multipleaddobj.clickOnAdd();
		
		logger.log('info','Click on add button');
		
		browser.sleep(2000);
		
		checkoutobj.clickOnSave();
		
		logger.log('info','Click on save ');
		
		browser.sleep(2000);
		
		checkoutobj.clickOnSave();
		
		logger.log('info','Click on save ');
		
		  browser.sleep(2000);
		
		  myselect2.selectByText(tdata.testdata.selectShippingMethod);
		  
		  logger.log('info','Select shipping Method');
		
		  browser.sleep(2000);
		
		checkoutobj.clickonsaveAndContinue();
		
		logger.log('info','Click save and continue');
		
		browser.sleep(2000);
		
		checkoutobj.enterComments(tdata.testdata.comments);
		
		
		browser.sleep(2000);
		
		logger.log('info','Enter Comments');
		
		checkoutobj.enterdeliveryInstruction(tdata.testdata.deliveryInstruction);
		
		
		browser.sleep(2000);
		
		logger.log('info','Enter dummy instruction');
		
		checkoutobj.enterwarehouseInstruction(tdata.testdata.warehouseInstruction); 
		
		logger.log('info','Enter warehouse instruction');
		
		browser.sleep(2000);
		
		checkoutobj.clickOnsubmitOrder();
		
		logger.log('info','Click on Submit order');
		
		browser.sleep(20000);
		
	
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
   	 
   	 it("Order Number Text is present when order is confirmed", function() {
   		 
   		var ordenumtext= checkoutobj.getordernum();
   		
   		ordenumtext.getText().then(function(text){
   			
   			console.log("order number text is:"+text);
   			
   			expect(ordenumtext.isDisplayed()).toBeTruthy();
   			
   			expect(ordenumtext).toContain(tdata.testdata.ordernumbertext);
   			
   			
   		});
   		
   		
   	 	
   	 });
   	 
   	 
   	 
   	 it("Date Submitted Text is present when order is confirmed", function() {
   		 
   		 
   		 
   		 
   		 var datesubtext=checkoutobj.getdatesbmt();
    		
   		 datesubtext.getText().then(function(text){
    			
    			console.log("order number text is:"+text);
    			
    			expect(datesubtext.isDisplayed()).toBeTruthy();
    			
    			expect(datesubtext).toContain(tdata.testdata.datesubmittesText);
   		 
    		 }); 
   		 
    	 	
   	 });
   	 
   	 
   	 
	 it(" Verify Date Submitted  is the current date when order is confirmed", function() {
   		 
   		 var ordersubmitdate= checkoutobj.getactuldate();
   		 
   		var currentdate= checkoutobj.currentdate();
   		
   		
   		// verifying that order submit date is the date order submitted/placed
   		
    		expect(ordersubmitdate.getText()).toBe(currentdate);
   		
   		 
    		 }); 
   		 
    	 	
   	 });
   	 
   	 
   	 
   	 it("Shipping Method Text is present when order is confirmed", function() {
   		 
   	 
   		 var shippingmethodtext= checkoutobj.getshipplabel();
   		 
   		 shippingmethodtext.getText().then(function(text){
    			
    			console.log("Shipping Method text is:"+text);
    			
    			expect(text).toContain(tdata.testdata.ShippingMethodText);
   		 
   		 
    		 });
    	 	
   	 });
   	 
   	 
   	 it(" vrify Shipping Method  is same that user has selected while palcing the order", function() {
   		 
       	 
   		 var shippingmethodtype= checkoutobj.getshippmethodval();
    		
   		 
   		 shippingmethodtype.getText().then(function(text){
   			 
   			 console.log("shipping method is:"+text);
   			 
   			 expect(text).toContain(tdata.testdata.selectShippingMethod);
   			 
   			 
   			 
   		 });
   		
   		 
 
   		 
    		 });
    	 	
   	
   	 
 
   	 
   	 
   	 it("Subtotal Text is present when order is confirmed", function() {
   		 
   		 
   		 
   		 
   		 var subtotaltext= checkoutobj.getsubtotal();
     		
   		 subtotaltext.getText().then(function(text){
     			
     			console.log("order number text is:"+text);
     			
     			expect(text).toContain(tdata.testdata.SubtotalText);
    		 
    		 
     		 });
   		 
   		 
   		 
   		 
   		  
    	 	
   	 });
   	 
   	 
   	 
   	 
	 it(" verify Subtotal value is correct", function() {
   		 
   		var num1,num2; 
   		 
   	var subtotalval=checkoutobj.getsubtotal();
   	
   	subtotalval.getText().then(function(num1){
   		
   		
   		console.log("subtotalval is:"+num1.replace(/[^0-9\.]+/g,""));
   		
   		
 
   		});
   	
   	
   	
         var ordertotal=checkoutobj.getordertotalval();
		
         ordertotal.getText().then(function(num2){
			
			console.log("ordertotal is :"+num2.replace(/[^0-9\.]+/g,""));
   		
   
   
   	});
   	
   	
   	
   	expect(num1).toBe(num2);
   	
    	 	
 
	
});
	 
	 
	 
	 it(" verify print option", function() {
		 
		var print= checkoutobj.getprinttext();
		
		expect(print.isPresent()).toBeTruthy();
		
		expect(print.isEnabled()).toBeTruthy();
		 
		 
		 
	 	
	 });
	
	
	
});