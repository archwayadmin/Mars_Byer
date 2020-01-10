
var page = require('./../BasePage/BasePage.js');
var multipleaddress;

multipleaddress= function(){
	
	var selectmultiadd= element(by.xpath("//button[contains(text(),'Select Multiple Address')]"));
	
	var searcname= element(by.xpath("//*[@name='search']"));
	
	var addbtn= element(by.xpath("//button[@class='btn btn-primary'][contains(text(),'Add')]"));
	
	var addressChkBox= element(by.xpath("//div[1]/div[1]/table[1]/thead[1]/tr[2]/th[1]/input[1]"));
	
	var firstChkboxaftersearch=element(by.xpath("//div[1]/table[1]/tbody[1]/tr[1]/td[1]/input[1]"));
	
	var comments = element(by.xpath("//textarea[@placeholder='Comments (optional)']"));
	
	var deliveryInstruction = element(by.xpath("//textarea[@placeholder='Delivery Instruction (optional)']"));

	var warehouseInstruction = element(by.xpath("//textarea[@placeholder='Warehouse Instruction (optional)']"));

	var submitOrder = element(by.xpath("//button[@class='btn btn-primary mt-4']"));
	
	

	this.clickonmultiselectBtn= function(){
		
		
		selectmultiadd.click();
		
	};
	
	
	
	this.entervalueInSearch= function(value){
		
		
		searcname.clear(value);
		
		searcname.sendKeys(value);
		
		
	};
	
	this.clickOnAdd= function(){
		
		addbtn.click();
		
	};
	
	
	this.clickOnAddressChkbox= function(){
		
		
		addressChkBox.click();
	};
	
	this.clickonafterSearchChkbox= function(){
		
		if(firstChkboxaftersearch.isSelected()){
			
			
			
		}
		
		else{
			
			firstChkboxaftersearch.click();
		}
		
	
		
		
		
	};
	
  this.enterComments =  function(value) {
		
		comments.clear();

		comments.sendKeys(value);

	};

	this.enterdeliveryInstruction = function(value) {
		
		deliveryInstruction.clear();

		deliveryInstruction.sendKeys(value);

	};

	this.enterwarehouseInstruction = function(value) {
		
		warehouseInstruction.clear();

		warehouseInstruction.sendKeys(value);

	};

	this.clickOnsubmitOrder = function() {

		submitOrder.sendKeys().click();

	};
	
	
	
	
	
};

module.exports= new multipleaddress();
