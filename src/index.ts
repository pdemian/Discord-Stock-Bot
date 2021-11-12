/*
Copyright (c) 2019 Patrick Demian

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

// Imports
import Discord from 'discord.js';
import yahooFinance from 'yahoo-finance';
import util from 'util';

// Discord client token. Either replace with constant string or add to environment
const token = process.env['DISCORD_TOKEN'];

// Message regex
const regex = /\$((?:[A-Za-z]{2,3}:[0-9]+)|(?:[A-Za-z0-9=\.\-\^]+)|(?:[0-9]+\.[A-Za-z]{2,3}))/g;

// Specially handled tickers 
const special_tickers = {
	// Cryptocurrencies
	'BTC'  : 'BTC-USD',
	'ETH'  : 'ETH-USD',
	'XRP'  : 'XRP-USD',
	'LTC'  : 'LTC-USD',
	'DOGE' : 'DOGE-USD',
	
	// Canadian currencies
	'CAD'  : 'CADUSD=X',
	'USD'  : 'CAD=X'
};

// Global supported market list
const markets = {
	// North America
	"TSX" : ".TO", "TSE"  : ".TO",
	"CVE" : ".V",
	// Asia Pacific
	"AU"  : ".AX", "ASX"  : ".AX",
	"HK"  : ".HK", "HKG"  : ".HK",
	"NZ"  : ".NZ", "NZE"  : ".NZE",
	// Europe
	"VI"  : ".VI", "WBAG" : ".VI",
	"BT"  : ".BR", "EBR"  : ".BR",
	"FR"  : ".PA", "EPA"  : ".PA",
	"BE"  : ".BE", "BER"  : ".BE",
	"ETR" : ".DE",
	"FF"  : ".F",  "FRA"  : ".F",
	"ST"  : ".SG", "STU"  : ".SG", 
	"DB"  : ".IR", "ISE"  : ".IR",
	"MI"  : ".MI", "BIT"  : ".MI",
	"AE"  : ".AS", "AMS"  : ".AS",
	"OS"  : ".OL", "OSL"  : ".OL",
	"LB"  : ".LS", "ELI"  : ".LS",
	"MD"  : ".MA", "MCE"  : ".MA",
	"EB"  : ".VX", "VTX"  : ".VX",
	"LN"  : ".L",  "LON"  : ".L",
	// Middle East
	"TV"  : ".TA", "TLV"  : ".TA"
};

interface QuoteData {
	regularMarketChangePercent: number,
	regularMarketChange: number,
	regularMarketTime: Date,
	regularMarketPrice: number,
	regularMarketDayHigh: number,
	regularMarketDayLow: number,
	regularMarketVolume: number,
	regularMarketPreviousClose: number,
	regularMarketOpen: number,
	symbol: string,
	shortName: string,
	longName: string | undefined,
	currency: string,
	currencySymbol: string,
	marketCap: number | undefined
};

class QuoteMessage {
	private readonly red   = 0xFF0000;
	private readonly green = 0x00FF00;

	public readonly sign: boolean;
	public readonly sign_symbol: string;
	public readonly currency_symbol: string;
	public readonly name: string;
	public readonly symbol: string;
	public readonly date: Date;
	public readonly price: string;
	public readonly change: string;
	public readonly change_percent: string;
	public readonly high: string;
	public readonly low: string;
	public readonly prev: string;
	public readonly volume: string;
	public readonly market_cap: string;

	constructor(data: QuoteData) {
		// Extract and format the data
		this.sign           = data.regularMarketChange >= 0;
		this.sign_symbol    = this.sign ? '+' : '';
		this.symbol         = data.symbol;
		this.date           = data.regularMarketTime;
		this.price          = this.round(data.regularMarketPrice);
		this.change         = this.round(data.regularMarketChange);
		this.change_percent = this.round(data.regularMarketChangePercent * 100);
		this.high           = this.round(data.regularMarketDayHigh);
		this.low            = this.round(data.regularMarketDayLow);
		this.prev           = this.round(data.regularMarketPreviousClose);

		// Currencies don't have volumes or market caps
		this.market_cap = data.marketCap == undefined ? 'N/A' : this.shortForm(data.marketCap);
		this.volume = data.regularMarketVolume == undefined || data.regularMarketVolume < 1 ? 'N/A' : this.shortForm(data.regularMarketVolume);

		// Some currencies don't have a specific symbol and will repeat the currency name
		this.currency_symbol = data.currency + (data.currency === data.currencySymbol ? '' : data.currencySymbol);
		
		// Currencies don't have long names, but long names are prefered for stocks
		this.name = data.longName == null ? data.shortName : data.longName;
	}

	// Rounds digits to 2 decimal places, using scientific notation if the number is too small 
	private round(num: number): string {
		if(Math.abs(num) < 0.01) {
			return num.toExponential(2);
		}
		return num.toFixed(2);
	}
	
	// Creates a short hand number
	private shortForm(num: number): string {
		const log = Math.log10(num);
	
		if(log > 12) { return this.round(num / 1e12) + 'T'; }
		else if(log > 9) { return this.round(num / 1e9) + 'B'; }
		else if(log > 6) { return this.round(num / 1e6) + 'M'; }
		else if(log > 3) { return this.round(num / 1e3) + 'K'; } 
		return this.round(num);
	}

	public toEmbed() : Discord.RichEmbed {
		const description = 
			util.format('%s%s %s%s (%s%s%%)\n', this.currency_symbol, this.price, this.sign_symbol, this.change, this.sign_symbol, this.change_percent) + 
			util.format('High: %s, Low: %s, Prev: %s\n', this.high, this.low, this.prev) +
			util.format('Cap: %s, Volume: %s', this.market_cap, this.volume);

		return new Discord.RichEmbed()
			.setColor(this.sign ? this.green : this.red)
			.setAuthor(util.format('%s (%s)', this.name, this.symbol))
			.setTimestamp(this.date)
			.setFooter('Via Yahoo! Finance. Delayed 15 min')
			.setDescription(description);
	}
}

function unhandledException(err: Error): void {
	console.error('Uncaught Exception: ');
	console.error(err);
}

function onReady(): void {
	console.log('I am ready!');
}

// Loop through all parsed tickers and extract them. Empty array if none
function parseTickers(message: string): string[] {
	const symbols: string[] = [];

	for(let match = regex.exec(message); match !== null; match = regex.exec(message)) {
		const ticker = match[1].toUpperCase();
		
		if(!/[A-Za-z]/.test(ticker)) continue;

		if(special_tickers[ticker] !== undefined) {
			symbols.push(special_tickers[ticker]);
		}
		else {
			const index = ticker.indexOf(':');
			// If we have MARKET:TICKER, replace with TICKER.MKT
			if(index > 0 && ticker.length > index) {
				const market = ticker.substring(0, index);
				const mkt = markets[market] === undefined ? '' : markets[market];

				symbols.push(ticker.substring(index+1, ticker.length) + mkt);
			}
			else {
				symbols.push(ticker);
			}
		}
	}

	return symbols;
}

function onMessage(message: Discord.Message): void {
	const symbols = parseTickers(message.content);
	if(symbols.length == 0) return;

	yahooFinance.quote({
		symbols: symbols,
		modules: [ 'price' ]
	}, (err: Error, quotes: any) => {
		if(err) {
			message.channel.send('Stock(s) not found or API error');
			console.error(err.message);
		}
		else {
			for(const symbol of symbols) {
				const data = quotes[symbol]['price'] as QuoteData;

				if(data.regularMarketPrice === undefined) {
					message.channel.send('Price for ' + symbol + ' could not be found');
					continue;
				}

				message.channel.send(new QuoteMessage(data).toEmbed());
			}
		}
	});
}

function main(): void {
	// Handle unhandled exceptions
	process.on('uncaughtException', unhandledException);

	// Initialize discord 
	const client = new Discord.Client();
	client.on('ready', onReady);
	client.on('message', onMessage);
	client.login(token);
}

main();