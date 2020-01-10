	

var page = require('./../../pageobjects/BasePage/BasePage.js');

var Additemobj = require('./../../pageobjects/AddItem/AddItem.js');

var homepageobj = require('./../../pageobjects/HomePage/HomePage.js');

var OR = require('./../../json/objects.json');

var logger = require('./../../log');

var selectwraper = require('./../../Select-Wrapper.js');

var myselect = new selectwraper(by.xpath("//div[4]/display-filter[1]/form[1]/div[1]/select[1]']"));


// item number: 643843716341

describe("TC_001:Add Product to cart", function() {
	
	beforeEach(function() {
	

        originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 200000;
     });

     afterEach(function() {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
     });
     
     browser.ignoreSynchronization = true;
     
     it("TC_002: clicking on Browse Product", function() {
    	 
    	 homepageobj.browseProducts();
 		
 		  browser.sleep(4000);
 		  
 		 
 		
 		 
 		 
 		  
 		 
 		  
		  
     	
     });
     
     it("Add to cart from List View", function() {
    	 
    	 browser.sleep(7000);
    	 
    	 element(by.partialLinkText("View All Pro")).click();
    	 
    	 browser.sleep(5000);
    	 

    	
    	// click on List Icon
    	 
    	 element(by.xpath("//label[@class='btn btn-primary p-2 active']")).click();
    	 
    	 // click on image and add to cart
    	 
    	// element(by.xpath("//div[1]/div[1]/div[1]/img[1]")).click();
    	 
    	 //verifying product details
    	 
  // printing all values on console
    	 
    	/* for(var i=1; i<=8; i++){
    	 	
    		element(by.xpath("//div[1]/div[1]/div[2]/p["+i+"]")).getText().then(function(text){
    			
    			console.log(text);*/
    	 
    	 
    	 
    	 //priting text for one pagination
    	 
    	 
    	 
    	 
    	 
  var pagination= element(by.xpath("//span[contains(text(),'»')]")).getAttribute("class");
  
  page.ScrollTheViewElementAndClick(pagination);
  
  element(by.xpath("//a[contains(text(),'1')]")).click();
  
 var  classname=element(by.xpath("//a[contains(text(),'1')]")).getAttribute("class");
 
 for(var i=1; i<=5; i++){
	 
	 element(by.xpath("//a[contains(text(),i)]")).isPresent().then(function(){
		 
		 //element(by.xpath("//a[contains(text(),i)]")).click();
		 
		 browser.executeScript('window.scrollTo(0,document.body.scrollHeight)').then(function(){
			 
			 element(by.xpath("//a[contains(text(),i)]")).click();
			 
			 browser.sleep(3000);
			 
			 i++;
			 
		 });
		 
		
		 
		 
		 
		
		 
		 
		 
		
		
		 
		// page.ScrollTheViewElementAndClick( element(by.xpath("//a[contains(text(),i)]")));
		 	
		
		// browser.executeScript('window.scrollTo(0,document.body.scrollHeight)');
	
		 
	
		 
		
		 
		
		 
		 
	 });
	 
	 
	 
	 
	 
 }
 
 		
 	
     });
     
     
     it("Add Item from Grid view", function() {
    	 
    	 element(by.xpath("//label[@class='btn btn-primary p-2 active']")).click();
    	 
    	 var imgicon= element(by.xpath("//div[1]/archway-product-product-card[1]/div[1]/div[3]/img[1]"));
    	 
    	 expect(imgicon.isPresent()).toBeTruthy();
    	 
    	 
     	
     });
     
     it("Add item from Table View", function() {
    	 
    	 
    	 element(by.xpath("//label[contains(text(),'Table')]")).click();
    	 
    	 var firstimg= element(by.xpath("//div[1]/div[1]/product-card-table[1]/div[1]/div[1]/img[1]")).click(); 
    	 
    	 
    	 
     	
     });
     
     it("ID of item", function() {
    	 
    	var id= element(by.xpath("//span[@class='text-muted']"));
    	
    	expect(id.isDisplayed()).toBeTruthy();
     	
     });
     
    
    	
    	
    	 
    	 
     	
     });
     
     it("Verify Heart Icon", function() {
    	 
    	 
    	var hearticon= element(by.xpath("//*[@class='svg-inline--fa fa-heart fa-w-16']"));
     	
    	expect(hearticon.isDisplayed()).toBeTruthy();
     });
     
    	
     
    
     
     
     xit("verify UOM element of product description", function() {
    	 
    	 var uom= element(by.xpath("//div[1]/div[1]/div[2]/p[1]"));
    	 
    	 expect(uom.isDisplayed()).toBeTruthy();
    	 
    	 expect(uom.isPresent()).toBeTruthy();
    	 
         
    	 
     	
     });
     xit("verify Status  of product description", function() {
    	 
 var status= element(by.xpath("//div[1]/div[1]/div[2]/p[2]"));
    	 
    	 expect(status.isDisplayed()).toBeTruthy();
    	 
    	 expect(status.isPresent()).toBeTruthy();
      	
     });
     
     xit("verify Min Qty  product description", function() {
    	 
 var qtychk= element(by.xpath("//div[1]/div[1]/div[2]/p[3]"));
    	 
    	 expect(qtychk.isDisplayed()).toBeTruthy();
    	 
    	 expect(qtychk.isPresent()).toBeTruthy();
      	
     });
     
     xit("verify Max Order Limit of product description", function() {
    	 
var maxorderqty= element(by.xpath("//div[1]/div[1]/div[2]/p[4]"));
    	 
    	 expect(maxorderqty.isDisplayed()).toBeTruthy();
    	 
    	 expect(maxorderqty.isPresent()).toBeTruthy();
      	
     });
     
     xit("verify On Hand Qty of product description", function() {
    	 
var onhandqty= element(by.xpath("//div[1]/div[1]/div[2]/p[5]"));
    	 
    	 expect(onhandqty.isDisplayed()).toBeTruthy();
    	 
    	 expect(onhandqty.isPresent()).toBeTruthy();
      	
     });
     
     xit("verify Effective Date of product description", function() {
    	 
var effdate= element(by.xpath("//div[1]/div[1]/div[2]/p[6]"));
    	 
    	 expect(effdate.isDisplayed()).toBeTruthy();
    	 
    	 expect(effdate.isPresent()).toBeTruthy();
      	
     });
     
     xit("verify Expiry Date of product description", function() {
    	 
var expdate= element(by.xpath("//div[1]/div[1]/div[2]/p[7]"));
    	 
    	 expect(expdate.isDisplayed()).toBeTruthy();
    	 
    	 expect(expdate.isPresent()).toBeTruthy();
      	
     });
     
     xit("verify Price  of product description", function() {
    	 
var prodctdesc= element(by.xpath("//div[1]/div[1]/div[2]/p[8]"));
    	 
    	 expect(prodctdesc.isDisplayed()).toBeTruthy();
    	 
    	 expect(prodctdesc.isPresent()).toBeTruthy();
      	
     });
     
     
     it("verify total item should be equal to be  displayed in Display select box", function() {
    	 
    	 
    	 
    	 
    	var eleall=element.all(by.xpath("//div[1]/div[4]/div[2]/div[2]/div[1]/ngb-pagination[1]/ul[1]/li[1]/a[1]"));
    	
    	eleall.getSize().then(function(text){
    		
    		console.log(text);
    		
    	});
    	
    	
    	
     	
     });
     
     
     
     xit("Verify Default button presence and enabled", function() {
    	 
    	 
    	 var defautbtn= element(by.xpath("//form[1]/div[1]/select[1]"));
    	 
    	 expect(defautbtn.isPresent()).toBeTruthy();
    	 
    	 expect(defautbtn.isEnabled()).toBeTruthy();
    	 
    	
    
     
     
     
    	 
    	 
     	
     
          
          
         
        		
     
     
     
     
     
     
     xit("Verify that on the product page, user can select the desired product and add to cart", function() {  	 
    	 let featureitem= element(by.xpath("//label[contains(text(),'Featured Items')]"));
    
    	 
    	 featureitem.isPresent().then(function(text){
    		 
    		 if(text){
    			 
    			 featureitem.click();
    			 
    			 var qty;
    			 
    			 if(qty>=1){
    		
    			 element(by.xpath("//input[@id='quantity']")).sendKeys("2");
    			 
    			 browser.sleep(7000);
    			 
    			 element(by.xpath("//button[@class='btn btn-primary btn-block small btn-margin-space']")).click();
    			 
    			 browser.sleep(7000);
    			 
    	         element(by.xpath('//span[@class="fa-layers-counter"]')).click();
    	
    			 browser.sleep(7000);
    			 
    			 element(by.xpath("//div[1]/div[1]/div[3]/div[1]/button[1]")).click();
    			 
    			 
    			 browser.sleep(7000);
    		 }
    		 }
    		 
    		
   
    		 
    		 
    	 });
    	 
    	 
     	
     });
     
     
	
	
	
	
	
	
	
	
	xit("TC_005:Verify Error message if item and qty is not taken and click on Add to cart button", function() {
		
		 Additemobj.enterItem("");
			
			browser.sleep(5000);
			
			// element(by.xpath("//ngb-highlight[@class='ng-star-inserted']")).click();
			
			Additemobj.enterqty("");
			
			browser.sleep(5000);
			
			Additemobj.clickOnAddtoCart(); 
			
		var actmsg=Additemobj.mssg();
		
		expect(actmsg.isPresent()).toBeTruthy();
			
		});
			
				
	
		

	
	
	
	 
xit("TC_006: Verify error message if item is taken but not qty and click on Add to cart button", function() {
		
	 Additemobj.enterItem("643843716341");
		
		browser.sleep(5000);
		
		// element(by.xpath("//ngb-highlight[@class='ng-star-inserted']")).click();
		
		Additemobj.enterqty("");
		
		browser.sleep(5000);
		
		Additemobj.clickOnAddtoCart(); 
		
	var actmsg=Additemobj.mssg();
	
	expect(actmsg.isPresent()).toBeTruthy();
		

		
				
	
		
	});


xit(" TC_007: Verify error message if item is null but  qty is taken and click on Add to cart button", function() {
		
        
	  Additemobj.enterItem("");
		
		browser.sleep(5000);
		
		// element(by.xpath("//ngb-highlight[@class='ng-star-inserted']")).click();
		
		Additemobj.enterqty("2");
		
		browser.sleep(5000);
		
		Additemobj.clickOnAddtoCart(); 
		
	var actmsg=Additemobj.mssg();
	
	expect(actmsg.isPresent()).toBeTruthy();
		
	
});

});