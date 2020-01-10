
var page = require('./../BasePage/BasePage.js');

var HomePage;

HomePage = function() {
	
	 var logo=element(by.xpath("//a[@class='navbar-brand']//img[@class='img-fluid']"));
	

	var browseProduct = element(by.xpath("//button[@class='nav-button']"));

	var myOrder = element(by.xpath('//a[contains(text(),"My Orders")]'));
	
	var home = element(by.xpath('//a[contains(text(),"Home")]'));
	
	var reporticon= element(by.xpath("//a[@class='nav-button']"));
	
	var searchoption=	element(by.xpath("//div[@class='input-group-text']"));
	
	var carticon= element(by.css("  ul > li > a > fa-layers > fa-icon > svg"));
	
	//  css selector= svg.svg-inline--fa.fa-shopping-cart.fa-w-18.fa-lg > path
	
	var showall= element(by.xpath("//div[@class='rowOrderHistory py-3']//button[@class='btn btn-primary'][contains(text(),'Show All »')]"));
	
	var downloadsummry= element(by.xpath("//*[@class='svg-inline--fa fa-download fa-w-16']"));
	
	
	var caroimg=element(by.xpath("//div[@class='carousel-item active']//img[@class='img-fluid']"));
	
	var annohome=element(by.xpath("//strong[contains(text(),'Announcements')]"));
	
	var featureprod=	element(by.xpath("//strong[contains(text(),'Featured Products')]"));
	
	var websiteicon=element(by.xpath("//strong[contains(text(),'About Website')]"));
	
	var abtwebcontent=element(by.xpath("//span[contains(text(),'Welcome to the new Premier Nutrition ordering site')]"));
	
	
	var orderhistory= element(by.xpath("//strong[contains(text(),'Order History')]"));
	
	var ordersummar=element(by.xpath("//strong[contains(text(),'Order Summary')]"));
	
	

	// first link present in orderhistory tab
	
	var orderhislink=element(by.xpath("//div[1]/div[1]/a[1]/div[1]/div[1]"));
	
	var viewdetails=element(by.xpath("//button[contains(text(),'View Details »')]"))
	
	var orderdate=	element(by.xpath("//div[contains(text(),'Order Date')]"));
	
	var orderstatus=	element(by.xpath("//div[contains(text(),'Order Status')]"));
	
	var statusdate=	element(by.xpath("//div[contains(text(),'Status Date')]"));
	
	var totalitem=	element(by.xpath("//div[contains(text(),'Total Items')]"));
	
	
	var totalcost=	element(by.xpath("//div[contains(text(),'Total Cost')]"));
	
	var showallbtn=element(by.xpath("//div[@class='rowOrderHistory py-3']//button[@class='btn btn-primary'][contains(text(),'Show All »')]"));
	
	// contatc form elements
	
	var conatctus=element(by.xpath("//a[contains(text(),'Contact Us')]"));
	
	
	var nametext= element(by.xpath("//label[contains(text(),'Name')]"));
	
	var emailtext= element(by.xpath("//label[contains(text(),'Email')]"));
	
	var contactltext= element(by.xpath("//label[contains(text(),'Contact Number')]"));
	
	var messgetext= element(by.xpath("//label[contains(text(),'Message')]"));
	
	var sbtbtn=element(by.xpath("//button[@class='btn btn-primary']"));
	
	var cancelbtn=element(by.xpath("//button[@class='btn btn-primary ml-2']"));
	
	//FAQ
	
	var faq=	element(by.xpath("//small[contains(text(),'FAQ')]"));
	
	// copyright text
	
	var copyrightext=element(by.xpath("//small[contains(text(),'© 2019 ARCHWAY MARKETING SERVICES')]"));
	
	
	this.getordersummar= function(){
		
		
		return ordersummar;
		
	};
	
	
this.getcopyrightext= function(){
		
		
		return copyrightext;
	};
	
	
	
this.getfaq= function(){
		
		
		return faq;
	};
	
	
this.getnametext= function(){
		
		
		return nametext;
	};
	
	
this.getemailtext= function(){
		
		
		return emailtext;
	};
	
	
	
	
this.getcontactltext= function(){
		
		
		return contactltext;
	};
	
this.getmessgetext= function(){
		
		
		return messgetext;
	};
	
this.getsbtbtn= function(){
		
		
		return sbtbtn;
	};
	
this.getcancelbtn= function(){
		
		
		return cancelbtn;
	};
	
	

	
this.getconatctus= function(){
		
		
		return conatctus;
	};
	
	
	
	
this.getshowallbtn= function(){
		
		
		return showallbtn;
	};
	
	
	

this.gettotalcost= function(){
		
		
		return totalcost;
	};
	
	
	
	
this.gettotalitem= function(){
		
		
		return totalitem;
	};
	
	
	
this.getstatusdate= function(){
		
		
		return statusdate;
	};
	
	
this.getorderstatus= function(){
		
		
		return orderstatus;
	};
	
	

	this.getorderdate= function(){
		
		
		return orderdate;
	};
	
	
	
	
	this.getviewdetails= function(){
		
		
		return viewdetails;
	};
	
	
	
	
	this.getorderhislink= function(){
		
		
		return orderhislink;
	};
	
	
	
	
	
	
	this.getorderhistory= function(){
		
		
		return orderhistory;
	};
	
	
	
	
	this.getabtwebcontent= function(){
		
		
		return abtwebcontent;
	};
	
	

	
	this.getwebsiteicon= function(){
			
			
			return websiteicon;
		};
		
		
	
	
	
	
this.getfeatureprod= function(){
		
		
		return featureprod;
	};
	
	
	
	
	
this.getannohome= function(){
		
		
		return annohome;
	};
	
	
	
this.getcaroimg= function(){
		
		
		return caroimg;
	};

	
	

this.getdownloadsummry= function(){
		
		
		return downloadsummry;
	};

	
	
	
	
this.getshowall= function(){
		
		
		return showall;
	};

	
	
	
	
	
	
this.getreporticon= function(){
		
		
		return reporticon;
	};

	
	
	
	
	
	this.getcarticon= function(){
		
		
		return carticon;
	};

	
	
	

	this.getsearchoption= function(){
			
			
			return searchoption;
		};
	
	
	
	
	
	this.getbrowseProduct= function(){
			
			
			return browseProduct;
		};
	
	
this.getmyOrder= function(){
			
			
			return myOrder;
		};
	
	
this.gethome= function(){
			
			
			return home;
		};
	
		
		
this.gereporticon= function(){
			
			
			return reporticon;
		};
			
	
	
	
	
this.getlogo= function(){
		
		
		return logo;
	};
	
	

	this.element= function(){
		
		
		return browseProduct;
	};

	this.clickOnmyOrders = function() {
		
		page.highlightElement(myOrder);
		
		
		myOrder.click();

	};
	
	this.reports = function() {
		
		page.highlightElement(reporticon);
		
		reporticon.click();

	};

	this.browseProducts = function() {
		
		page.highlightElement(browseProduct);
		
		
		var flag= true;
		
		browseProduct.click().then(null, function(err){
        	
			flag= false;
        	
        	console.log("The error occured is : "+ err.name);
        	
        	
        	
        }).then(function(val){
        	
        	if(flag){
        		
        		 console.log("****");
        	      
        		
        	}
        	
        	
        });

	};
	
	this.clickOnHome= function(){
		
		page.highlightElement(home);
		
		home.click().then(null, function(err){
			
			console.log("The error occured is : "+ err.name);
        	
			
		});
		
		
		
	};
	
	

		
		
};

module.exports = new HomePage();

