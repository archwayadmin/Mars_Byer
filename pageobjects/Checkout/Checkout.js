
var page = require('./../BasePage/BasePage.js');
var CheckOut;

CheckOut = function() {
	
	var enterOnetimeaddress= element(by.xpath("//button[contains(text(),'Enter One-Time Address')]"));

	var country = element(by.xpath("//select[@id='Country']"));

	var firstName = element(by.id('FirstName'));

	var lastName = element(by.id('LastName'));

	var companyName = element(by.id('CompanyName'));

	var address1 = element(by.id('Street1'));

	var address2 = element(by.id('Street2'));

	var city = element(by.id('City'));

	var state = element(by.id('State'));

	var zipCode = element(by.id('zipCode'));

	var phoneNumber = element(by.id('Phone'));

	var faxNumber = element(by.id('faxNumber'));

	var save = element(by.xpath("//button[contains(text(),'Save and Continue')]"));

	var dropdown = element(by.xpath("//select[@id='ShippingMethod']"));

	var saveAndContinue = element(by.xpath("//button[@class='btn btn-primary']"));

	var comments = element(by.xpath("//textarea[@placeholder='Comments (optional)']"));

	var deliveryInstruction = element(by.xpath("//textarea[@placeholder='Delivery Instruction (optional)']"));

	var warehouseInstruction = element(by.xpath("//textarea[@placeholder='Warehouse Instruction (optional)']"));

	var submitOrder = element(by.xpath("//button[@class='btn btn-primary mt-4']"));
	
	 var ordersubttext=element(by.xpath("//strong[contains(text(),'Order Submitted')]"));
	 
	 var ordernumber= element(by.xpath("//checkout-order-confirmation[1]/div[1]/div[2]/div[1]/span[1]"));
	 
	 // order no text
	 
var ordernum=element(by.xpath("//strong[contains(text(),'Order ID')]"));

// date submitted text

var datesubmbt=element(by.xpath("//strong[contains(text(),'Date Submitted')]"));

// date 

var actuldate=element(by.xpath("//checkout-order-confirmation[1]/div[1]/div[3]/div[1]/span[2]"));


// shipping method text/label

var shipplabel=element(by.xpath("//strong[contains(text(),'Shipping Method')]"));

// shippng method value

var shippmethodval=element(by.xpath("//checkout-order-confirmation[1]/div[1]/div[3]/div[1]/span[3]"));

// subtotal text

var subtotal=element(by.xpath("//strong[contains(text(),'Subtotal')]"));

// sub total value

var subtotalval=element(by.xpath("//checkout-order-confirmation[1]/div[1]/div[3]/div[1]/span[4]"));


// order total val

var ordertotalval=element(by.xpath("//checkout-order-confirmation[1]/div[1]/div[3]/div[1]/div[1]/span[1]"));


// print

var printtext=element(by.xpath("//button[@class='btn btn-primary float-right']"));




this.getprinttext= function(){
	
	
	return printtext;
	
};









this.getordertotalval= function(){
	
	
	return ordertotalval;
	
};





this.getsubtotalval= function(){
	
	
	return subtotalval;
	
};








this.getsubtotal= function(){
	
	
	return subtotal;
	
};






this.getshippmethodval= function(){
	
	
	return shippmethodval;
	
};






this.getshipplabel= function(){
	
	
	return shipplabel;
	
};


	


this.getactuldate= function(){
	
	
	return actuldate;
	
};



this.getordernum= function(){
	
	
	return ordernum;
	
};



this.getdatesbmt= function(){
	
	
	return datesubmbt;
	
};




	 
	 
	 
	 this.getsubmitOrderbtn= function(){
		 
		 return submitOrder;
		 
	 };
	 
	 this.getordernumber= function(){
		 
		return  ordernumber;
		 
	 };
	
	
	
	 
	 this.getordersubttext= function(){
		 
		 return ordersubttext;
		 
	 };
	 
	 
	
	this.clickOnEnterOneTimeAddress= function(){
		
		page.highlightElement(enterOnetimeaddress);
		
		enterOnetimeaddress.click();
		
		
	};
	
	this.clickonsaveAndContinue= function(){
		
		page.highlightElement(saveAndContinue);
		
		saveAndContinue.click();
		
	};
	

	this.clickOnCountry = function() {
		
		page.highlightElement(country);

		country.click();

	};

	this.enterFirstName = function(value) {
		
		page.highlightElement(firstName);
		
		firstName.clear();

		firstName.sendKeys(value);

   };

	this.enterLastName = function(value) {
		
		page.highlightElement(lastName);
		
		lastName.clear();

		lastName.sendKeys(value);
};

	this.entercompanyName = function(value) {
		
		page.highlightElement(companyName);
		
		companyName.clear();

		companyName.sendKeys(value);

	};

	this.enteraddress1Name = function(value) {
		
		page.highlightElement(address1);
		
		address1.clear();

		address1.sendKeys(value);

	};

	this.enteraddress2Name = function(value) {
		
		page.highlightElement(address2);
		
		address2.clear();

		address2.sendKeys(value);

	};

	this.enterCityName = function(value) {
		
		page.highlightElement(city);
		
		city.clear();

		city.sendKeys(value);

	};

	this.enterStatetName = function(value) {
		
		page.highlightElement(state);
		
		state.clear();

		state.sendKeys(value);

	};

	this.enterzipCodeName = function(value) {
		
		page.highlightElement(zipCode);
		
		
		zipCode.clear();

		zipCode.sendKeys(value);

	};

	this.enterphoneNumberName = function(value) {
		
		page.highlightElement(phoneNumber);
		
		phoneNumber.clear();

		phoneNumber.sendKeys(value);

	};

	

	this.clickOnSave = function() {
		
		page.highlightElement(save);
		
		save.click();

	};

	this.enterComments = function(value) {
		
		page.highlightElement(comments);
		
		comments.clear();

		comments.sendKeys(value);

	};

	this.enterdeliveryInstruction = function(value) {
		
		page.highlightElement(deliveryInstruction);
		
		deliveryInstruction.clear();

		deliveryInstruction.sendKeys(value);

	};

	this.enterwarehouseInstruction = function(value) {
		
		page.highlightElement(warehouseInstruction);
		
		warehouseInstruction.clear();

		warehouseInstruction.sendKeys(value);

	};

	this.clickOnsubmitOrder = function() {
		
		page.highlightElement(submitOrder);

		submitOrder.sendKeys().click();

	};
	
	
	
	this.currentdate= function(){
		
		var today = new Date();
		
		var dd = today.getDate();
		
		var mm = today.getMonth()+1; //January is 0!
		
		var yyyy = today.getFullYear();

	     return mm+'/'+dd+'/'+yyyy;
	     
		};
		
		
		// method will return only numeric value
		
		this.getsubtotalvalue=function(str){
			
			return str.replace(/[^0-9\.]+/g,"");
			
		
			
		};
	
	
	

};

module.exports = new CheckOut();
