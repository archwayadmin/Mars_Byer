
var page = require('./../../pageobjects/BasePage/BasePage.js');

var checkoutobj = require('./../../pageobjects/Checkout/Checkout.js');

var tdata = require('./../../json/AddItem.json');

var logger = require('./../../log');

var selectwraper = require('./../../Select-Wrapper.js');

var myselect = new selectwraper(by.xpath("//select[@id='Country']"));

var myselect1 = new selectwraper(by.xpath("//select[@id='State']"));

var myselect2 = new selectwraper(by.xpath("//select[@id='ShippingMethod']"));


describe("Verify clear cart", function() {
	 
	
	it("verify If user can clear cart", function() {
		
		var clearcart= element(by.xpath("//button[@class='btn btn-primary ng-star-inserted']"));
		
		clearcart.click();
		
		
		
		
	});
	
	it("Verify Shopping cart Text is present", function() {
		
		
	var shoppingcart=	element(by.xpath("//h1[@class='display-4 m-0 headline-text text-center']"));
	
	shoppingcart.getText().then(function(text){
		
		console.log(text);
		
		expect(text).toContain(tdata.testdata.ShoppingCartText);
		
		
		
	});
		
		
		
		
	});
	
	
	it("Verify counter if user clear cart", function() {
		
	var counter=element(by.xpath("//span[@class='fa-layers-counter']"));
	
	counter.getText().then(function(count){
		
		console.log(count);
		
		expect(count).toBe(0);
		
	});
	
		
		
	});
	
	
	it("Verify Text after clearing the cart", function() {
		
	var textmsg=	element(by.xpath("//p[contains(text(),'You do not have any items in your cart')]"));
		
	textmsg.getText().then(function(text){
		
		console.log(text);
		
		expect(text).toContain(tdata.testdata.messageafterclearingCart);
		
	});
	
	
		
		
	});
	
	
	
	
});