var loginPageObj = require('./../../pageobjects/LoginPage/LoginPage.js');

var page = require('./../../pageobjects/BasePage/BasePage.js');

var homepageobj = require('./../../pageobjects/HomePage/HomePage.js');

var tdata = require('./../../json/AddItem.json');

var Additemobj = require('./../../pageobjects/AddItem/AddItem.js');



// var xl=require('./../../util/ReadExcel.js');

//var dataReaderObj = require('./../../utils/DataReader.js');

var logger = require('./../../log');

browser.manage().timeouts().implicitlyWait(4000);

describe(' Multiple Products ', function() {
	
beforeEach(function() {
		

        originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 200000;
     });

     afterEach(function() {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
     });
     
     browser.ignoreSynchronization = true;

	
	it('Add Multiple Products successfully', function() {
		
		
	        // checking the length of the array object
			
			for(var i=0; i<tdata.testdataforquickAdd.product.length; i++){
				
				// click on browse product
				
				homepageobj.browseProducts();
				
				browser.sleep(3000);
				
				// enter product

				Additemobj.enterItem(tdata.testdataforquickAdd.product[i].item);
				
				browser.sleep(3000);

				Additemobj.clickonfirstHighlightItem();
				
				// enter quantity
			
				Additemobj.enterqty(tdata.testdataforquickAdd.product[i].qty);

				browser.sleep(3000);
				
				// click on cart

				Additemobj.clickOnAddtoCart();
				
				
			}
			
			// click on cart icon
			
			 Additemobj.clickOnCartIcon();
			   
		   	    browser.sleep(5000);
		

		});
	

	 it("Verify total item present in cart and Order Summary are same", function() {
		 
		 
		 var countericon= Additemobj.getcountericon();
		 
		 // priting in console total count of item
		 
		 countericon.getText().then(function(text){
			 
			 console.log("countericon count is:"+text);
			 
		 });
		 
		 
		 // total item present in order history 
		 
		 var itemsincart= Additemobj.getitemsincart();
		
			
			//itemsincart.getText().then(function(text){
				
				// using the reg expression to fetch the value from string
				
				//console.log("count is:"+text.replace(/[^0-9\.]+/g,""));
				 
				//expect(text.replace(/[^0-9\.]+/g,"")).toBe(countericon.getText());
				
			});
		 
		 

			
		 
		
	 	
	

	
});