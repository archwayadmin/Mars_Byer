var loginPageObj = require('./../../pageobjects/LoginPage/LoginPage.js');

var page = require('./../../pageobjects/BasePage/BasePage.js');

var homepageobj = require('./../../pageobjects/HomePage/HomePage.js');

var tdata = require('./../../json/HomePage.json');

var UserMenuobj = require('./../../pageobjects/UserMenu/UserMenu.js');


var logger= require('./../../log');

describe(" Verifying Home Page ", function() {
	
	 originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
     jasmine.DEFAULT_TIMEOUT_INTERVAL = 200000;
  });

  afterEach(function() {
   jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });
  
  browser.ignoreSynchronization = true;
	
	
	
	
	it("should find all links on Home Page", function() {
		
		var  allLinks = element.all(by.tagName('a'));
		
		allLinks.count().then(function(link_tally){
			
			allLinks.getAttribute("href").then(function(result){
				
				console.log(result);
				
			});
			
		      console.log('There are a total of ' + link_tally + " links on this page with proper tags.")
		    });
		  browser.sleep(2000);
		
		
		
		
		
		
	});
	
	
	
	it("Verify Presence of Logo", function() {
    	
    	
	    var logo=homepageobj.getlogo();
	    
	    expect(logo.isPresent()).toBeTruthy();
	    	
	    });
	
	
	    
	    
	    it("Verify URL of the Home page once user is logged successfully ", function() {
	    	
	        var url= browser.getCurrentUrl();
	    	
	    	expect(url).toContain(tdata.testdata.homepageurl);
	    	
	    
	    
	    
	    
	    	
	    });
	    
	    
	    
	    
	    
	    xit("Verify Home icon is present on the Landing/Home page after Login", function() {
	    	
	    	var home = homepageobj.gethome();
	    	
	    	expect(home.isDisplayed()).toBeTruthy();
	    	
	    	expect(home.isEnabled()).toBeTruthy();
	    	
	    	expect(home.isPresent()).toBeTruthy();
	    	
	    	home.getText().then(function(text){
	    		
	    		expect(text).toContain(tdata.testdata.hometext);
	    		
	    	});
	    	
	    	
	    	
	    	
	    });
	    
	    
	it("Verify BrowseProduct icon is present on the Landing/Home page after Login", function() {
	    	
		var browseProduct =homepageobj.getbrowseProduct();
		
		      expect(browseProduct.isDisplayed()).toBeTruthy();
		      
	    	  expect(browseProduct.isPresent()).toBeTruthy();
	    	
	    	expect(browseProduct.isEnabled()).toBeTruthy();
	    	
	    	browseProduct.getText().then(function(text){
	    		
	    		expect(text).toContain(tdata.testdata.BrowseProductstext);
	    		
	    	});
	    	
	    	
	    	
	    	
	    });
	    

	xit("Verify MyOrders icon is present on the Landing/Home page after Login", function() {
		
		var myOrder = homepageobj.getmyOrder();
		
		    expect(myOrder.isDisplayed()).toBeTruthy();
	    	
	    	expect(myOrder.isPresent()).toBeTruthy();
	    	
	    	expect(myOrder.isEnabled()).toBeTruthy();
	    	
	    	myOrder.getText().then(function(text){
	    		
	    		expect(text).toContain(tdata.testdata.MyOrdersText);
	    		
	    	});
	    	
	    	
	    	
	    	
	    });
	
	
	it("Verify Report icon is present on the Landing/Home page after Login", function() {
		
		var reporticon= homepageobj.getreporticon();
	    	
	    	expect(reporticon.isPresent()).toBeTruthy();
	    	
	    	expect(reporticon.isEnabled()).toBeTruthy();
	    	
	    	reporticon.getText().then(function(text){
	    		
	    		expect(text).toContain(tdata.testdata.ReportsText);
	    		
	    	});
	    	
	    	
	    	
	
	xit("Verify  show All button on Home Page", function() {
		
		browser.sleep(5000);
			
	
			
		var showallbtn=homepageobj.getshowallbtn();
			
		expect(showallbtn.isDisplayed()).toBeTruthy();
		
		expect(showallbtn.isPresent()).toBeTruthy();
		
		expect(showallbtn.isEnabled()).toBeTruthy();
		
		showallbtn.click();
		
		browser.sleep(5000);
		
		var url="https://archway-premiernutrition-qa.azurewebsites.net/orders";
		

		expect(browser.getCurrentUrl()).toContain(url);
		
		// navigating back to home page again
		
		
		browser.sleep(4000);
		
		
		});
		



	xit('should return 200 and contain proper body', function() {
		
		var  allLinks = element.all(by.tagName('a'));
		 page.httpget(allLinks).then(function(result) {
		    allLinks.count().then(function(statusCode){
		      console.log('Status code is: ' + statusCode)
		    });
		      expect(result.statusCode).toBe(200);
		      expect(result.bodyString).toContain('Apache');
		  });
		});



	it("Verify Search Option on Home Page", function() {
		
		var searchoption=homepageobj.getsearchoption();
		
		expect(searchoption.isDisplayed()).toBeTruthy();
		
		expect(searchoption.isPresent()).toBeTruthy();
		
	});

	
	

	it("Verify Cart Icon", function() {
		
		var carticon= homepageobj.getcarticon();
		
		expect(carticon.isDisplayed()).toBeTruthy();
		
		expect(carticon.isPresent()).toBeTruthy();
		
		
		
	});
	

	
	xdescribe("Verify order summary", function() {
		
		
		

		it("Verify  download Order summary icon  is present on the Landing/Home page after Login", function() {
			
			var downloadsummry= homepageobj.getdownloadsummry();
		    	
		    	expect(downloadsummry.isPresent()).toBeTruthy();
		    	
		    	expect(downloadsummry.isEnabled()).toBeTruthy();
		    	
		    	downloadsummry.getText().then(function(tooltip){
		    		
		    		
					expect(tooltip).toContain(tdata.testdata.downloadsummary);
				});
		    	
		    	
		    	
		    });
		
		
		it("Verify Total Order count text", function() {
			
			
			var totalordercount=element(by.xpath("//div[contains(text(),'Total Orders Count')]"));
			
			totalordercount.getText().then(function(text){
				
				console.log("total order count is :"+text);
				
				expect(text).toContain("Total Orders Count");
				
			});
			
			
		});
		
		
		it("Verify Orders Count for Today text", function() {
			
			
			var ordercounttody=element(by.xpath("//div[contains(text(),'Orders Count for Today')]"));
			
			ordercounttody.getText().then(function(text){
				
				console.log(" order count for today text is :"+text);
				
				expect(text).toContain("Orders Count for Today");
				
			});
			
			
		});
		
		
		it("Verify Orders Count for Current Week text", function() {
			
			
			var ordercountforweek=element(by.xpath("//div[contains(text(),'Orders Count for Current Week')]"));
			
			ordercountforweek.getText().then(function(text){
				
				console.log(" order Count for Current Week text is :"+text);
				
				expect(text).toContain("Orders Count for Current Week");
				
			});
			
			
		});
		
		
		it("Verify Orders Count for Current Month text", function() {
			
			
			var ordercountforcurrntmonth=element(by.xpath("//div[contains(text(),'Orders Count for Current Month')]"));
			
			ordercountforcurrntmonth.getText().then(function(text){
				
				console.log("Orders Count for Current Month text is :"+text);
				
				expect(text).toContain("Orders Count for Current Month");
				
			});
			
			
		});
		
		
		it("Verify Orders Count for Current Quarter text ", function() {
			
			
			var ordercountforqarter=element(by.xpath("//div[contains(text(),'Orders Count for Current Quarter')]"));
			
			ordercountforqarter.getText().then(function(text){
				
				console.log("total order count is :"+text);
				
				expect(text).toContain("Orders Count for Current Quarter");
				
			});
			
			
		});
		
		
		it("Verify Orders Count for Current Year text", function() {
			
			
			var ordercountforyear=element(by.xpath("//div[contains(text(),'Orders Count for Current Year')]"));
			
			ordercountforyear.getText().then(function(text){
				
				console.log("Orders Count for Current Year text is :"+text);
				
				expect(text).toContain("Orders Count for Current Year");
				
			});
			
			
		});
		
		
		
		

		
		
	});
	
	
	
	



	xit("Verify carousel image present on Home Page", function() {
		
		
		var caroimg=homepageobj.getcaroimg();
		
		expect(caroimg.isDisplayed()).toBeTruthy();
		
		expect(caroimg.isPresent()).toBeTruthy();
		
	});


	xit("Verify Announcement section on Home Page", function() {
		
		var annohome=homepageobj.getannohome();
		
		expect(annohome.isDisplayed()).toBeTruthy();
		
		expect(annohome.isPresent()).toBeTruthy();
		
		expect(annohome.getText()).toContain(tdata.testdata.AnnouncementsText);
		
	});
	
	

});
	
	
	
	xdescribe("Verify Featured Products Text is present on Home Page ", function() {
		
		
		it("Verify for Featured Products on Home Page", function() {
			 
			var featureprod=	homepageobj.getfeatureprod();

			expect(featureprod.isDisplayed()).toBeTruthy();

			expect(featureprod.isPresent()).toBeTruthy();

			expect(featureprod.getText()).toContain(tdata.testdata.FeaturedProductsText);
				
				
			});
		
		
		
		
		
		
	});
	
	
	
	xdescribe("Verify About website section/text is present", function() {
		
		
		it("user see about website section", function() {
			
			
			var websiteicon=homepageobj.getwebsiteicon();
			
			expect(websiteicon.isDisplayed()).toBeTruthy();
			
			expect(websiteicon.isPresent()).toBeTruthy();
			
			expect(websiteicon.getText()).toContain(tdata.testdata.AboutWebsiteText);	
			
		});
		
		xit("Verification About website contents", function() {
			
		var abtwebcontent=homepageobj.getabtwebcontent();
			
		expect(abtwebcontent.isDisplayed()).toBeTruthy();
		
		expect(abtwebcontent.isPresent()).toBeTruthy();
		
		expect(abtwebcontent.getText()).toContain(tdata.testdata.websiteText);
		
		
		
		});
		
	});
	
	
	
	xdescribe(" Verify Order History Text", function() {
		
		
		it("Verify Order History text is present on the Landing/Home page after Login", function() {
			
			var orderhistory=homepageobj.getorderhistory();
		    	
		    	expect(orderhistory.isPresent()).toBeTruthy();
		    	
		    	orderhistory.getText().then(function(text){
		    		
		    		expect(text).toContain(tdata.testdata.OrderHistoryText);
		    		
		    	});
		    	
		    	
		    	
		    	
		    });
		
         it("Verify  Order Summary text is present on the Landing/Home page after Login", function() {
			
			var ordersummary=homepageobj.getordersummar();
		    	
		    	expect(ordersummary.isPresent()).toBeTruthy();
		    	
		    	ordersummary.getText().then(function(text){
		    		
		    		expect(text).toContain(tdata.testdata.OrderSummaryText);
		    		
		    	});
		    	
		    	
		    	
		    	
		    });
		
		
		
		
		
		
		
		it("Verify the contents of order history link", function() {
			
			// first link present in orderhistory tab
			
			var orderhislink=homepageobj.getorderhislink();
			
			expect(orderhislink.isDisplayed()).toBeTruthy();
			
			expect(orderhislink.isPresent()).toBeTruthy();
			
			expect(orderhislink.isEnabled()).toBeTruthy();
			
			orderhislink.click();
			
			browser.sleep(5000);
			
			//clciking on view details button to see details
			
		var viewdetails=homepageobj.getviewdetails();
		
		expect(viewdetails.isDisplayed()).toBeTruthy();
		
		expect(viewdetails.isPresent()).toBeTruthy();
		
		var url="https://archway-premiernutrition-qa.azurewebsites.net/home";
		
		expect(browser.getCurrentUrl()).toContain(url);
		
		//viewdetails.click();
		
		
		
		


		});
		
		it("Verify Order date text is present", function() {
			
		var orderdate=	homepageobj.getorderdate();
		
		expect(orderdate.isPresent()).toBeTruthy();
		
		expect(orderdate.getText()).toContain(tdata.testdata.OrderDateText);
			
			
			
		});
		

		it("Verify Order Status text is present", function() {
			
		var orderstatus=	homepageobj.getorderstatus();
		
		expect(orderstatus.isPresent()).toBeTruthy();
		
		expect(orderstatus.getText()).toContain(tdata.testdata.OrderStatusText);
			
			
			
		});
		

		it("Verify Status Date text is present", function() {
			
			browser.sleep(2000);
			
		var statusdate=	homepageobj.getstatusdate();
		
		
		expect(statusdate.getText()).toContain(tdata.testdata.statusdate);
			
			
			
		});
		

		it("Verify Total Items text is present", function() {
			
		var totalitem=	homepageobj.gettotalitem();
		
		//expect(totalitem.isPresent()).toBeTruthy();
		
		expect(totalitem.getText()).toContain(tdata.testdata.TotalItems);
			
			
			
		});
		

		it("Verify Total Cost text is present", function() {
			
		var totalcost=	homepageobj.gettotalcost();
		
		expect(totalcost.isPresent()).toBeTruthy();
		
		expect(totalcost.getText()).toContain(tdata.testdata.TotalCost);
			
			
			
		});
		
		
		
	
	});
	
	
	
	xdescribe("Verify Contact US link", function() {
		
		it("Verify Conact US links exist exist in footer", function() {
			
			
			var conatctus=homepageobj.getconatctus();
			
			expect(conatctus.isDisplayed()).toBeTruthy();
			
			expect(conatctus.isPresent()).toBeTruthy();
			
			expect(conatctus.isEnabled());
			
		
		});
		
		
		
		xit(" Verification of Name text  is present  ", function() {
			
			
			var nametext= homepageobj.getnametext();
	         
	         expect(nametext.isDisplayed()).toBeTruthy();
	         
	         expect(nametext.isPresent()).toBeTruthy();
	         
	         expect(nametext.getText()).toContain(tdata.testdata.nametext);
				
			});
		
		xit(" Verification Email text is present", function() {
			
			
			var emailtext= homepageobj.getemailtext();
	         
	         expect(emailtext.isDisplayed()).toBeTruthy();
	         
	         expect(emailtext.isPresent()).toBeTruthy();
	         
	         expect(emailtext.getText()).toContain(tdata.testdata.emailtext);
				
			});
		
		
		xit("Verification Contact  Number text is present", function() {
			
			
			var contactltext= homepageobj.getcontactltext();
	         
	         expect(contactltext.isDisplayed()).toBeTruthy();
	         
	         expect(contactltext.isPresent()).toBeTruthy();
	         
	         expect(contactltext.getText()).toContain(tdata.testdata.contacttext);
				
			});
		
		
		
		xit(" Verification Message text is present", function() {
			
			
			var messgetext= homepageobj.getmessgetext();
	         
	         expect(messgetext.isDisplayed()).toBeTruthy();
	         
	         expect(messgetext.isPresent()).toBeTruthy();
	         
	         expect(messgetext.getText()).toContain(tdata.testdata.messagetext);
				
			});
		
		
		
		
		xit("Verify Submit button presence  ", function() {
			
			var sbtbtn=homepageobj.getsbtbtn();
			
			expect(sbtbtn.isDisplayed()).toBeTruthy();
			
			expect(sbtbtn.isPresent()).toBeTruthy();
			
		});
		
		
		xit("Verify Cancell Button presence ", function() {
			
			var cancelbtn=homepageobj.getsbtbtn();
			
			expect(cancelbtn.isDisplayed()).toBeTruthy();
			
			expect(cancelbtn.isPresent()).toBeTruthy();
			
		});
		
		
		
		xit("Navigating back and refresh the browser", function() {
			
            //browser.navigate().back(); // navigating back to home
			
			//browser.navigate().refresh();// refreshing the page
			
		});
		
		
			 
			
		
		
	});
	
	xdescribe(" Verify FAQ", function() {
		
		
		it("verify FAQ link ", function() {
			
		var faq=homepageobj.getfaq();
		
		expect(faq.isDisplayed()).toBeTruthy();
		
		expect(faq.isPresent()).toBeTruthy();
		
		if(faq.isPresent()){
			
			 browser.executeScript('window.scrollTo(0,document.body.scrollHeight)');
			 
			 browser.sleep(3000);
			
			faq.click();
			
		
			var expurl="https://archway-premiernutrition-qa.azurewebsites.net/faq";
			
			expect(browser.getCurrentUrl()).toBe(expurl);
			
			
			
		}
			
			
			
		});
		
       xit("Navigating back and refresh the browser", function() {
			
            //browser.navigate().back(); // navigating back to home
			
			//browser.navigate().refresh();// refreshing the page
			
		});
		
	});
	
	
	describe(" Vevrify Copyright Text", function() {
		
		it("Verify Copyright at the Footer", function() {
			
			var copyrightext=homepageobj.getcopyrightext();
			
			
			copyrightext.getText().then(function(test){
				
				console.log("company policy text:"+test);
				
				expect(test).toContain(tdata.testdata.copyrightText);
				
				
			});
			
			
			
			
		});
		
	});
	
	
	
	describe("Verify UserMenu", function() {
		
		
		it("Verify UserCircle", function() {
			
		var usercir	=UserMenuobj.getuserCircleElement();
		
		expect(usercir.isDisplayed()).toBeTruthy();
		
		expect(usercir.isPresent()).toBeTruthy();
			
		usercir.click();// clicking on the User Menu
		
		browser.sleep(5000);
			
			
		});
		
		
		
		
		it("Verify presence of User profile", function() {
			
		var userprofile=UserMenuobj.getprofileElement();
		
		expect(userprofile).toBeTruthy();
		
		expect(userprofile.isPresent()).toBeTruthy();
		
		userprofile.getText().then(function(text){
			
			console.log(text);
			
			expect(text).toContain(tdata.testdata.myprofile);
			
			
		});
		
		
			
			
		});
		
		
		xit("Verify presence of my Orders", function() {
			
			
			var myorders=UserMenuobj.getmyorders();
			
			expect(myorders).toBeTruthy();
			
			expect(myorders.isPresent()).toBeTruthy();
			
			myorders.getText().then(function(text){
				
				console.log(text);
				
				expect(text).toContain(tdata.testdata.MyOrdersText);
				
				
			});
			
			
			
			
		});
		
		
		
		it("Verify User Logout Option", function() {
			
			
			
        var userlogout=UserMenuobj.getlogoutElement();
			
			expect(userlogout).toBeTruthy();
			
			expect(userlogout.isPresent()).toBeTruthy();
			
			userlogout.getText().then(function(text){
				
				console.log(text);
				
				expect(text).toContain(tdata.testdata.logout);
				
				browser.sleep(3000);
				
				
			});
			
			
			
			
			
			
			
			
		});
		

		



		
		
		
		
		
	});
	
	
});
	
