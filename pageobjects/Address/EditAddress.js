var page = require('./../BasePage/BasePage.js');

var Address;

Address= function(){
	
	
	
	
var firstName = element(by.id('FirstName'));
    
 var lastName = element(by.id('LastName'));
    
var companyname = element(by.id('CompanyName'));

var street1=element(by.id("Street1"));

var street2=element(by.id("Street2"));
    
var city = element(by.id('City'));
    
var state = element(by.id('State'));
    
var zipCode = element(by.id('zipCode'));

var createAddress= element(by.xpath("//button[contains(text(),'Create Address')]"));

var editicon= element(by.xpath(""));

var noaddressfound= element(by.xpath("//p[contains(text(),'No addresses found')]"));

var searchAddress= element(by.xpath("//form[@class='ng-valid ng-touched ng-pristine']//input[@id='search-addon']"));

var addAnAddress= element(by.xpath("//button[contains(text(),'Add an Address')]"));



var phonenum= element(by.xpath("//input[@id='Phone']"));

// add address text

var addadress=element(by.xpath("//h4[contains(text(),'Add Address')]"));


this.getaddresstext= function(){
	
	return addadress;
	
	 
};

this.clickOnAddAddress= function(){
	
	page.highlightElement(addAnAddress);
	
	addAnAddress.click();
	
};


this.enterPhone= function(value){
	
	page.highlightElement(phonenum);
	
	phonenum.clear();
	
	phonenum.sendKeys(value);
	
};


this.addAddressElement= function(){
	
	
	return addAnAddress;
	
	
	
};
 

this.addressMessage= function(){
	

	return noaddressfound;
	
};

this.search= function(value){
	
	page.highlightElement(searchAddress);
	
	searchAddress.clear();
	
	searchAddress.sendKeys(value);
	
};


this.enterFirsName= function(value){
	
	page.highlightElement(firstName);
	
	firstName.clear();
	
	firstName.sendKeys(value);
};


this.enterLastName= function(value){
	
	page.highlightElement(lastName);
	
	lastName.clear();
	
	lastName.sendKeys(value);
};

this.enterCompanyName= function(value){
	

		page.highlightElement(companyname);
		
		companyname.clear();
		
		companyname.sendKeys(value);
		
	

};

this.enterStreet1Name= function(value){
	
	page.highlightElement(street1);
	
	street1.clear();
	
	street1.sendKeys(value);
};

this.enterStreet2Name= function(value){
	
	page.highlightElement(street2);
	
	street2.clear();
	
	street2.sendKeys(value);
};

this.enterCityName= function(value){
	
	page.highlightElement(city);
	
	city.clear();
	
	city.sendKeys(value);
};

this.clickOnState= function(){
	
	page.highlightElement(state);
	
	state.click();
};

this.enterZipcodeName= function(value){
	
	page.highlightElement(zipCode);
	
	zipCode.clear();
	
	zipCode.sendKeys(value);
};

this.clickOnSaveBtn= function(){
	
	page.highlightElement(createAddress);
	
	createAddress.submit();
};

 
 
	
	
};

module.exports= new Address();