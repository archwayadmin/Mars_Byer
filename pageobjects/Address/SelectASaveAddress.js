var page = require('./../BasePage/BasePage.js');

var selectaSaveAdddress;


selectaSaveAdddress= function(){
	
	
var selectsaveaddrss= element(by.xpath("//button[contains(text(),'Select a Saved Address')]"));
	
	var searchSelectaddress= element(by.xpath("//form[@class='ng-pristine ng-valid ng-touched']//input[@id='search-addon']"));
	
	var selectlink= element(by.xpath("//a[contains(text(),'Select')]"));
	
	var saveandcontinue= element(by.xpath("//button[contains(text(),'Save and Continue')]"));
	
	var saveandcontinue2= element(by.xpath("//button[contains(text(),'Save and Continue')]"));
	
	var saveandcontinue3= element(by.xpath("//button[@class='btn btn-primary']"));
	
	
	this.clickonSaveAndContinue= function(){
		
		page.highlightElement(saveandcontinue);
		
		saveandcontinue.click();
		
		
		
	};
	
	this.clickonbtn= function(){
		
		page.highlightElement(saveandcontinue3);
		
		
		saveandcontinue3.click();
		
	};
	
this.clickOnselectsaveaddrss= function(){
	
	page.highlightElement(selectsaveaddrss);
	
		
		selectsaveaddrss.click();
		
	};
	
	this.searchAddress= function(value){
		
		page.highlightElement(searchSelectaddress);
		
		
		searchSelectaddress.clear();
		
		searchSelectaddress.sendKeys(value);
		
	};
	
	this.clickOnselectlink= function(){
		
		
		page.highlightElement(selectlink);
		
		selectlink.click();
		
	};
	
	
	

	
};

module.exports= new selectaSaveAdddress();