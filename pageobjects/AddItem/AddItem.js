
var page = require('./../BasePage/BasePage.js');

var addtoCart;

addtoCart= function(){	
	
	var browseProducts= element(by.xpath("//a[@class='nav-link active']"));
	
	var item=element(by.xpath("//input[@id='typeahead-basic']"));
	
	var firsthighlightitem=element(by.xpath("//div[1]/div[1]/ngb-typeahead-window[1]/button[1]/ngb-highlight[1]"));
	
	var qty= element(by.xpath("//form[1]/div[1]/div[2]/input[1]"));
	
	 var addtocart=element(by.xpath("//div[@class='col-md-4 col-lg-3 d-md-block d-sm-none d-none']//span[@class='d-md-none d-lg-inline'][contains(text(),'to Cart')]"));
	
	var cartIcon= element(by.css(" fa-layers > fa-icon > svg > path"));
	
	var checkout= element(by.xpath("//button[@class='btn btn-primary btn-block mb-4 font-weight-bold']"));
	
	var errormsg= element(by.xpath("//div[@id='toast-container']"));
	
	// lables 
	
	// counter icon
	
var countericon= element(by.xpath("//span[@class='fa-layers-counter']"));

var itemsincarttext= element(by.xpath("//h6[@class='card-title']"));

// remove item

// quick add

var qickadddesc=element(by.xpath("//div[@class='col-md-4 col-lg-3 d-md-block d-sm-none d-none']//label[contains(text(),'Know the Item? Add it directly to the Shopping Car')]"));

var quickaddheadertext=	 element(by.xpath("//div[@class='col-md-4 col-lg-3 d-md-block d-sm-none d-none']//strong[contains(text(),'Quick Add')]"));

var removeitem=	element(by.xpath("//a[@class='text-danger link-text btn-link px-0 delete-lineitem ng-star-inserted']"));
	
	var itemlabel=element(by.xpath("//div[@class='col-md-4 col-lg-3 d-md-block d-sm-none d-none']//b[contains(text(),'Item')]"));
	
	 var qtylabel= element(by.xpath("//div[@class='col-md-4 col-lg-3 d-md-block d-sm-none d-none']//b[contains(text(),'Qty')]"));
	
	// for view all product
	
	var allProducts= element(by.partialLinkText("All Products"));
	
	
	// list view
	
	
	
	var listview= element(by.xpath("//label[@class='btn btn-primary p-2 active']"));
	
	 var listicon=element(by.css("label.btn.btn-primary.p-2:nth-child(1)"));
	
	var imageicon= element(by.xpath("//div[1]/div[1]/div[1]/img[1]"));
	
	var listfirstimg= element(by.xpath("//product-card-list[1]//div[1]//div[1]//div[1]//img[1]"));
	
	var qtyfield=  element(by.xpath("//input[@id='quantity']"));
	
	
	//Grid view
	
	var gridlink= element(by.xpath("//label[contains(text(),'Grid')]"));
	
	 var gridImage1=element(by.xpath("//div[1]/archway-product-product-card[1]/div[1]/div[3]/img[1]"));
	
	// Table view
	 
	var tablelink= element(by.xpath("//label[contains(text(),'Table')]"));
	
	 var tablefirstimg= element(by.xpath("//product-card-table[3]//div[1]//div[1]//img[1]"));
	 
	 var tableqty= element(by.xpath("//form[@class='ng-pristine ng-valid ng-touched']//input[@id='quantity']"));
	
	
	
	// image description text labels
	
	
	 var uom= element(by.xpath("//div[1]/div[1]/div[2]/p[1]"));
	 
	 var status= element(by.xpath("//div[1]/div[1]/div[2]/p[2]"));
	 
	 var qtychk= element(by.xpath("//div[1]/div[1]/div[2]/p[3]"));
	 
	 var maxorderqty= element(by.xpath("//div[1]/div[1]/div[2]/p[4]"));
		
		var onhandqty= element(by.xpath("//archway-product-details[1]/div[1]/div[1]/div[2]/p[3]"));
		
		var effdate= element(by.xpath("//div[1]/div[1]/div[2]/p[6]"));
		
		var expdate= element(by.xpath("//div[1]/div[1]/div[2]/p[7]"));
		
		var prodctdesc= element(by.xpath("//div[1]/div[1]/div[2]/p[8]"));
		
		var addtocarticon= element(by.xpath("//*[@class='btn btn-primary ml-2']"));
	
	
	
	// Pagination
	
	var pagesize=element.all(by.css("div > ngb-pagination > ul > li"));
	
	
	//search
	
	var itemid= element(by.xpath("//div[2]/div[1]/div[2]/div[1]/p[1]"));
	
	var searchitem=element(by.xpath("//form[@class='ng-valid ng-touched ng-pristine']//input[@id='search-addon']"));
	
	var searcbtn= element(by.xpath("//button[@class='btn btn-primary btn-block small btn-width']//span[@class='d-md-none d-lg-inline'][contains(text(),'to Cart')]"));
	
	var hearticon= element(by.xpath("//*[@class='svg-inline--fa fa-heart fa-w-16']"));
	
	var itemnumber=element(by.xpath("//p[@class='card-text text-muted breakWord']"));
	
var firstimageaftersearching=element(by.xpath("//img[@class='card-img-top img-fluid flex-shrink-0']"));
	
// sort

var sort= element(by.xpath("//label[@class='pt-1 pr-1 d-none d-md-block'][contains(text(),'Sort By')]"));

// refine

var refine=element(by.xpath("//strong[contains(text(),'Refine By')]"));

// my fav link

var myfav= element(by.xpath("//label[contains(text(),'My Favorites')]"));

// qty error msg

var qtyerrormsg=element(by.xpath("//section[1]/div[1]/div[4]/div[1]/div[1]/div[2]/div[1]/form[1]/div[1]/div[2]/span[1]"));

// min qty error msg


var minqtyerrormsg=element(by.xpath("//section[1]/div[1]/div[4]/div[1]/div[1]/div[2]/div[1]/form[1]/div[1]/div[2]/span[1]"));

// item text

var items=element(by.xpath("//h5[contains(text(),'Items')]"));


// order summary text

var ordersummry=  element(by.xpath("//h5[contains(text(),'Order Summary')]"));

// remove text

var removeitem= element(by.linkText("Remove Item"));

//status

var Status= element(by.xpath("//h6[contains(text(),'Status')]"));

// price

var Price= element(by.xpath("//h6[contains(text(),'Price')]"));

// qty text

var Qty= element(by.xpath("//h6[contains(text(),'Qty')]"));


// continue shopping

var contniueshop=element(by.xpath("//button[@class='btn btn-primary']"));


// clear cart



var clearcart= element(by.xpath("//button[contains(text(),'Clear Cart')]"));


// subtotal

var subtotal= element(by.xpath("//b[contains(text(),'Subtotal')]"));

var subtoalvaltext=element(by.xpath("//span[@class='sub-total']"));

// total

var Total= element(by.xpath("//b[contains(text(),'Total')]"));

// display icon/text

var display=element(by.xpath("//label[@class='pt-1 pr-1 d-none d-md-block'][contains(text(),'Display')]"));







this.getgridlinktext= function(){
	
	
	return gridlink;
	
};





this.getdisplaytext= function(){
	
	return display;
	
	
};






this.getlisticontext= function(){
	
	return listicon;
	
	
};




this.getsubtoalactualvaluetext= function(){
	
	return subtoalvaltext;
	
	
};


this.getTotal= function(){
	
	return Total;
	
};





this.getsubtotal= function(){
	
	return subtotal;
	
};




this.getclearcart= function(){
	
	return clearcart;
	
};




this.getcontniueshopbtn= function(){
	
	return contniueshop;
	
};




this.getQty= function(){
	
	return Qty;
	
};



this.getpricetext= function(){
	
	return Price;
	
};




this.getStatustext= function(){
	
	return Status;
	
};




this.getremoveitem= function(){
	
	return removeitem;
	
};



this.getordersummry= function(){
	
	return ordersummry;
	
};



this.getitemstext= function(){
	
	return items;
	
};



this.getminqtyerrormsg= function(){
	
	return minqtyerrormsg;
	
};




this.getqtyerrormsg= function(){
	
	return qtyerrormsg;
	
};


this.getmyfav= function(){
	
	return myfav;
	
};




this.getsort= function(){
	
	return sort;
	
};

this.getrefine= function(){
	
	return refine;
	
};





this.getitemsincart= function(){
	
	
	return itemsincarttext;
	
};
	
	
	this.getvalue= function(str){
		
	var str= browser.getCurrentUrl();	
		
	return str.match(/-?\d+\.?\d*/);
	
	
	
	};
	
	this.clickOnSearchfirstimage= function(){
		
		 firstimageaftersearching.click();
		
	};
	
	
	this.getitemnumber= function(){
		
		return itemnumber;
		
	};
	
	this.gethearticon= function(){
		
		return hearticon;
		
		
	};
	
	this.getitemid= function(){
		
		return itemid;
		
	};
	
	this.entertableqty= function(value){
		
		page.highlightElement(tableqty);
		
		tableqty.clear();
		
		tableqty.sendKeys(value)
		
	};
	
	
	this.gettablefirstimg= function(){
		
		return tablefirstimg;
		
		
	};
	
	
	this.clickontablelink= function(){
		
		page.highlightElement(tablelink);
		
		tablelink.click();
		
	};
	
	this.qtyfield= function(value){
		
		page.highlightElement(qtyfield);
		
		qtyfield.clear();
		
		qtyfield.sendKeys(value)
		
		
	};
	
	this.clickonGridimage1= function(){
		
		
		page.highlightElement(gridImage1);
		
		gridImage1.click();
		
	};
	
	
	this.clickongridlink= function(){
		
		page.highlightElement(gridlink);
		
		gridlink.click();
		
	};
	
	this.clickonallProducts= function(){
		
		page.highlightElement(allProducts);
		
		allProducts.click();
		
	};
	
	this.getqickadddesc= function(){
		
		return qickadddesc;
		
		
	};
	
	this.getquickaddheadertext= function(){
		
		return quickaddheadertext;
		
	};
	
	this.clickaddtocarticon= function(){
		
		
		page.highlightElement(addtocarticon);
		
		addtocarticon.click();
	};
	
	this.getprodctdesc= function(){
		
		return prodctdesc;
		
		
	};
	
	this.getexpdate= function(){
		
		return expdate;
		
	};
	
	this.geteffdate= function(){
		
		return effdate;
		
	};
	
	this.getonhandqty= function(){
		
		return onhandqty;
	};
	
	this.getmaxorderqty= function(){
		
		return maxorderqty;
		
	};
	
	this.getstatus= function(){
		
		return status;
	};
	
	this.getqtychk= function(){
		
		return qtychk;
		
	};
	
	
	this.getuom= function(){
		
		return uom;
		
		
	};
	
	this.clickonFirstImage= function(){
		
		page.highlightElement(listfirstimg);
		
		listfirstimg.click();
		
	};
	
	this.getpagesize= function(){
		
		
		return pagesize;
		
	};
	
	this.clickOnList= function(){
		
		page.highlightElement(listicon);
		
		listicon.click();
		
	};
	
	this.clickonremoveitem= function(){
		
		page.highlightElement(removeitem);
		
		
		removeitem.click();
	};
	
	
	this.getcountericon= function(){
		
		return countericon;
		
	};
	
	this.getitemlabel= function(){
		
		return itemlabel;
		
	};
	
	
	this.getqtylabel= function(){
		
		return qtylabel;
		
	};
	
	
	
	
	this.clickonfirstHighlightItem= function(){
		
		page.highlightElement(firsthighlightitem);
		
		firsthighlightitem.click();
		
		
	};
	
	
	
	this.clickOnAddBTN= function(){
		
		page.highlightElement(searcbtn);
		
		searcbtn.click();
		
	};
	
	this.searchitem= function(value){
		
		page.highlightElement(searchitem);
		
		searchitem.clear();
		
		searchitem.sendKeys(value);
		
		
	};
	
	
	
	
	
	
	
	

	this.selectdropdown=function ( element, optionNum ) {
		  if (optionNum){
			    var options = element.all(by.tagName('option'))   
			      .then(function(options){
			        options[optionNum].click();
			      });
			  }
			};
	
	this.lablecarticon= function(){
		
		return cartIcon;
		
	};
	
	
	
	this.itemelement= function(){
		
		return item;
		
		
	};
	
	
	this.qtyelement= function(){
		
		return qty;
		
	};
	
	
	this.mssg= function(){
		
		return errormsg;
		
	};
	
	
	this.addTocartButn= function(){
		
		return addtocart;
		
	};
	
	
	this.enterItem= function(value){
		
		page.highlightElement(item);
		
		item.clear();
		
		item.sendKeys(value);
		
		
		
	};
	
this.enterqty= function(value){
	
	page.highlightElement(qty);
		
	qty.clear();
	
	qty.sendKeys(value);
		
		
		
	};
	
	this.clickOnAddtoCart= function(){
		
		page.highlightElement(addtocart);
		
		
		addtocart.click();
			
			
			
		};
		
	this.clickOnCartIcon= function(){
		
		page.highlightElement(cartIcon);
		
		
		cartIcon.click();
		
		
	};
	
	this.clickOnCheckout= function(){
		
		page.highlightElement(checkout);
		
		
		checkout.click();
		
	};
	
	this.getsubtotalvalue= function(str){
		
		return str.replace(/[^0-9\.]+/g,"");
		
		
		
	};
	
	
	

	
};

module.exports= new addtoCart();