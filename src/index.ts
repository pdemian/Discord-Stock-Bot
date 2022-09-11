/*
Copyright (c) 2022 Patrick Demian, Griffin McShane

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
const regex = /\$([A-Za-z\.=\-\:\^]*[A-Za-z]+)/g;

// Specially handled tickers 
const special_tickers = {
	// Cryptocurrencies
	'BTC'  :  'BTC-USD',
    'ETH'  :  'ETH-USD',
    'BNB'  :  'BNB-USD',
    'XRP'  :  'XRP-USD',
    'ADA'  :  'ADA-USD',
    'DOGE'  :  'DOGE-USD',
    'DOT'  :  'DOT1-USD',
    'UNI'  :  'UNI3-USD',
    'LTC'  :  'LTC-USD',
    'BCH'  :  'BCH-USD',
    'LINK'  :  'LINK-USD',
    'VET'  :  'VET-USD',
    'SOL'  :  'SOL1-USD',
    'XLM'  :  'XLM-USD',
    'FIL'  :  'FIL-USD',
    'THETA'  :  'THETA-USD',
    'TRX'  :  'TRX-USD',
    'XMR'  :  'XMR-USD',
    'LUNA'  :  'LUNA1-USD',
    'NEO'  :  'NEO-USD',
    'EOS'  :  'EOS-USD',
    'MIOTA'  :  'MIOTA-USD',
    'BTT'  :  'BTT-USD',
    'BSV'  :  'BSV-USD',
    'CRO'  :  'CRO-USD',
    'AAVE'  :  'AAVE-USD',
    'ATOM'  :  'ATOM1-USD',
    'MKR'  :  'MKR-USD',
    'ETC'  :  'ETC-USD',
    'XTZ'  :  'XTZ-USD',
    'ALGO'  :  'ALGO-USD',
    'CTC'  :  'CTC1-USD',
    'AVAX'  :  'AVAX-USD',
    'HEX'  :  'HEX-USD',
    'COMP'  :  'COMP-USD',
    'EGLD'  :  'EGLD-USD',
    'KSM'  :  'KSM-USD',
    'XEM'  :  'XEM-USD',
    'DASH'  :  'DASH-USD',
    'DCR'  :  'DCR-USD',
    'ZEC'  :  'ZEC-USD',
    'CHZ'  :  'CHZ-USD',
    'HBAR'  :  'HBAR-USD',
    'ARRR'  :  'ARRR-USD',
    'STX'  :  'STX1-USD',
    'MATIC'  :  'MATIC-USD',
    'CCXX'  :  'CCXX-USD',
    'MANA'  :  'MANA-USD',
    'ENJ'  :  'ENJ-USD',
    'ZIL'  :  'ZIL-USD',
    'BAT'  :  'BAT-USD',
    'SNX'  :  'SNX-USD',
    'DGB'  :  'DGB-USD',
    'CEL'  :  'CEL-USD',
    'GRT'  :  'GRT2-USD',
    'SC'  :  'SC-USD',
    'YFI'  :  'YFI-USD',
    'WAVES'  :  'WAVES-USD',
    'BTG'  :  'BTG-USD',
    'SUSHI'  :  'SUSHI-USD',
    'DFI'  :  'DFI-USD',
    'TFUEL'  :  'TFUEL-USD',
    'UMA'  :  'UMA-USD',
    'CELO'  :  'CELO-USD',
    'XWC'  :  'XWC-USD',
    'ZEN'  :  'ZEN-USD',
    'QTUM'  :  'QTUM-USD',
    'RVN'  :  'RVN-USD',
    'ONT'  :  'ONT-USD',
    'BNT'  :  'BNT-USD',
    'ZRX'  :  'ZRX-USD',
    'HNT'  :  'HNT1-USD',
    'NANO'  :  'NANO-USD',
    'ICX'  :  'ICX-USD',
    'XDC'  :  'XDC-USD',
    'ONE'  :  'ONE2-USD',
    'ANKR'  :  'ANKR-USD',
    'OMG'  :  'OMG-USD',
    'IOST'  :  'IOST-USD',
    'AR'  :  'AR-USD',
    'XVG'  :  'XVG-USD',
    'VGX'  :  'VGX-USD',
    'CRV'  :  'CRV-USD',
    'LRC'  :  'LRC-USD',
    'VTHO'  :  'VTHO-USD',
    'CKB'  :  'CKB-USD',
    'MCO'  :  'MCO-USD',
    'STORJ'  :  'STORJ-USD',
    'KNC'  :  'KNC-USD',
    'MIR'  :  'MIR1-USD',
    'LSK'  :  'LSK-USD',
    'SNT'  :  'SNT-USD',
    'AMP'  :  'AMP1-USD',
    'QNT'  :  'QNT-USD',
    'MAID'  :  'MAID-USD',
    'EWT'  :  'EWT-USD',
    'ETN'  :  'ETN-USD',
    'BCD'  :  'BCD-USD',
 'IOTX' : 'IOTX-USD',
 'GLM' : 'GLM-USD',
 'NKN' : 'NKN-USD',
 'REP' : 'REP-USD',
 'TUSD' : 'TUSD-USD',
 'ANT' : 'ANT-USD',
 'ARDR' : 'ARDR-USD',
 'FUN' : 'FUN-USD',
 'SRM' : 'SRM-USD',
 'BAND' : 'BAND-USD',
 'CVC' : 'CVC-USD',
 'FET' : 'FET-USD',
 'VLX' : 'VLX-USD',
 'STEEM' : 'STEEM-USD',
 'MED' : 'MED-USD',
 'BTS' : 'BTS-USD',
 'GNO' : 'GNO-USD',
 'KMD' : 'KMD-USD',
 'KIN' : 'KIN-USD',
 'XHV' : 'XHV-USD',
 'KAVA' : 'KAVA-USD',
 'WAXP' : 'WAXP-USD',
 'RDD' : 'RDD-USD',
 'BTM' : 'BTM-USD',
 'HNC' : 'HNC-USD',
 'WAN' : 'WAN-USD',
 'ARK' : 'ARK-USD',
 'PPT' : 'PPT-USD',
 'MTL' : 'MTL-USD',
 'OXT' : 'OXT-USD',
 'STRAX' : 'STRAX-USD',
 'HNS' : 'HNS-USD',
 'AVA' : 'AVA-USD',
 'CRU' : 'CRU-USD',
 'COTI' : 'COTI-USD',
 'ABBC' : 'ABBC-USD',
 'SYS' : 'SYS-USD',
 'META' : 'META-USD',
 'HIVE' : 'HIVE-USD',
 'MLN' : 'MLN-USD',
 'ATRI' : 'ATRI-USD',
 'MARO' : 'MARO-USD',
 'MWC' : 'MWC-USD',
 'DNT' : 'DNT-USD',
 'NU' : 'NU-USD',
 'TOMO' : 'TOMO-USD',
 'RLC' : 'RLC-USD',
 'BCN' : 'BCN-USD',
 'REV' : 'REV-USD',
 'PAC' : 'PAC-USD',
 'MONA' : 'MONA-USD',
 'NYE' : 'NYE-USD',
 'TWT' : 'TWT-USD',
 'ELA' : 'ELA-USD',
 'SAPP' : 'SAPP-USD',
 'PHA' : 'PHA-USD',
 'ADX' : 'ADX-USD',
 'DIVI' : 'DIVI-USD',
 'IRIS' : 'IRIS-USD',
 'GRN' : 'GRN-USD',
 'APL' : 'APL-USD',
 'AION' : 'AION-USD',
 'GAS' : 'GAS-USD',
 'KDA' : 'KDA-USD',
 'NRG' : 'NRG-USD',
 'LOKI' : 'LOKI-USD',
 'FIRO' : 'FIRO-USD',
 'WOZX' : 'WOZX-USD',
 'TT' : 'TT-USD',
 'VTC' : 'VTC-USD',
 'CSC' : 'CSC-USD',
 'NXS' : 'NXS-USD',
 'XNC' : 'XNC-USD',
 'VRA' : 'VRA-USD',
 'XLT' : 'XLT-USD',
 'ZNN' : 'ZNN-USD',
 'BEAM' : 'BEAM-USD',
 'PIVX' : 'PIVX-USD',
 'SERO' : 'SERO-USD',
 'WTC' : 'WTC-USD',
 'ERG' : 'ERG-USD',
 'AE' : 'AE-USD',
 'GRS' : 'GRS-USD',
 'NULS' : 'NULS-USD',
 'EMC2' : 'EMC2-USD',
 'PAI' : 'PAI-USD',
 'SRK' : 'SRK-USD',
 'DAG' : 'DAG-USD',
 'DERO' : 'DERO-USD',
 'WICC' : 'WICC-USD',
 'VSYS' : 'VSYS-USD',
 'LBC' : 'LBC-USD',
 'MHC' : 'MHC-USD',
 'SOLVE' : 'SOLVE-USD',
 'PCX' : 'PCX-USD',
 'CTXC' : 'CTXC-USD',
 'MASS' : 'MASS-USD',
 'HC' : 'HC-USD',
 'NIM' : 'NIM-USD',
 'AXEL' : 'AXEL-USD',
 'GXC' : 'GXC-USD',
 'RBTC' : 'RBTC-USD',
 'BDX' : 'BDX-USD',
 'VITE' : 'VITE-USD',
 'FSN' : 'FSN-USD',
 'BIP' : 'BIP-USD',
 'SKY' : 'SKY-USD',
 'NXT' : 'NXT-USD',
 'NAS' : 'NAS-USD',
 'GRIN' : 'GRIN-USD',
 'OBSR' : 'OBSR-USD',
 'FIO' : 'FIO-USD',
 'GBYTE' : 'GBYTE-USD',
 'DCN' : 'DCN-USD',
 'NAV' : 'NAV-USD',
 'NEBL' : 'NEBL-USD',
 'DGD' : 'DGD-USD',
 'KRT' : 'KRT-USD',
 'GO' : 'GO-USD',
 'VIA' : 'VIA-USD',
 'XSN' : 'XSN-USD',
 'VERI' : 'VERI-USD',
 'SBD' : 'SBD-USD',
 'DMCH' : 'DMCH-USD',
 'CET' : 'CET-USD',
 'SALT' : 'SALT-USD',
 'ZANO' : 'ZANO-USD',
 'QRL' : 'QRL-USD',
 'WABI' : 'WABI-USD',
 'NMC' : 'NMC-USD',
 'AEON' : 'AEON-USD',
 'VITAE' : 'VITAE-USD',
 'QASH' : 'QASH-USD',
 'CUT' : 'CUT-USD',
 'GAME' : 'GAME-USD',
 'ETP' : 'ETP-USD',
 'BLOCK' : 'BLOCK-USD',
 'PI' : 'PI-USD',
 'BHD' : 'BHD-USD',
 'BURST' : 'BURST-USD',
 'DNA1' : 'DNA1-USD',
 'SNM' : 'SNM-USD',
 'RINGX' : 'RINGX-USD',
 'PZM' : 'PZM-USD',
 'MAN' : 'MAN-USD',
 'NIX' : 'NIX-USD',
 'DYN' : 'DYN-USD',
 'WGR' : 'WGR-USD',
 'ZEL' : 'ZEL-USD',
 'XDN' : 'XDN-USD',
 'NLG' : 'NLG-USD',
 'ADK' : 'ADK-USD',
 'PPC' : 'PPC-USD',
 'BEPRO' : 'BEPRO-USD',
 'UBQ' : 'UBQ-USD',
 'MRX' : 'MRX-USD',
 'HPB' : 'HPB-USD',
 'FCT' : 'FCT-USD',
 'SMART' : 'SMART-USD',
 'POA' : 'POA-USD',
 'NVT' : 'NVT-USD',
 'PAY' : 'PAY-USD',
 'CMT1' : 'CMT1-USD',
 'TRUE' : 'TRUE-USD',
 'ACT' : 'ACT-USD',
 'ACH' : 'ACH-USD',
 'HTML' : 'HTML-USD',
 'PLC' : 'PLC-USD',
 'XMY' : 'XMY-USD',
 'YOYOW' : 'YOYOW-USD',
 'TERA' : 'TERA-USD',
 'BHP' : 'BHP-USD',
 'BPS' : 'BPS-USD',
 'SNGLS' : 'SNGLS-USD',
 'NYZO' : 'NYZO-USD',
 'CHI' : 'CHI-USD',
 'BTC2' : 'BTC2-USD',
 'VAL1' : 'VAL1-USD',
 'PART' : 'PART-USD',
 'FO' : 'FO-USD',
 'FLO' : 'FLO-USD',
 'SCC3' : 'SCC3-USD',
 'FTC' : 'FTC-USD',
 'AMB' : 'AMB-USD',
 'SFT' : 'SFT-USD',
 'ZYN' : 'ZYN-USD',
 'WINGS' : 'WINGS-USD',
 'XMC' : 'XMC-USD',
 'GLEEC' : 'GLEEC-USD',
 'INT' : 'INT-USD',
 'PHR' : 'PHR-USD',
 'AYA' : 'AYA-USD',
 'IDNA' : 'IDNA-USD',
 'BCA' : 'BCA-USD',
 'INSTAR' : 'INSTAR-USD',
 'DMD' : 'DMD-USD',
 'GRC' : 'GRC-USD',
 'HTDF' : 'HTDF-USD',
 'LCC' : 'LCC-USD',
 'XST' : 'XST-USD',
 'DTEP' : 'DTEP-USD',
 'ILC' : 'ILC-USD',
 'GHOST1' : 'GHOST1-USD',
 'XBY' : 'XBY-USD',
 'SCP' : 'SCP-USD',
 'VEX' : 'VEX-USD',
 'DIME' : 'DIME-USD',
 'OTO' : 'OTO-USD',
 'BLK' : 'BLK-USD',
 'CRW' : 'CRW-USD',
 'IOC' : 'IOC-USD',
 'FAIR' : 'FAIR-USD',
 'CURE' : 'CURE-USD',
 'USNBT' : 'USNBT-USD',
 'XRC' : 'XRC-USD',
 'HYC' : 'HYC-USD',
 'BPC' : 'BPC-USD',
 'POLIS' : 'POLIS-USD',
 'QRK' : 'QRK-USD',
 'SUB' : 'SUB-USD',
 'SONO1' : 'SONO1-USD',
 'MGO' : 'MGO-USD',
 'PMEER' : 'PMEER-USD',
 'MBC' : 'MBC-USD',
 'VIN' : 'VIN-USD',
 'XAS' : 'XAS-USD',
 'GCC1' : 'GCC1-USD',
 'OWC' : 'OWC-USD',
 'GHOST' : 'GHOST-USD',
 'ERK' : 'ERK-USD',
 'DDK' : 'DDK-USD',
 'EDG' : 'EDG-USD',
 'HSS' : 'HSS-USD',
 'NPC' : 'NPC-USD',
 'OURO' : 'OURO-USD',
 'ATB' : 'ATB-USD',
 'FRST' : 'FRST-USD',
 'COMP1' : 'COMP1-USD',
 'FLASH' : 'FLASH-USD',
 'MOAC' : 'MOAC-USD',
 'ECC' : 'ECC-USD',
 'ECA' : 'ECA-USD',
 'CLAM' : 'CLAM-USD',
 'ALIAS' : 'ALIAS-USD',
 'LKK' : 'LKK-USD',
 'NLC2' : 'NLC2-USD',
 'UNO' : 'UNO-USD',
 'BONO' : 'BONO-USD',
 'COLX' : 'COLX-USD',
 'MINT' : 'MINT-USD',
 'RBY' : 'RBY-USD',
 'DUN' : 'DUN-USD',
 'XUC' : 'XUC-USD',
 'SPHR' : 'SPHR-USD',
 'AIB' : 'AIB-USD',
 'TUBE' : 'TUBE-USD',
 'SHIFT' : 'SHIFT-USD',
 'CCA' : 'CCA-USD',
 'JDC' : 'JDC-USD',
 'MTC2' : 'MTC2-USD',
 'MIDAS' : 'MIDAS-USD',
 'SLS' : 'SLS-USD',
 'DCY' : 'DCY-USD',
 'LRG' : 'LRG-USD',
 'XCP' : 'XCP-USD',
 'BRC' : 'BRC-USD',
 'BTX' : 'BTX-USD',
 'XLQ' : 'XLQ-USD',
 'VBK' : 'VBK-USD',
 'BST' : 'BST-USD',
 'YEP' : 'YEP-USD',
	
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
