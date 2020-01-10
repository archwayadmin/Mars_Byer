describe("Forgot password", function() {
	
	
	it("verify forgot password functionality", function() {
		
		
		var forgotpwd=element(by.xpath("//a[contains(text(),'Forgot Password')]"));
		
		
		// verificion of presence of forgot password element
		expect(forgotpwd.isPresent()).toBeTruthy();
		
		if(forgotpwd.isPresent()){
			
			
			forgotpwd.click();
			
			element(by.xpath("//input[@id='username']")).sendKeys("test@emailid");
			
			element(by.xpath("//button[@id='submitBtn']")).click();
			
			
			
		}
		
		
		
		
	});
	
	
	
	
});