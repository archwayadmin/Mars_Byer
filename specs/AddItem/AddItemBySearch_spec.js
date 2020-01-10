
var page = require('./../../pageobjects/BasePage/BasePage.js');

var Additemobj = require('./../../pageobjects/AddItem/AddItem.js');

var homepageobj = require('./../../pageobjects/HomePage/HomePage.js');

var tdata = require('./../../json/AddItem.json');

var logger = require('./../../log');

var selectwraper = require('./../../Select-Wrapper.js');

//var myselect = new selectwraper(by.xpath("//div[4]/display-filter[1]/form[1]/div[1]/select[1]']");


describe("Add Item by Search", function() {
	
	
	it("Search Item ", function() {
		
		browser.sleep(4000);
		
		element(by.xpath("//form[@class='ng-valid ng-touched ng-pristine']//input[@id='search-addon']")).sendKeys("643843716341")
		
		
		//Additemobj.searchitem(tdata.AddItemBySearch.searchitem);
		
		
		
	
		
	});
	
	
	        it("Verify Item Id", function() {
	        	
	        	
    	 
	    	var itemid= Additemobj.getitemnumber();
	    	
	    	itemid.getText().then(function(text){
	    		
	    		console.log("Item numbe is:"+text);
	    		
	    		expect(text).toBe(tdata.AddItemBySearch.searchitem);//searching the same item
	    		
	    	});
	    	
	        });
	
	
	
	
	 it("Verify Heart Icon", function() {
    	 
    	 
	    	var hearticon= Additemobj.gethearticon();
	     	
	    	expect(hearticon.isDisplayed()).toBeTruthy();
	     });
	 
	 
	 
		it("Click on Product/veryFirstImage Icon", function() {
			
			
			// click on very first image present in Grid
			
			Additemobj.clickOnSearchfirstimage();
	    	
		  
		    browser.sleep(3000);
			
			
		});
	     
	
	
	
	 it("TC_004:Verify Add to Cart button is present on the page", function() {
			
			
			let addcartbtn=	Additemobj.addTocartButn();
			
			expect(addcartbtn.isPresent()).toBeTruthy();
				
				
			
			});
	
	
	
	
	
	  it("Verifying the counter ", function() {
		  
		var countericon=  Additemobj.getcountericon();
	    	 
		countericon.getText().then(function(count){
	       	  
	       	  console.log(count);
	       	  
	       	  //expect(count).toBe(2);// dummat data, counter should be equal to entered quantity
	       	  
	         });
	     	
	     });
	  
	  
	  it("verify UOM element of product description", function() {
			 
			 var uom= Additemobj.getuom();
			 
			 expect(uom.isDisplayed()).toBeTruthy();
			 
			 expect(uom.isPresent()).toBeTruthy();
			 
		     
			 
		 	
		 });


		it("verify Status  of product description", function() {
			 
		var status= Additemobj.getstatus();
			 
			 expect(status.isDisplayed()).toBeTruthy();
			 
			 expect(status.isPresent()).toBeTruthy();
		  	
		 });


		 
		it("verify Min Qty  product description", function() {
			 
		var qtychk= Additemobj.getqtychk();
			 
			 expect(qtychk.isDisplayed()).toBeTruthy();
			 
			 expect(qtychk.isPresent()).toBeTruthy();
		  	
		 });


		 
		it("verify Max Order Limit of product description", function() {
			 
		var maxorderqty=Additemobj.getmaxorderqty();
			 
			 expect(maxorderqty.isDisplayed()).toBeTruthy();
			 
			 expect(maxorderqty.isPresent()).toBeTruthy();
		  	
		 });


		 
		it("verify On Hand Qty of product description", function() {
			 
		var onhandqty= Additemobj.getonhandqty();
			 
			 expect(onhandqty.isDisplayed()).toBeTruthy();
			 
			 expect(onhandqty.isPresent()).toBeTruthy();
		  	
		 });
		 

		 
		 

		 
		it("verify Effective Date of product description", function() {
			 
		 	       var effdate= Additemobj.geteffdate();
		 	    	 
		 	    	 expect(effdate.isDisplayed()).toBeTruthy();
		 	    	 
		 	    	 expect(effdate.isPresent()).toBeTruthy();
		 	      	
		 	     });



		 	     
		 	    it("verify Expiry Date of product description", function() {
		 	    	 
		 	     var expdate= Additemobj.getexpdate();
		 	    	 
		 	    	 expect(expdate.isDisplayed()).toBeTruthy();
		 	    	 
		 	    	 expect(expdate.isPresent()).toBeTruthy();
		 	      	
		 	     });
		 	    
		 	    
		 	    
		 	    
		 	     
		 	   it("verify Price  of product description", function() {
		 	    	 
		 	var prodctdesc= Additemobj.getprodctdesc();
		 	    	 
		 	    	 expect(prodctdesc.isDisplayed()).toBeTruthy();
		 	    	 
		 	    	 expect(prodctdesc.isPresent()).toBeTruthy();
		 	      	
		 	     });
		 	   

	
	
	
	
	 
	 it("TC_004:Verify Add to Cart button is present on the page", function() {
			
			
			let addcartbtn=	Additemobj.addTocartButn();
			
			expect(addcartbtn.isPresent()).toBeTruthy();
			
			Additemobj.clickOnAddBTN();
				
				
			
	});
	 
	 

		it("Enter Quantity and click to add to cart button", function() {
			   
			   
			Additemobj.qtyfield(tdata.AddItemBySearch.qtyforsearch) 	// dummy data
			
			// click on Add to Cart
			
			 browser.sleep(6000);
			
			 Additemobj.clickaddtocarticon();
			
			 browser.sleep(6000);
			
		   });
		   
		   
		   it("click on cart icon and click on  CheckOut", function() {
			   
			   
			   // click on cart icon
			   Additemobj.clickOnCartIcon();
			   
		  	    browser.sleep(5000);
		  	    
		  	    // click on checkout
			 
		  	  Additemobj.clickOnCheckout();
		 		
			     browser.sleep(5000);
		   	
		   });
	 
	 
	 
	 xit("Verify Error Message if Qty<1 or zero", function() {
		 
		 
		var qtyerrormessge= element(by.xpath("//div[@id='toast-container']"));
		
		expect(qtyerrormessge.isDisplayed()).toBeTruthy();
		
		qtyerrormessge.getText().then(function(text){
			
			expect(text).toContain("Please enter a quantitity");
			
		});
		
	 	
	 });
	  
	
  });
