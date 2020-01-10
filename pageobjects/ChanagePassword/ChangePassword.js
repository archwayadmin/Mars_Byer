
var page = require('./../../pageobjects/BasePage/BasePage.js');

var changepassword;

changepassword= function(){
	
	
	var changepassword=element(by.xpath("//button[@class='btn btn-outline-primary btn-block']"));
	
	var cuurentpwd= element(by.xpath("//input[@id='currentPassword']"));
	
	var newpassword= element(by.xpath("//input[@id='newPassword']"));
	
	var confirmpwd=element(by.xpath("//input[@id='confirmNewPassword']"));
	
	var savebtn= element(by.xpath("//button[@class='btn btn-primary btn-block']"));
	
	
	
this.entercuurentpwd= function(value){
	
	page.highlightElement(cuurentpwd);
		
	cuurentpwd.clear();
	
	cuurentpwd.sendKeys(value);
		
		
	};
	
	
	
	this.enternewpassword= function(value){
		
		page.highlightElement(newpassword);
			
		newpassword.clear();
		
		newpassword.sendKeys(value);
			
			
		};
		
		
		this.enternconfirmpwd= function(value){
			
			page.highlightElement(confirmpwd);
				
			confirmpwd.clear();
			
			confirmpwd.sendKeys(value);
				
				
			};
		
	
	
	
	
	this.clickonchangepassword= function(){
		
		page.highlightElement(changepassword);
		
		
		changepassword.click();
		
		
	};
	
	
	this.clickonsavebtn= function(){
		
		page.highlightElement(savebtn);
		
		savebtn.click();
		
		
	};
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
};

module.exports= new changepassword();