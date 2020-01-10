var loginPageObj = require('./../../pageobjects/LoginPage/LoginPage.js');

var page = require('./../../pageobjects/BasePage/BasePage.js');

var OR = require('./../../json/objects.json');

var tdata = require('./../../json/login.json');

var logger= require('./../../log');



describe("Verify Login", function() {
	

	beforeEach(function() {
        originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;
     });

     afterEach(function() {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
     });
	



    it('should login the user', function () {
    	
    	
        
          
    	     loginPageObj.openurl(OR.testsiteurl);
    	     
    	  
    	     
    	     logger.log('info','Launch the Core Buyer URL');
    
         
             browser.driver.manage().window().maximize();
             
             logger.log('info','maximize the windows');

          
         
    });
    
   
    it("Forgot password link present on the Login page", function() {
    	
        var forgotbtn=loginPageObj.getforpwd();
        
        expect(forgotbtn.isDisplayed()).toBeTruthy();
        
       
    	
        
     
        	});
    
    
    
    
    it("Create Account link present on the Login page", function() {
    	
        var createacctlink=loginPageObj.getcreateaccountlink();
        
        expect(createacctlink.isDisplayed()).toBeTruthy();
        
        
        
        	
        	});
    
    
    
    
    it("Contact Us  link present on the Login Page", function() {
    	
    	
   	 var contactbtn=loginPageObj.getcontatus();
   	    
   	    expect(contactbtn.isDisplayed()).toBeTruthy();
   	    
   	    	
   	    	
   	    });
       	
       
       	
      
    
    
    it("Verify comapny copyright text at the footer of the login page", function() {
   	 
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
    
    expect(usernamelabel).toBeTruthy();
    
    	
    });
    
    
    
    
    it("Verify password label is present", function() {
      	
      var pawdlabl=loginPageObj.getpasswordlabel();
      
      
      expect(pawdlabl).toBeTruthy();	
      	
      	
      
      });
        
      
   
      
    
    it("Verify Remember Me check box", function() {
    	
        var chkboxlbl=loginPageObj.getchkboxlbl();
        
        expect(chkboxlbl.isPresent()).toBeTruthy();
        
        	
        });
    
    
    
    
    it("verify the title of the Page", function() {
    	
    	expect(browser.getTitle()).toContain(tdata.testdata.title);
    	
    
    	});
    	
 
    
    it("veriy all links present on page", function() {
    	
    	element.all(by.tagName("a")).getText().then(function(text){
    		
    		for(var i=0; i<text.length; i++){
    			
    			
    			console.log(text[i]);
    		}
    		
    		
    		
    	});
    	
    	
    	
    	
    });
    
    it("User Login successfully ", function() {
    	
    	
    	
    	if(tdata.testdata.username=="TestFordQA" && tdata.testdata.password=="fails345"){
    		
    		
    	
    	
    
    	 loginPageObj.EnterUsername(tdata.testdata.username);
    	 
    	   logger.log('info','Enter the username');
         

         loginPageObj.EnterPassword(tdata.testdata.password);
         
         logger.log('info','Enter the password');
       

         loginPageObj.ClickLoginButton();
         
         logger.log('info','click on Button');
         
         browser.sleep(6000);
         
         
         var url=browser.getCurrentUrl();
     	
     	expect(url).toContain(tdata.testdata.homaepageurl);
    	
    	}
    	
    	else if(tdata.testdata.username!="TestFordQA" || tdata.testdata.password!="fails345") {
    		

       	   loginPageObj.EnterUsername(tdata.testdata.username);
       	 
       	   logger.log('info','Enter the username');
            

            loginPageObj.EnterPassword(tdata.testdata.password);
            
            logger.log('info','Enter the password');
          

            loginPageObj.ClickLoginButton();
            
            logger.log('info','click on Button');
            
            browser.sleep(6000);
    		
    		
    		
    		console.log("user not found");
			
			var errormsg=element(by.xpath("//div[@id='toast-container']"));
	    	
	    	errormsg.getText().then(function(text){
	    		
	    		console.log("Error message is"+text);
	    		
	    		expect(text).toBeTruthy();
	    		
	    	});
    	
    		
    		
    		 
    		
    	}
    	
    });
    
  
   

});