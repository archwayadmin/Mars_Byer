var page = require('./../../pageobjects/BasePage/BasePage.js');

var Additemobj = require('./../../pageobjects/AddItem/AddItem.js');

var homepageobj = require('./../../pageobjects/HomePage/HomePage.js');

var tdata = require('./../../json/AddItem.json');

var logger = require('./../../log');

var selectwraper = require('./../../Select-Wrapper.js');

var myselect = new selectwraper(by.xpath("//div[4]/display-filter[1]/form[1]/div[1]/select[1]']"));


describe("Add Item by Grid", function() {
	
	
	
beforeEach(function() {
		

        originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 200000;
     });

     afterEach(function() {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
     });
     
     browser.ignoreSynchronization = true;
	
	

	it("user should add Item from Grid", function() {
		
		 browser.sleep(3000);
		 
		 homepageobj.browseProducts();
		 
		 logger.log('info','Click on Browse Product');
	  		
		
		 browser.sleep(5000);
		 
		 Additemobj.clickonviewallprodct();
		 
		 logger.log('info','Click on View All product');
	  		
	        
         browser.sleep(3000);
    	 
    	 // click on Grid 
    	 
         Additemobj.clickongridlink();
         
         logger.log('info','Click on Grid');
   		
         
    	 browser.sleep(3000);
    
    
 
		
	});
	
	  it("verify presence Grid icon ", function() {
	    	 
	    	 
	    	 var gridlink= Additemobj.getgridlinktext();
	      	
	      	expect(gridlink.isDisplayed()).toBeTruthy();
	      	
	      	expect(gridlink.isPresent()).toBeTruthy();
	      	
	      	gridlink.getText().then(function(text){
	      		
	      		
	      	console.log("Grid text is :"+text);
	      	
	      	expect(text).toContain(tdata.AddItemByGrid.Gridtext);
	      		
	      	});
	       	
	       });
    //Pagination logic and verify items count on per page
	
	   xit("Verify pagination feature", function() {
	    	
	    	

	        //getting the size of the pagination
	          
	        var getPaginationsize = element.all(by.css("div > ngb-pagination > ul > li"));
	        
	        
	        getPaginationsize.count().then(function (pagination) {
	      	  
	            if (pagination > 0) {

	                for (var i = 1; i < pagination-1; i++) {
	              	  
	              	  browser.executeScript('window.scrollTo(0,document.body.scrollHeight)');
	              	  
	              	  browser.sleep(5000);
	              	  
	              	  
	                    getPaginationsize.get(i).click();
	                  
	                     element.all(by.css("div.row.mb-2:nth-child(2) div.col-12 > p.card-text.text-muted")).count().then(function(text){
	                  	
	                  	console.log("total count:"+text);
	                  	
	                  	
	                  });
	                  
	                  browser.executeScript('window.scrollTo(0,document.body.scrollHeight)');
	           	   
	           	   browser.sleep(5000);
	           	   
	           	   
	                }
	            } else {
	                console.log('Pagination not exists');
	            }
	        });
	        
	        
	     
	        
	        // capturing the latest url when click on last page
	        browser.getCurrentUrl().then(function(text){
	  		  
	  		   console.log(text);
	  		   
	  		   expect(text).toBeTruthy();
	  		   
	  		  browser.sleep(5000);
	  		  
	  		  element(by.xpath("//div[@class='m-0 mt-1 text-center']")).getText().then(function(text){
	  			  
	  			 console.log(text);
	  			  
	  		  });
	     	   
	  		       
	      
	  		  
	        });
	        
	    });
	        
	
	
	
	it("Click on Product/veryFirstImage Icon", function() {
		
		
		// click on very first image present in Grid
		
		Additemobj.clickonGridimage1();
    	
	  
	    browser.sleep(3000);
		
		
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
	 	   
	 	   
	 	  

	
	
	
	it("Enter Quantityand click to add to cart button", function() {
		   
		   
		Additemobj.qtyfield(tdata.AddItemByGrid.qtyforgrid) 
		
		 logger.log('info','Enter qty');
		
		// dummy data
		
		// click on Add to Cart
		
		 browser.sleep(6000);
		
		 Additemobj.clickaddtocarticon();
		 
		 logger.log('info','Click on Add to Cart Button');
		
		 browser.sleep(6000);
		
	   });
	   
	   
	   it("click on cart icon and click on  CheckOut", function() {
		   
		   
		   // click on cart icon
		   Additemobj.clickOnCartIcon();
		   
		   logger.log('info','Click on Cart Icon');
		   
	  	    browser.sleep(5000);
	  	    
	  	    // click on checkout
		 
	  	 
	   	
	   });
	   
	
	  
	 
	    	   
	    	
	    	        
	    	       
	    	   
	
	
	
});
