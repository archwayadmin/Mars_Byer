var page = require('./../../pageobjects/BasePage/BasePage.js');

var Additemobj = require('./../../pageobjects/AddItem/AddItem.js');

var homepageobj = require('./../../pageobjects/HomePage/HomePage.js');

var tdata = require('./../../json/AddItem.json');


var logger = require('./../../log');

var selectwraper = require('./../../Select-Wrapper.js');

//var myselect = new selectwraper(by.xpath(""));

describe("Add Item to cart by  Quick Add and verify contents present on page ", function() {
	
	
	beforeEach(function() {
		

        originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 200000;
     });

     afterEach(function() {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
     });
     
     browser.ignoreSynchronization = true;
     
     
     
     
     
     
     
     
     it("Quick Add : Enter product and quantity successfully", function() {
    	 
    	// browser.sleep(3000);
    	 
    	 browser.manage().timeouts().implicitlyWait(30000);
    	 
    	 
    	 homepageobj.browseProducts();
    	 
    	 
    	 var  source= element(by.xpath("//button[@class='nav-button']"));

    	 var dest=element(by.xpath("//a[@class='nav-button']"));

    	 browser.driver.actions().dragAndDrop(source, dest).perform();

   
    	 logger.log('info','Click on Browse Product');
  		
		 // browser.sleep(7000);
		  
		  
			
  	});
     
     xit('should pan plots when you click and drag', function() {
    	    var plot0 = element(by.css('.plot > canvas'));
    	    browser.actions()
    	      .mouseMove(plot0, {x: 100, y: 100}) // 100px from left, 100 px from top of plot0
    	      .mouseDown()
    	      .mouseMove({x: 400, y: 0}) // 400px to the right of current location
    	      .perform();
    	  });
     
     
  it("verify Sort option is present on Add To Cart screen ", function() {
     	 
     	 
     	 var sort= Additemobj.getsort();
       	
       	expect(sort.isDisplayed()).toBeTruthy();
       	
       	expect(sort.isPresent()).toBeTruthy();
       	
       	sort.getText().then(function(text){
       		
       		
       	console.log("Sort option is :"+text);
       	
       	expect(text).toContain(tdata.testdataforquickAdd.sortbytext);
       		
       	});
        	
        });
     

    
     
     it("verify Refine By text on Add To Cart screen", function() {
    	 
    	 
    	var refine=  Additemobj.getrefine();
    	
    	expect(refine.isDisplayed()).toBeTruthy();
    	
    	expect(refine.isPresent()).toBeTruthy();
    	
    	refine.getText().then(function(text){
    		
    		
    	console.log("refine text is :"+text);
    	
    	expect(text).toContain(tdata.testdataforquickAdd.refineby);
    		
    	});
     	
     });
     
     
     
     it("verify My Favorites link", function() {
    	 
    	 
     	var myfav= Additemobj.getmyfav();
     	
     	expect(myfav.isDisplayed()).toBeTruthy();
     	
     	expect(myfav.isPresent()).toBeTruthy();
     	
     	expect(myfav.isEnabled()).toBeTruthy();
     	
     	myfav.getText().then(function(text){
     		
     		
     	console.log("myfav link is :"+text);
     	
     	expect(text).toContain(tdata.testdataforquickAdd.myfav);
     		
     	});
      	
      });
      
     
     it("Verify Quick Add Header label text", function() {
    	 
    	 
    var quickaddheadertext=	 Additemobj.getquickaddheadertext();
    	 
    quickaddheadertext.getText().then(function(text){
    	
    	console.log("Head Text value:"+text);
    	
    	expect(quickaddheadertext.isDisplayed()).toBeTruthy();
    	
    	
    });
    
    it("Verify description written below Quick Add Header text", function() {
    	
    var qickadddesc= Additemobj.getqickadddesc();
    	
    qickadddesc.getText().then(function(text){
    	
    	console.log("Description Text is :"+text);
    	
    	expect(qickadddesc.isDisplayed());
    	
    	expect(qickadddesc).toContain(tdata.testdataforquickAdd.quickAddDesc);
    	
    });
    
    
    });
    
    
    
     });
     
  
     
     
 it("Verify lable of item ", function() {
    	 
    	 var itemlable= Additemobj.getitemlabel();
    	 
    	 expect(itemlable.isPresent()).toBeTruthy();
    	 
    	 itemlable.getText().then(function(text){
    		 
    		 expect(text).toContain(tdata.testdataforquickAdd.itemlabel);
    		 
    	 });
    	 
 });
 
 
 
 it("Verify lable of qty ", function() {
	 
	 var qtylabel=Additemobj.getqtylabel();
	 
	 expect(qtylabel.isPresent()).toBeTruthy();
	 
	 qtylabel.getText().then(function(text){
		 
		 expect(text).toContain(tdata.testdataforquickAdd.qtylabel);
		 
	 });
	 
 });
 
 
 it("TC_004:Verify Add to Cart button is present on the page", function() {
		
		
		let addcartbtn=	Additemobj.addTocartButn();
		
		expect(addcartbtn.isPresent()).toBeTruthy();
			
			
		
		});
 
 

 it('Verify Add item and Quantity and click on checkout', function () {
	 
	 browser.manage().timeouts().implicitlyWait(30000);
 	
 
		       
		       // case 1: when item and qty both missing
		       
		       
		       if(tdata.testdataforquickAdd.item=="" && tdata.testdataforquickAdd.qty==""){
		    	   
		    	 Additemobj.enterItem(tdata.testdataforquickAdd.item);
		    	 
		      Additemobj.enterqty(tdata.testdataforquickAdd.qty);
		    	   
		          Additemobj.clickOnAddtoCart();
		          
		          
		    var errormsg= element(by.xpath("//div[@id='toast-container']"));
		    
		 errormsg.getText().then(function(text){
			 
			console.log("error msg is:"+text);
			
			//expect(text.ispr).toBeTruthy();
			
			expect(text).toContain("Item not found");
			 
		 });
		 
		 
		    	   
		    	  
		   console.log("error prodct not found, both item and qty is missing");
		    	   
		    	   
		    	    
		    	   
		       }
		       
		    // case 2: when item is there  and qty is missing
		       
		       else if(tdata.testdataforquickAdd.item!="" && tdata.testdataforquickAdd.qty==""){
		    	   
		    	 Additemobj.enterItem(tdata.testdataforquickAdd.item);
		    	 
		    	browser.sleep(3000);
		    	 
		    	Additemobj.clickonfirstHighlightItem();
		    	
		    	browser.sleep(3000);
 			
		    	Additemobj.enterqty(tdata.testdataforquickAdd.qty);
		    	
		     Additemobj.clickOnAddtoCart();
		     
		          browser.sleep(8000);
		    	
		   
          Additemobj.clickOnAddtoCart();
          
          
  	    var qtyerrormsg=element(by.xpath("//section[1]/div[1]/div[4]/div[1]/div[1]/div[2]/div[1]/form[1]/div[1]/div[2]/span[1]"));
    	   
  		 qtyerrormsg.getText().then(function(text){
  			 
  			 console.log("qty error msg is :"+text);
  			 
  			 expect(text).toContain("Qty is required");
  			 
  		 });
  		 
		    	   
		    	   console.log("qty is required");
		    	   
		    	   
		       }
		       
		       // case 3: when item is missing  and qty is there
		       
		       else if(tdata.testdataforquickAdd.item=="" && tdata.testdataforquickAdd.qty!=""){
		    	   
			    	 Additemobj.enterItem(tdata.testdataforquickAdd.item);
			    	 
			    	browser.sleep(3000);
	 			
			    	Additemobj.enterqty(tdata.testdataforquickAdd.qty);
			    	
			          Additemobj.clickOnAddtoCart();
			     
			            browser.sleep(4000);
			    	
			    	
			            var errormsg1= element(by.xpath("//div[@id='toast-container']"));
					    
			   		 errormsg1.getText().then(function(text){
			   			 
			   			console.log("error msg for when item is missing  and qty is there :"+text);
			   			
			   		
			   			expect(text).toContain("Item not found");
			   			
			   		
			   			 
			   		 });
			    	   
			    
			    	   
			    	   
			       }
		       
		       
		       
		       
		    // case 4: when qty is missing or less than 1
		       
		       else if( tdata.testdataforquickAdd.qty=="" || tdata.testdataforquickAdd.qty<1){
		    	   
		    	 Additemobj.enterItem(tdata.testdataforquickAdd.item);
		    	 
 		    	browser.sleep(3000);
 		    	 
 		    	Additemobj.clickonfirstHighlightItem();
 		    	
 		    	browser.sleep(3000);
  			
 		    	Additemobj.enterqty(tdata.testdataforquickAdd.qty);
 		    	
 		    	   Additemobj.clickOnAddtoCart();
 		    	   
 		    	   browser.sleep(8000);
 	   		   		
 		    	   var minqtyerrormsg=element(by.xpath("//section[1]/div[1]/div[4]/div[1]/div[1]/div[2]/div[1]/form[1]/div[1]/div[2]/span[1]"));
 	   		   
 		    	
 		    	   minqtyerrormsg.getText().then(function(text){
 		    		   
 		    		   console.log("min qty ordered error msg:"+text);
 		    		   
 		    		   expect(text).toContain("At least 1 must be ordered.");
 		    		   
 		    	   });
 		    	   
 		    	   
 		    	   
 		    	   
		    	   
		    	   console.log("please enter quantity, its less than 1");
		    	   
		    	   
		       }
		       
		       else{
		    	   
		    	   // case 5 : when item and qty both present
		    	   
		    	   
		    	 Additemobj.enterItem(tdata.testdataforquickAdd.item);
		    	 
		    	browser.sleep(3000);
		    	 
		    	  
    			Additemobj.clickonfirstHighlightItem();
    			
    			browser.sleep(5000);
        		
        		Additemobj.enterqty(tdata.testdataforquickAdd.qty);
        		
        		browser.sleep(3000);
		    	     
		    	 
		    	 Additemobj.clickOnAddtoCart();
		   		
		   		browser.sleep(5000);
		   		
		   	    Additemobj.clickOnCartIcon();
		   
		   	  

		   	 it("verify Items text on Add To Cart screen", function() {
		   			
		   			
		   			var items=Additemobj.getitemstext();
		   			
		   			items.getText().then(function(text){
		   				
		   				console.log("item text lable is:"+text);
		   				
		   				expect(text).toContain(tdata.testdataforquickAdd.itemstext);
		   				
		   				
		   				
		   				
		   			});
		   			
		   			
		   			
		   		});
		   		
		   		
		   		it("verify Order Summary text on Add To Cart screen", function() {
		   			
		   			
		   	var ordersummry= Additemobj.getordersummry();


		   	ordersummry.getText().then(function(text){

		   	console.log("order summary text is:"+text);

		   	expect(text).toContain(tdata.testdataforquickAdd.ordersummrytext);

		   	});


		   		 
		   		
		   	});
		   		
		   		
		   	it("verify Remove Item text on Add To Cart screen", function() {

		   	var removeitem=Additemobj.getremoveitem();

		   	removeitem.getText().then(function(text){
		   		
		   		console.log("link text value is:"+text);
		   		
		   		expect(text).toContain(tdata.testdataforquickAdd.removetext);
		   		
		   	});


		   		
		   		
		   	});

		   	it("verify Status Item text on Add To Cart screen", function() {

		   	var Status= Additemobj.getStatustext();

		   	Status.getText().then(function(text){
		   		
		   		console.log("Status text value is:"+text);
		   		
		   		expect(text).toContain(tdata.testdataforquickAdd.statustext);
		   		
		   	});
		   		
		   		
		   		
		   	});


		   	it("verify Price text on Add To Cart screen", function() {


		   	var Price= Additemobj.getpricetext();
		   		
		   	Price.getText().then(function(text){
		   				
		   				console.log("Price text value is:"+text);
		   				
		   				expect(text).toContain(tdata.testdataforquickAdd.Priceext);
		   				
		   			});

		   		
		   		
		   		
		   	});


		   	it("verify Qty text on checkout screen", function() {

		   	var Qty= Additemobj.getQty();
		   		
		   	Qty.getText().then(function(text){
		   				
		   				console.log("Qty text value is:"+text);
		   				
		   				expect(text).toContain(tdata.testdataforquickAdd.Qtytext);
		   				
		   			});



		   		
		   	});



		   	 
		   	 it("Verify total item text  present in cart", function() {
		   		 
		   		 
		   		 var countericon= Additemobj.getcountericon();
		   		 
		   		 // priting in console total count of item
		   		 
		   		 countericon.getText().then(function(text){
		   			 
		   			 console.log("countericon count is:"+text);
		   			 
		   		 });
		   		 
		   		 
		   		 // total item present in order history 
		   		 
		   		 var itemsincart= Additemobj.getitemsincart();
		   		
		   			
		   			itemsincart.getText().then(function(text){
		   				
		   				// using the reg expression to fetch the value from string
		   				
		   				console.log("count is:"+text.replace(/[^0-9\.]+/g,""));
		   				 
		   				expect(text.replace(/[^0-9\.]+/g,"")).toBe(countericon.getText());
		   				
		   			});
		   		 
		   		 

		   			
		   		 
		   		
		   	 	
		   	 });
		   	 
		   	 it("verify presence of continue shopping button", function() {
		   			 
		   			
		   			
		   			var contniueshop=Additemobj.getcontniueshopbtn();
		   			
		   			expect(contniueshop.isDisplayed()).toBeTruthy();// verify presence of button
		   			
		   			contniueshop.getText().then(function(text){
		   				
		   				console.log("button value is"+text);
		   				
		   				expect(text).toContain(tdata.testdataforquickAdd.continueshppintext);
		   				
		   				
		   			})
		   			
		   			
		   			
		   			});
		   	 
		   	 
		   		it(" Verify presence of clear cart button", function() {
		   			
		   			var clearcart=Additemobj.getclearcart();
		   			
		   			expect(clearcart.isDisplayed()).toBeTruthy();
		   			
		   			expect(clearcart.isPresent()).toBeTruthy();
		   			
		   			clearcart.getText().then(function(text){
		   				
		   				console.log("clear cart value is"+text);
		   				
		   				expect(text).toContain(tdata.testdataforquickAdd.clearcarttext);
		   				
		   			});
		   			
		   			
		   		});
		   		
		   		
		   		it(" Verify presence of Subtotal", function() {
		   			
		   			var subtotal=Additemobj.getsubtotal();
		   			
		   			expect(subtotal.isDisplayed()).toBeTruthy();
		   			
		   			expect(subtotal.isPresent()).toBeTruthy();
		   			
		   			subtotal.getText().then(function(text){
		   				
		   				console.log("subtotal value is:"+text);
		   				
		   				expect(text).toContain(tdata.testdataforquickAdd.Subtotaltext);
		   				
		   			});
		   			
		   			
		   			
		   			
		   			
		   		});
		   		
		   		
		   		
		   	it(" Verify presence of Total text", function() {
		   			
		   			var Total=Additemobj.getTotal();
		   			
		   			expect(Total.isDisplayed()).toBeTruthy();
		   			
		   			expect(Total.isPresent()).toBeTruthy();
		   			
		   			Total.getText().then(function(text){
		   				
		   				console.log("Total"+text);
		   				
		   				expect(text).toContain(tdata.testdataforquickAdd.Totaltext);
		   				
		   			});
		   			
		   			
		   			
		   			
		   			
		   		});
		   	     
		   	     
		   	      	   
		    	   
		       }
		       
		    

     });

 


	
});