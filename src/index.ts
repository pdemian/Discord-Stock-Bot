/*
Copyright (c) 2022 Patrick Demian

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
import Discord, { GatewayIntentBits } from 'discord.js';
import yahooFinance from 'yahoo-finance2';
import util from 'util';
import * as dotenv from 'dotenv';
import { Logger } from './logger';
import { QuoteResponseArray, Quote } from 'yahoo-finance2/dist/esm/src/modules/quote';
import getSymbolFromCurrency from 'currency-symbol-map'
dotenv.config({ path: __dirname+'/../.env' });

// Discord client token. Either replace with constant string or add to environment
const token = process.env['DISCORD_TOKEN'];
const log_path = process.env['LOG_FILE_PATH'] || '/tmp/discord-stock-bot/';
const log_file = process.env['LOG_FILE'] || 'applog-{date}.log';
const log_retention_days = Number.parseInt(process.env['LOG_RETENTION_DAYS'] || "7");

const log = new Logger(log_path, log_file, log_retention_days);

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
  'BNB'  : 'BNB-USD',
  'ADA'  : 'ADA-USD',
  'SOL'  : 'SOL-USD',
  'XMR'  : 'XMR-USD',
  
  // Other currencies
  'CAD'  : 'CADUSD=X',
  'USD'  : 'CAD=X',
  'EUR'  : 'EUR=X',
  'GBP'  : 'GBP=X',
  'JPY'  : 'JPY=X'
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
  public readonly market_state: "REGULAR" | "CLOSED" | "PRE" | "PREPRE" | "POST" | "POSTPOST";
  public readonly prepost_price: string = "";
  public readonly prepost_change: string = "";
  public readonly prepost_change_percent: string = "";
  public readonly prepost_sign: string = "";
  private readonly market_status?: string;

  constructor(data: Quote) {
    // Extract and format the data
    this.sign           = data.regularMarketChange! >= 0;
    this.sign_symbol    = this.sign ? '+' : '';
    this.symbol         = data.symbol;
    this.date           = data.regularMarketTime!;
    this.price          = this.round(data.regularMarketPrice);
    this.change         = this.round(data.regularMarketChange);
    this.change_percent = this.round(data.regularMarketChangePercent);
    this.high           = this.round(data.regularMarketDayHigh);
    this.low            = this.round(data.regularMarketDayLow);
    this.prev           = this.round(data.regularMarketPreviousClose);
    this.market_state   = data.marketState;

    // Currencies don't have volumes or market caps
    this.market_cap = data.marketCap == undefined ? 'N/A' : this.shortForm(data.marketCap);
    this.volume = data.regularMarketVolume == undefined || data.regularMarketVolume < 1 ? 'N/A' : this.shortForm(data.regularMarketVolume);

    this.currency_symbol = data.currency ? data.currency +  getSymbolFromCurrency(data.currency) : "";
    
    // Currencies don't have long names, but long names are preferred for stocks
    this.name = data.longName === undefined || data.longName === null ? data.shortName! : data.longName;

    if(data.preMarketPrice || data.postMarketPrice) {
      switch(this.market_state) {
        case "REGULAR":
          this.market_status = undefined;
          break;
        case "PRE":
          this.market_status = "PreMkt";
          this.prepost_price = this.round(data.preMarketPrice);
          this.prepost_change = this.round(data.preMarketChange);
          this.prepost_change_percent = this.round(data.preMarketChangePercent);
          this.prepost_sign = data.preMarketChange! >= 0 ? '+' : '';
          break;
        default:
          this.market_status = "PostMkt";
          this.prepost_price = this.round(data.postMarketPrice);
          this.prepost_change = this.round(data.postMarketChange);
          this.prepost_change_percent = this.round(data.postMarketChangePercent);
          this.prepost_sign = data.postMarketChange! >= 0 ? '+' : '';
          break;
      }
    }
    else {
      this.market_status = undefined;
    }
  }

  // Rounds digits to 2 decimal places, using scientific notation if the number is too small 
  private round(num: number | undefined): string {
    if(num === undefined) {
      return 'N/A';
    }
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

  public toEmbed() {
    const prepost_market = 
      this.market_status ? util.format('%s: **%s** %s%s (%s%s%%)\n', this.market_status, this.prepost_price, this.prepost_sign, this.prepost_change, this.prepost_sign, this.prepost_change_percent) : "";

    const description = 
      util.format('__%s**%s** %s%s (%s%s%%)__\n', this.currency_symbol, this.price, this.sign_symbol, this.change, this.sign_symbol, this.change_percent) + 
      prepost_market +
      util.format('High: **%s**, Low: **%s**, Prev: **%s**\n', this.high, this.low, this.prev) +
      util.format('Cap: **%s**, Volume: **%s**', this.market_cap, this.volume);

    return { embeds: [new Discord.EmbedBuilder()
      .setColor(this.sign ? this.green : this.red)
      .setAuthor({ name: util.format('%s (%s)', this.name, this.symbol) })
      .setTimestamp(this.date)
      .setFooter({ text: 'Via Yahoo! Finance. Delayed 15 min' })
      .setDescription(description) ]};
  }
}

function unhandledException(err: Error): void {
  log.error('Uncaught Exception: ');
  log.exception(err);
}

function onReady(): void {
  log.info('I am ready!');
}

// Loop through all parsed tickers and extract them. Empty array if none
function parseTickers(message: string): string[] {
  const symbols: string[] = [];

  for(let match = regex.exec(message); match !== null; match = regex.exec(message)) {
    const ticker = match[1].toUpperCase();
    
    if(/^[0-9]/.test(ticker)) {
      if(!/\.[A-Za-z]{2,}/.test(ticker)) {
        continue;
      }
    }
    else if(!/[A-Za-z]/.test(ticker)) {
      continue;
    }
    
    log.info(`Found request for ticker: ${ticker}`);

    if(special_tickers[ticker] !== undefined) {
      symbols.push(special_tickers[ticker]);
    }
    else {
      const index = ticker.indexOf(':');
      // If we have MARKET:TICKER, replace with TICKER.MKT
      if(index > 0 && ticker.length > index) {
        const market = ticker.substring(0, index);
        const mkt = markets[market] === undefined ? '' : markets[market];
        const newSymbol = ticker.substring(index+1, ticker.length) + mkt;
        symbols.push(newSymbol);
        log.info(`Modified to become ${newSymbol}`);
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
  log.info("Expected symbols: " + JSON.stringify(symbols));

  yahooFinance.quote(symbols).then(async (quotes: QuoteResponseArray) => {
    log.info("Got symbol info from Yahoo");
    for(const data of quotes) {
      const symbol = data.symbol;

      if(data.regularMarketPrice === undefined) {
        message.channel.send(`Price for ${symbol} could not be found`);
        log.info(`Price for ${symbol} could not be found`);
        continue;
      }

      try {
        await message.channel.send(new QuoteMessage(data).toEmbed());
      }
      catch(error) {
        message.channel.send(`There was an issue retrieving ${symbol}`);
        log.error(`There was an issue retrieving ${symbol}`);
        log.ex(error);
      }
    }
  }).catch((err) => {
    message.channel.send('Stock(s) not found or API error');
    log.error("Failed to query stocks");
    log.ex(err);
  });
}

function main(): void {
  // Handle unhandled exceptions
  process.on('uncaughtException', unhandledException);

  // Initialize discord 
  const client = new Discord.Client({intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent ]});
  client.on('ready', onReady);
  client.on('messageCreate', onMessage);
  client.login(token);
}

main();