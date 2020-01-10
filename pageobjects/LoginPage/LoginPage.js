
var page = require('./../BasePage/BasePage.js');
var OR= require('./../../json/objects.json');
var LoginPage;
LoginPage = function () {
	
	var forpwd=	element(by.xpath("//button[@class='btn btn-link btn-block text-center']"));
	
	var contatus=	element(by.xpath("//a[contains(text(),'Contact Us')]"));
	
   var companycopyright=element(by.xpath("//small[contains(text(),'© 2019 ARCHWAY MARKETING SERVICES')]"))
	
  var usernamelabel=element(by.xpath("//label[contains(text(),'User Name')]"));

   var passwordlabel=element(by.xpath("//label[contains(text(),'Password')]"));

  var chkboxlbl=element(by.xpath("//label[contains(text(),'Remember Me')]"));
  
 var accounttext= element(by.xpath("//h3[@class='headline-text']"));
 
 var imglogo=element(by.xpath("//img[@class='img-fluid']"));
 
 var createaccountlink=element(by.xpath("//button[@class='btn btn-link']"));
 
 
 this.openurl= function(value){
	 
	browser.get(value);
	 
	
 };
 
 
 this.clickonCreateaccount= function(){
	 
	 createaccountlink.click();
	 
	 
 };
 
 this.getcreateaccountlink= function(){
	 
	 
 return createaccountlink
	 
 };
 
 this.getforpwd= function(){
	 
	 return forpwd;
	 
 };
 
 
this.getcontatus= function(){
	 
	 return contatus;
	 
 };
 
 
 
 this.getimglogo= function(){
		
		return imglogo;
		
	};
 
 
 this.getaccounttext= function(){
		
		return accounttext;
		
	};
 



this.getchkboxlbl= function(){
	
	return chkboxlbl;
	
};



this.getpasswordlabel= function(){
	
	return passwordlabel;
	
};


this.getUsernameLabel= function(){
	
	return usernamelabel;
	
};



this.getcompanycopyrightlable= function(){
	
	
	return companycopyright;
	
};


	
	this.getforpwdlable= function(){
		
		
		return forpwd;
		
	};
	
	
	
	this.getcontatus= function(){
		
		
		return contatus;
		
	};
	
	
	
	
	
	this.clickonforpwd= function(){
		
		forpwd.click().then(null, function(err){
			
			
			 console.log("error occurred is : "+ err.name);
		});
		
		
	};
	
	
	
	this.clickoncontatus= function(){
		
		contatus.click().then(null, function(err){
			
			
			 console.log("error occurred is : "+ err.name);
		});
		
		
	};
	
	
	
	

    var usernameTxtBx = element(by.xpath(OR.locators.Loginpage.username));
    
    var passwordTxtBx = element(by.xpath(OR.locators.Loginpage.password));
   
    var loginBtn = element(by.xpath(OR.locators.Loginpage.submitBtn));
  
    
    this.getusernameTxtBx= function(){
    	
    	return usernameTxtBx;
    	
    	
    };
    
    
    this.getpasswordTxtBx= function(){
    	
    	return passwordTxtBx;
    	
    	
    };
   
    
    

    
    this.EnterUsername = function (value) {
    	
    	if(typeof value =="" ||typeof  value==null || typeof value ==undefined ||typeof value=='string' ){
    		
        	page.highlightElement(usernameTxtBx);
        	
        	usernameTxtBx.clear();
        	
        	browser.sleep(4000);
        	
            usernameTxtBx.sendKeys(value);
    		
    	}
    	

    };

    this.EnterPassword = function (value) {
    	
      if(typeof value =="" ||typeof  value==null || typeof value ==undefined ||typeof value=='string'  ){
    		
        	page.highlightElement(usernameTxtBx);
        	
        	passwordTxtBx.clear();
        	
        	passwordTxtBx.sendKeys(value);
    		
    	}
    };

   

    this.ClickLoginButton = function () {
    	
    	page.highlightElement(loginBtn);
    	
    
        loginBtn.click().then(null, function(err){
        	
        	console.log(" error occurred is : "+ err.name)
        }).then(function(text){
        	
        	console.log("no error")
        	
        });
        
    };
    
    
    
    
    

    this.ClickLoginButton1 = function () {
    	
    	page.highlightElement(loginBtn);
    	
    
        loginBtn.click().then(null, function(err){
        	
        	console.log(" error occurred is : "+ err.name)
        }).then(function(text){
        	
        	console.log("no error")
        	
        });
        
    };
    
    
    
    
    this.getAllLinks= function(){
    	
      element.all(by.tagName("a")).getText().then(function(text){
			
			for(var i=0; i<text.length; i++){
				
				
				console.log(text[i]);
			}
			
			
			
		});
    	
    	
    	
    	
    };  
    
    
    
    
    

};

module.exports = new LoginPage();


