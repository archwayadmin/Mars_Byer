
var page = require('./../BasePage/BasePage.js');
var MyOrders;

MyOrders= function(){
	
	
	var ordersearch=element(by.xpath("//form[@class='ng-pristine ng-valid ng-touched']//input[@id='search-addon']"));
	
	var fromdate= element(by.xpath("//input[@id='dFrom']"));
	
	var todate= element(by.xpath("//input[@id='dTo']"));
	
	 var ordernumber= element(by.xpath("//div[1]/table[1]/tbody[1]/tr[1]/td[8]"));
	 
	var reorder= element(by.xpath("//button[contains(text(),'Reorder')]"));
	
	var addtocartbtn=element(by.xpath("//button[contains(@class,'btn btn-primary btn-lg btn-block')]"));
	
	var ordernumbertext= element(by.xpath("//div[1]/div[1]/div[1]/div[1]/h2[1]"));
	
	var subtotal= element(by.xpath("//span[@class='float-right'][contains(text(),subtotalval)]"));
	
	var shippingtotal=element(by.xpath("//div[1]/div[1]/div[1]/div[1]/div[1]/span[2]"));
	
	var total=element(by.xpath("//div[1]/div[1]/div[1]/div[1]/div[1]/div[1]/span[1]"));
	
	var ordernumberaftersearch=element(by.xpath("//div[1]/table[1]/tbody[1]/tr[1]/td[2]"));
	
	var fav=element(by.xpath("//div[contains(text(),'Favorites')]"));
	
	//var ordersearch=element(by.xpath("//section[1]/shared-search[1]/form[1]/div[1]/input[1]"));
	
	
	this.getfav= function(){
		
		return fav;
		
	};
	
	this.searchOrder= function(value){
		
		page.highlightElement(ordersearch);
		
		ordersearch.clear();
		
		ordersearch.sendKeys(value)
		
		
	};
	
	
	this.getordernumberaftersearch= function(){
		
		return ordernumberaftersearch;
		
	};
	
	
	this.getsubtotal= function(){
		
		return subtotal;
		
	};
	
	this.getaddtocartbtn= function(){
		
		return addtocartbtn;
	};
	
	this.getshippingtotal= function(){
		
		return shippingtotal;
		
	};
	
	
	this.gettotal= function(){
		
		return total;
		
	};
	
	
	
	
	
	this.getordernumbertext= function(){
		
		return ordernumbertext;
		
	};
	
	
	this.clickonAddtoCartBtn= function(){
		
		page.highlightElement(addtocartbtn);
		
		addtocartbtn.click();
		
	};
	
	
	this.getreorder= function(){
		
		return reorder;
		
	};
	 
	 
	 this.clickonordernum= function(){
		 
		 page.highlightElement(ordernumber);
		 
		 ordernumber.click();
		 
	 };
	 
	
	this.enterOrder= function(value){
		
		 page.highlightElement(ordersearch);
		 
		 ordersearch.clear();
		
		ordersearch.sendKeys(value);
		
		
	};
	

	
this.enterFromdate= function(value){
	
	 page.highlightElement(fromdate);
	
	fromdate.clear();
		
	fromdate.sendKeys(value);
		
		
	};
	
	
	this.enterTodate= function(value){
		
		 page.highlightElement(todate);
		
		 todate.clear();
			
		 todate.sendKeys(value);
			
			
		};
	
	// this will return current date in mm/dd/year format
	
this.currentdate= function(){
	
	var today = new Date();
	
	var dd = today.getDate();
	
	var mm = today.getMonth()+1; //January is 0!
	
	var yyyy = today.getFullYear();

     return mm+'/'+dd+'/'+yyyy;
     
	};
	
	
	
	
	
	
};

module.exports= new MyOrders();
















