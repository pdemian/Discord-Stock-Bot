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

import * as fs from 'fs';
import * as path from 'path';

export class Logger {
  constructor(private log_path: string, private log_file: string, private retention_days: number) {  
    setInterval(this.cleanOldLogFiles, 24 * 60 * 60 * 1000);
  }

  private log(type: string, message: string) {
    const todays_date = new Date();
    const todays_file = path.join(this.log_path, this.log_file.replace("{date}", `${todays_date.getUTCFullYear()}-${todays_date.getUTCMonth()+1}-${todays_date.getUTCDate()}`));

    fs.appendFileSync(todays_file, `[${todays_date.toISOString()}] ${type}: ${message}\n`);
  }

  private cleanOldLogFiles() {
    const todays_date = new Date();
    for(const filename of fs.readdirSync(this.log_path)) {
      let match = /(\d{4}-\d{1,2}-\d{1,2})/.exec(filename);
      if(match) {
        const file_date = Date.parse(match[1]);
        const days_diff = Math.abs(file_date - todays_date.getTime()) / (1000 * 60 * 60 * 24);
        if(days_diff > this.retention_days) {
          fs.unlinkSync((filename));
        }
      }
    }
  }

  public info(message: string) {
    this.log('INFO', message);
  }

  public warn(message: string) {
    this.log('WARN', message);
  }

  public error(message: string) {
    this.log('ERROR', message);
  }

  public exception(error: Error) {
    this.log('EXCEPTION', `${error.name} ${error.message}:\n ${error.stack}`);
  }

  public ex(error: any) {
    this.log('EXCEPTION', `${JSON.stringify(error)}`);
  }
}