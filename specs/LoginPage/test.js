var loginPageObj = require('./../../pageobjects/LoginPage/LoginPage.js');

var page = require('./../../pageobjects/BasePage/BasePage.js');

var homepageobj = require('./../../pageobjects/HomePage/HomePage.js');

var OR = require('./../../json/objects.json');

var tdata = require('./../../json/login.json');

//var xl=require('./../../util/ReadExcel.js');

var dataReaderObj=require('./../../utils/DataReader.js');

var logger= require('./../../log');



browser.manage().timeouts().implicitlyWait(4000);

describe(' Verifying the Login Page - ', function () {
	
	beforeEach(function() {
        originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 200000;
     });

     afterEach(function() {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
     });
     
   browser.ignoreSynchronization = true;
     
	
	
	
    var dataReadPromise = dataReaderObj.ReadDataFromFile('testdata', 'login');
    var username = [];
    var password = [];
    var url = [];

    beforeEach(function () {
        dataReadPromise.then(function (results) {
            for (var i = 0, len = results.length; i < len; i++) {
                url[i] = results[i].url;
                username[i] = results[i].username;
                password[i] = results[i].password;
                if (typeof url[i] == 'string') {
                    url[i] = url[i];
                }
                else {
                    url[i] = url[i].text;
                }
            }
        });
    });
    
    

    it('Verify the title of the Page', function () {
        dataReadPromise.then(function () {

            page.OpenUrl(url[0]);
            
            logger.log('info','Launch the Core Buyer URL');
            
            browser.driver.manage().window().maximize();
            
            expect(browser.getTitle()).toContain(tdata.testdata.title);
            
            console.log("Tile of the page is :"+tdata.testdata.title);


        });
    });
    
    
it("should find all links", function() {
		
		var  allLinks = element.all(by.tagName('a'));
		
		allLinks.count().then(function(link_tally){
			
			allLinks.getAttribute("href").then(function(result){
				
				console.log(result);
				
			});
			
		      console.log('There are a total of ' + link_tally + " links on this page with proper tags.")
		    });
		  browser.sleep(2000);
		
		
		
		
		
		
	});


    
    
  it("Forgot password link present on the Login page", function() {
    	
    var forgotbtn=	element(by.xpath("//a[contains(text(),'Forgot Password')]"));
    
    expect(forgotbtn.isDisplayed()).toBeTruthy();
    
    expect(forgotbtn.isDisplayed()).toBeTruthy();
    
    forgotbtn.getAttribute("href").getText().then(function(text){
    	
    	console.log("Forgot password :"+text);
    	
    });
    
    	
    	});
    	
    
    	

    
 it("Contact Us  link present on the Login Page", function() {
    	
    	
	 var contactbtn=element(by.xpath("//a[@class='mr-2']"));
	    
	    expect(contactbtn.isDisplayed()).toBeTruthy();
	    
	    expect(contactbtn.isDisplayed()).toBeTruthy();
	    
	    contactbtn.getAttribute("href").getText().then(function(text){
	    	
	    	console.log("Contact Us :"+text);
	    	
	    });
    	
    
    	
    });
 
 
 it("Verify comapny copyright text", function() {
	 
	var company= loginPageObj.getcompanycopyrightlable();
	 
	 
	company.isPresent().then(function(result){
	    	
	    	if(result){
	    		
	    		
	    		company.getText().then(function(text){
	    			
	    			
	    			console.log("company policy text is"+text);
	    			
	    			expect(text).toBeTruthy();
	    			
	    			
	    			
	    		});
	    		
	    		
	    		
	    		
	    	}
	    	
	    	
	    	
	    	
	    });
	    
	    
	 
 	
 });
    
    
    it("Verify Username labeling is preseet", function() {
    	
    var usernamelabel=	loginPageObj.getUsernameLabel();
    
    
    usernamelabel.isPresent().then(function(result){
    	
    	if(result){
    		
    		
    		usernamelabel.getText().then(function(text){
    			
    			
    			console.log("Username label is"+text);
    			
    			expect(text).toBeTruthy();
    			
    			expect(text).toContain(tdata.testdata.userlabel);
    			
    		});
    		
    		
    		
    		
    	}
    	
    	
    	
    	
    });
    
    
 	
    	
    	
    });
    
    
  it("Verify password label is present", function() {
    	
    var pawdlabl=loginPageObj.getpasswordlabel();
    
    
    pawdlabl.isPresent().then(function(result){
    	
    	if(result){
    		
    		
    		pawdlabl.getText().then(function(text){
    			
    			
    			console.log("password label is"+text);
    			
    			expect(text).toBeTruthy();
    			
    			
    			
    		});
    		
    		
    		
    		
    	}
    	
    	
    	
    	
    });
      
    
  
    	
    	
    });
    
    
  it("Verify Remember Me check box", function() {
    	
    var chkboxlbl=loginPageObj.getchkboxlbl();
    
    expect(chkboxlbl.isPresent()).toBeTruthy();
    
    chkboxlbl.getText().then(function(text){
    	
    	console.log("Remember check is "+text);
    	
    	expect(text).toContain(tdata.testdata.rememberme);
    	
    	
    	
    });
    
    
  	
    
    	
    });
    
    
 it("Verify  if chekcbox is selected", function() {
    	
    	 var chkboxlbl=loginPageObj.getchkboxlbl();
    	
    	 expect($('[id="rememberMeId"]').isSelected()).toBeFalsy();
    	
    		
    		
    		
    	});
    	
    	
    	
    	

    
    it("Verify if user is logeed in successfully to the  application", function() {
    	
   
        loginPageObj.EnterUsername(username[0]);
     
        loginPageObj.EnterPassword(password[0]);
     

        loginPageObj.ClickLoginButton();
        
         browser.sleep(8000);
         
         
    	
    	var ele1=homepageobj.element();
    	
    	expect(ele1.isPresent()).toBeTruthy();
    	
    	
    	
 
    });
       


});