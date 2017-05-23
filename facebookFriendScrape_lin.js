/*
	Welcome,
	This casper-js script will aim to take a User's login credentials as args1 (email) & args2 (password), and return all of the User's friends by
	name & email, in CSV or XML (Arg3 ?). This is a modified use of script-logic I picked up during automation work, in the short-term absence of
	sufficient APIs, as our company split. The original scripts were part of Java & Groovy (JVM-based) solutions to ETL issues for metric Dashboards.
	
	The scripts also print to a folder of the Email+"_fbGrabs" at each step so you can see the various pages accessed & if they were reached properly.
	
	NOTE: Eventually the aim here should be to pull friend's details or birthdays, etc.
	>>>Also, unsure if filepaths here will work for Linux atm '/' vs '\'
	
	******Author: Richard McCormack*******
*/


//********************************************************************PRESTEPS***********************************************************************
//Prestep 1 [NB!!!]:
//	i. Download and install phantomjs for correct OS <<http://phantomjs.org/download.html>>;
//	ii. Download and install casperjs for correct OS <<http://docs.casperjs.org/en/latest/installation.html>>;
//	iii. If Windows is OS, add both to Global 'Path' System Variable (eg: ..blah/phantomjs/bin;..blah/casperjs/batchbin);
//*********************

//Prestep 2: Point phantom browser to casper folder & then to bin (as below if in same folder)
//phantom.casperPath = "/usr/local/bin/casperjs";
//phantom.injectJs(phantom.casperPath + 'bin/bootstrap.js');
//^^N/A for Linux
//*********************

//Prestep 3: Add utils for outputs & casper w/ debugging settings
//var utils = require('utils');//<<
var casper = require('casper').create({
    verbose: true,
    logLevel: 'error', //change to 'debug' for coding... But it's pretty useless (imho)
    pageSettings: {
        loadImages: false,//The script is much faster when this field is set to false
        loadPlugins: false,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36'
    }
});
//*********************

//Prestep 4: Capture Args passed and store to local variables
var LOGIN_EMAIL = casper.cli.get(0);//Arg1-String (User's FB email)
var LOGIN_PASSWORD = casper.cli.get(1);//Arg2-String (User's FB password)
//var OUTPUT_FORMAT = casper.cli.get(2);//Arg3-String (CSV or XML)... Likely will be done elsewhere
//*********************

var allArgs = casper.cli.args;

//Prestep 5: Check captured Args are of sufficient number (and type if desired)
if (casper.cli.args.length<2) {
    casper.echo('Insufficient Arguments Passed ('+allArgs.length+', rather than 2 required (FB email & password').exit(1);
}
//*********************

//(Optional) Prestep 6: Declaring Counter For Each Step's Success that I will increment on-success
var successSteps = 0;
casper.echo("***Welcome to Facebook-Friends Script. Please keep hands inside the vehicle at all times!!! :D***");
//*********************


//********************************************************************BEGIN***************************************************************************
//Step 1: Open Facebook
casper.start().thenOpen("https://facebook.com", function() {
    console.log("Facebook Login Screen URL attempted.");
	
	//Grab Login Screen or whatever reached
	this.wait(3000,function(){
		this.capture('./fbScreenGrabs/'+LOGIN_EMAIL+'_fbGrabs_A.png');
	});
});


//Step 2: Now we have to populate the login DOMs User Email & Password, and click Submit the form
casper.then(function(){
	if(casper.status().currentHTTPStatus>399){
		this.echo("Failed to Load Login Page. Consult \'/fbScreenGrabs/"+LOGIN_EMAIL+"_fbGrabs_A_cs.png\' ScreenGrab");
		this.echo('Facebook did not Load. Closing the Script.\nExiting Now.').exit(1);//<<'this.echo()' just included as an alternative to 'console.log()'
	}
	
    console.log("Facebook Login attempted, with "+LOGIN_EMAIL+" details.");
	
	//Set credentials passed. I use one 'id' and one 'name' attribute match lookup from all 'input' tags on page.
	this.sendKeys('input[id="email"]', LOGIN_EMAIL);
	this.sendKeys('input[name="pass"]', LOGIN_PASSWORD);
	this.click('input[type="submit"]');
	
	//Grab Login Screen Populated
	this.wait(3000,function(){
		this.capture('./fbScreenGrabs/'+LOGIN_EMAIL+'_fbGrabs_B.png');
	});
	
	//Step 1 Complete, 2 attempted:
	successSteps++;
});

//Step 3: Wait to be redirected to the User's Homepage, then, if success, navigate '/friends'
casper.then(function(){  
	if(casper.status().currentHTTPStatus>399){
		this.echo("Failed to Load User Page. Consult \'/fbScreenGrabs/"+LOGIN_EMAIL+"_fbGrabs_B_cs.png\' ScreenGrab");
		this.echo('Facebook did not Login Successfully. Closing the Script.\nExiting Now.').exit(1);
	}
	
	console.log('\n\n*************************************************************\n');
	console.log("Facebook Login Success, with "+LOGIN_EMAIL+" details. Welcome to "+this.getTitle()+"!");
	
	//The Facebook page is an SPA (Single Page Application), where the last part of the logged-in base-URI is added client-side I think, like as follows in this
	//sample: 'www.facebook.com/<UserNameParameter>'... So I have to traverse the body to get this full base-URI. The second anchor tag in html body had a href to
	//this... This is the link at the top of a User's page to return to their own homepage.
	//this.thenOpen(this.getCurrentUrl()+'friends/');	
	var fullURI = this.evaluate(function(){
        return document.querySelector('a[title="Profile"]').href;
    });
	this.thenOpen(fullURI+'/friends')
			
	//Grab Login Screen Populated
	this.wait(3000,function(){
		this.capture('./fbScreenGrabs/'+LOGIN_EMAIL+'_fbGrabs_C.png');
	});
	
	//Step 2 Complete, 3 attempted:
	successSteps++;
});


//Step 4: If friend loads successfully, grab count, then all names and http corresponding URLs, with nav page until list end.
casper.then(function(){   
	if(casper.status().currentHTTPStatus>399){
		this.echo("Failed to Load Friends Page. Consult \'/fbScreenGrabs/"+LOGIN_EMAIL+"_fbGrabs_C_cs.png\' ScreenGrab");
		this.echo('Facebook couldn\'t reach User Friends Page Successfully. Closing the Script.\nExiting Now.').exit(1);
	}
	
	console.log('\n\n*************************************************************\n');
	console.log("Facebook User Friends Page Success, with "+LOGIN_EMAIL+" details. Welcome to "+this.getTitle()+"!");
	
	//get count of friends
	var friendsCount = this.evaluate(function(){
        //var baseDOM = 
	return document.querySelectorAll('div[role="tablist"]').length//[1].value;
	// baseDOM.a.span[1].value;//
    });
	console.log(friendsCount);
	
});

//Get all images greater than 100x100 pixels.......... Will use same logic for names & urls... Use above
casper.then(function(){
	var images = this.evaluate(function(){
		var facebookImages = document.getElementsByTagName('img'); 
		var allSrc = [];
		for(var i = 0; i < facebookImages.length; i++) {
			if(facebookImages[i].height >= 100 && facebookImages[i].width >= 100)
				allSrc.push(facebookImages[i].src);
		}
		return JSON.stringify(allSrc);
	});
	console.log(images);
})

casper.run();
