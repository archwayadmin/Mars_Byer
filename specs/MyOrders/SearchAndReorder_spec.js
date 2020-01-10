var page = require('./../../pageobjects/BasePage/BasePage.js');

var addressobj = require('./../../pageobjects/Address/EditAddress.js');

var usermenuobj = require('./../../pageobjects/UserMenu/UserMenu.js');

var myorderobj = require('./../../pageobjects/MyOrders/MyOrders.js');

var homepageobj = require('./../../pageobjects/HomePage/HomePage.js');

var tdata = require('./../../json/MyOrder.json');

var logger = require('./../../log');

var UserMenuobj = require('./../../pageobjects/UserMenu/UserMenu.js');

var usermenuobj = require('./../../pageobjects/UserMenu/UserMenu.js');

var selectwraper = require('./../../Select-Wrapper.js');

var myselect = new selectwraper(by.xpath("//select[@id='status']"));



describe(" Verify My Orders page Functionality", function() {
	
	
	
	
	beforeEach(function() {
        originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 200000;
    });

    afterEach(function() {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    });
    
    browser.ignoreSynchronization = true;
    
    

it("Verify if user can search product by Order Number successfully", function() {
	
	UserMenuobj.clickOnUserCircle();
	
	logger.log('info', 'Click on Usercircle');
	
	
	
	browser.sleep(4000);
	
	UserMenuobj.clickOnmyOrders();
	
	
	
	browser.sleep(15000);
	
	
	// verifyin the presence of Favorites element on my order page
	
	
         var fav=myorderobj.getfav();

        fav.getText().then(function(text){
	
		console.log("text is :"+text);
		
		expect(text).toContain(tdata.testdata.Favorites);
	
});

        

     myorderobj.searchOrder(tdata.testdata.itemforsearch);
     
     logger.log('info','Enter some item in search box');
	
	   browser.sleep(9000);
	
// element present in first td of the table in first tr	
	
	   var ordernum= myorderobj.getordernumberaftersearch();
		
		// fetching the value of order num 
		
		var actual_ordernum=ordernum.getText();
		
		
		myorderobj.clickonordernum();// first click
		
		 logger.log('info','Click on  fiorder row');
		
	
		browser.sleep(3000);
		

	//verifying the product name is present in searching string 
	
	// exampe: https://archway-premiernutrition-qa.azurewebsites.net/orders/PN2122
	
	browser.getCurrentUrl().then(function(text){
		
		expect(text).toContain(actual_ordernum);
		
	});
	
	
	

	// Re-Order the product
	
var reorderbtn=	myorderobj.getreorder();

browser.sleep(4000);

expect(reorderbtn.isDisplayed()).toBeTruthy();// verifying the presence of the button

if(reorderbtn.isDisplayed()){
	
	reorderbtn.getText().then(function(text){
		
		
		if(text){
			
			
			expect(text).toContain(tdata.testdata.reordertext);
			
			reorderbtn.click();
			
			logger.log('info','click on Re-order icon');
			
			
			
			browser.sleep(3000);
			
			var addtocart= myorderobj.getaddtocartbtn();
			
			
			expect(addtocart.isPresent()).toBeTruthy();// verifying Add to cart is present
			
			
			if(addtocart.isDisplayed()){
				
				
				addtocart.click();
				
				logger.log('info','click on Add to cart');
				
				browser.getCurrentUrl().then(function(text){
					
					console.log("current url is:"+text);
					
					expect(text).toContain(actual_ordernum);// verify if user has re-ordered the same 
					
					// product that user has searched.
					 
					var ordernumbertext= myorderobj.getordernumbertext();
					
					ordernumbertext.getText().then(function(text){
						
						//expect(text).toContain("PN2003");// will make it dynamic later
						
						console.log(text);
						
						
					});
					
					
					
				});
				
				
				
				
				
			}
			
		}
		

		
	});
	

	
	
	
}

	
	
	
	});
	
	

	




xit(" Verify Advance search(By Status and By date) than Re-order the product", function() {
	
	
	//page.refreshThePage();

    homepageobj.clickOnmyOrders();
    
    logger.log('info','Click on My Orders');
	
	browser.sleep(4000);
	
	myselect.selectByText(tdata.testdata.status);
	
	 logger.log('info','Select Status');
	
	browser.sleep(2000);
	
	myorderobj.enterFromdate(tdata.testdata.fromdate);
	
	 logger.log('info','Enter from date');

	
	myorderobj.enterTodate(tdata.testdata.todate);
	
	 logger.log('info','Enter Todate');
	
	browser.sleep(7000);
	
	var ordernum= myorderobj.getordernumberaftersearch();
	
	 
	
	// fetching the value of order num 
	
	var actual_ordernum=ordernum.getText();
	
    
	myorderobj.clickonordernum();// first click
	
	logger.log('info','click on order row');
	
	
	
	
	browser.sleep(3000);
	
	myorderobj.clickonordernum();// second click...issue in application
	
	logger.log('info','click on order row');
	
	
	
	browser.sleep(5000);
	
	// Re-Order the product
	
var reorderbtn=	myorderobj.getreorder();

browser.sleep(4000);

expect(reorderbtn.isDisplayed()).toBeTruthy();// verifying the presence of the button

if(reorderbtn.isDisplayed()){
	
	reorderbtn.getText().then(function(text){
		
		
		if(text){
			
			
			expect(text).toContain(tdata.testdata.reordertext);
			
			reorderbtn.click();
			
			logger.log('info','click on Re-order icon');
			
			
			
			browser.sleep(3000);
			
			var addtocart= myorderobj.getaddtocartbtn();
			
			
			expect(addtocart.isPresent()).toBeTruthy();// verifying Add to cart is present
			
			
			if(addtocart.isDisplayed()){
				
				
				addtocart.click();
				
				logger.log('info','click on Add to cart');
				
				browser.getCurrentUrl().then(function(text){
					
					console.log("current url is:"+text);
					
					expect(text).toContain(actual_ordernum);// verify if user has re-ordered the same 
					
					// product that user has searched.
					 
					var ordernumbertext= myorderobj.getordernumbertext();
					
					ordernumbertext.getText().then(function(text){
						
						//expect(text).toContain("PN2003");// will make it dynamic later
						
						console.log(text);
						
						
					});
					
					
					
				});
				
				
				
				
				
			}
			
		}
		

		
	});
	

	
	
	
}

	

		
		
	});


it("Verification of total=subtotal+shipping", function() {
	
		
	var subtotalval;
	
	var subtotal= myorderobj.getsubtotal();
	
	subtotal.getText().then(function(text){
		
	var  num1=page.stringtoNumber(text);
	
	console.log(num1);
		
		
	});
	
	var shippingtotal=myorderobj.getshippingtotal();
	
	shippingtotal.getText().then(function(val){
		
		var  num2=page.stringtoNumber(val);
		
		console.log(num2);
		
	});
	
	var total=myorderobj.gettotal();
	
	total.getText().then(function(value){
		
		
      var  num3=page.stringtoNumber(value);
      
      console.log(num3);

		
		
	});
	
	
	
	
		
	
	
	

		
	});


	





});
