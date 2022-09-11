# Discord Stock Bot

Get stock information straight in discord! 

Simply type in a $SYMBOL like $AAPL or $GOOG and bam!

![Example](https://i.imgur.com/C2z8tZS.png)

International? Most markets supported

![Toronto Stock Exchange Example](https://i.imgur.com/8CzOZqB.png)

Supports Bitcoin, Ethereum, Bitcoin Cash, Ripple, Litecoin, and Dogecoin as well

![Crypto Example](https://i.imgur.com/AFZyhDl.png)

## How does it work?

It's a node.js bot able to run on any service (currently on a Raspberry Pi).

It scans all messages for $SYMBOLs and retrieves a ticker from Yahoo! finance, then posts a message to the channel.

## How can I run this?

 - Setup the `DISCORD_TOKEN` environment variable with your platform
 - Optionally set up a `LOG_FILE_PATH` (default `/tmp/discord-stock-bot/`) and a `LOG_FILE` (default `applog-{date}.log`)
 - `npm install`
 - `npm run build`
 - `npm run start`

## What if I don't want to run a whole node process to get this bot running? 
Click this [this link](https://discordapp.com/oauth2/authorize?&client_id=380167669120237569&scope=bot&permissions=0) to add the bot to your discord*  
*No guarantee of uptime

## Contributing

Feel free to open a ticket regarding any issues you come across, or submit a pull request with fixes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
