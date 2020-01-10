var createaccount;


createaccount= function(){
	
	
	var createccountbtn=element(by.xpath("//button[@class='btn btn-link']"));
	

    var username=element(by.xpath("//input[@id='Username']"));
	
	var pwd=element(by.xpath("//input[@id='Password']"));
	
	var conpwd=element(by.xpath("//input[@id='ConfirmPassword']"));
	
	var fname=element(by.xpath("//input[@id='FirstName']"));
	
	var lname=element(by.xpath("//input[@id='LastName']"));
	
	var phoe=element(by.xpath("//input[@id='Phone']"));
	
	var email=element(by.xpath("//input[@id='Email']"));
	
	
this.clickcreateccountbtn= function(){
	
	createccountbtn.click();
	
};



this.entertusername= function(value){
	
	username.clear();
	
	username.sendKeys(value);
	
};

this.entertpwd= function(value){
	
	pwd.clear();
	
	pwd.sendKeys(value);
	
};


this.entertconpwd= function(value){
	
	conpwd.clear();
	
	conpwd.sendKeys(value);
	
};


this.entertfname= function(value){
	
	fname.clear();
	
	fname.sendKeys(value);
	
};




this.entertlname= function(value){
	
	lname.clear();
	
	lname.sendKeys(value);
	
};





this.entertphoe= function(value){
	
	phoe.clear();
	
	phoe.sendKeys(value);
	
};


this.entertemail= function(value){
	
	email.clear();
	
	email.sendKeys(value);
	
};
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
};

module.exports= new createaccount();