var ConfirmOrder;

ConfirmOrder= function(){
		
	
	var orderSubmit= element(by.xpath("//strong[contains(text(),'Order Submitted')]"));
	
	var orderline= element(by.xpath("//li[1][contains(text(),'Thank you for your order. Please print this page a')]"));
	
	var ordernumber= element(by.xpath("//span[contains(text(),'PN2122')]"));
	
	var datesubmited= element(by.xpath("//span[contains(text(),'11/20/2019')]"));
	
	var shippingMethod=element(by.xpath("//div[1]/span[3]"));
	
	var subtotal= element(by.xpath("//div[1]/span[4]"));
	
	var shippingCharge= element(by.xpath("//div[1]/span[5]"));
	
	var total= element(by.xpath("//span[@class='order-total']"));
	
	
	
	
	
	
	
	
	
};

module.exports= new ConfirmOrder();