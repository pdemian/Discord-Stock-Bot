/*
Copyright (c) 2017 Patrick Demian

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

//imports
const Discord      = require('discord.js');
const yahooFinance = require('yahoo-finance');
const http         = require('http');
const url          = require('url');
const util         = require('util');

//discord stuff
const client = new Discord.Client();
const token  = '<DISCORD TOKEN HERE>';

//message stuff
const regex = /\$([A-Za-z\.=\-]*[A-Za-z]+)/g;
const red   = 0xFF0000;
const green = 0x00FF00;

//hard code some symbols
const hardcoded_values = {
	//cryptocurrencies
	'BTC': 'BTCUSD=X',
	'ETH': 'ETHUSD=X'
	
	//add your own values for commonly used stocks
	//'CAD': 'CADUSD=X',
	//'DANK': 'WEED.TO',
	//'MONEYMACHINE': 'NVDA'
};

//to make numbers more easily digestible
function round(num) {
	return num.toFixed(2);
}
function shortForm(num) {
	var log = Math.log10(num);
	
	//is there a more programatic way of doing this?
	//maybe with arrays, but I feel like this is just fine
	if(log > 12) { return round(num / 1e12) + 'T'; }
	else if(log > 9) { return round(num / 1e9) + 'B'; }
	else if(log > 6) { return round(num / 1e6) + 'M'; }
	else if(log > 3) { return round(num / 1e3) + 'K'; } 
	return round(num);
}

client.on('ready', () => {
	console.log('I am ready!');
});
client.on('message', message => {
	
	//extract symbols from message
	var symbols = [];
	var match = regex.exec(message.content);
	while(match != null) {
		var ticker = match[1].toUpperCase();
				
		if(hardcoded_values[ticker] !== undefined) {
			ticker = hardcoded_values[ticker];
		}
		
		symbols.push(ticker);
		match = regex.exec(message.content);
	}
	
	//if we have any symbols this message, process them and put them in the chat
	if(symbols.length > 0) {		
		yahooFinance.quote({
			symbols: symbols,
			modules: [ 'price' ]
		}, function (err, quotes) {
			if(err) {
				message.channel.send('Stock(s) not found or API error');
			}
			else {
				for(var i = 0; i < symbols.length; i++) {
					var data = quotes[symbols[i]]['price'];
					
					//extract data
					
					var sign           = +data['regularMarketChange'] >= 0;
					var signVal        = sign ? '+' : '';
					var color          = sign ? green : red;
					var currencySymbol = data['currency'] + data['currencySymbol'];
					//currencies don't have long names, but long names are prefered for stocks
					var name           = data['longName'] == null ? data['shortName'] : data['longName'];
					var symbol         = data['symbol'];
					var price          = round(data['regularMarketPrice']);
					var change         = round(data['regularMarketChange']);
					//Even though the data is called 'changePercent' it isn't actually a percentage
					var changePercent  = round(data['regularMarketChangePercent'] * 100);
					var high           = round(data['regularMarketDayHigh'])
					var low            = round(data['regularMarketDayLow'])
					var prev           = round(data['regularMarketPreviousClose'])
					//currencies don't have volume or market caps
					var volume         = !data['regularMarketVolume'] || +data['regularMarketVolume'] < 1 ? 'N/A' : shortForm(data['regularMarketVolume']);
					var cap            = !data['marketCap'] ? 'N/A' : shortForm(data['marketCap']);
					var date           = new Date(data['regularMarketTime']);
					

					//send message
					message.channel.send({
						embed: {
							color: color,
							author: { 
								name: util.format('%s (%s)', name, symbol) 
							},
							fields: [
								{
									name: util.format('%s%d %s%d (%s%d%%)', currencySymbol, price, signVal, change, signVal, changePercent),
									value: util.format('High: %d, Low: %d, Prev: %d\nCap: %s, Volume: %s', high, low, prev, cap, volume)
								}
							],
							timestamp: date,
							footer: {
								text: 'Via Yahoo! Finance. Delayed 15 min'
							}
						}
					});		
				}
			}
		});
	}
});

client.login(token);


//handle unhandled exceptions
process.on('uncaughtException', function(err) {
	console.error('Uncaught Exception: ');
	console.error(err);
});

//comment out all this below if you're not running on Heroku
//Heroku requires a server running in the background
var herokuURL = 'http://<your app name>.herokuapp.com';

var server = http.createServer(function(req, res) {
	var body = '<!DOCTYPE html>' +
	    '<html>' + 
			'<head>' + 
				'<title>Stock bot!</title>' +
			'</head>' +
			'<body>' +
				'<h1>Thanks for checking up on me. I\'m awake.</h1>' +
			'</body>' +
		'</html>';
	
	res.writeHead(200, {
		'Content-Type': 'text/html',
		'Content-Length': Buffer.byteLength(body, 'utf8'),
		'Server': 'Node ' + process.version
	});
	res.write(body);
	return res.end();
});
server.listen(process.env.PORT || 8080, function() {
	console.log('Server launched!');
	console.log('Server running on port: ', server.address().port);
	
	//keep this server from sleeping
	setInterval(function() {
		http.get(herokuURL);
	}, 300000); // every 5 minutes (300000)
});
