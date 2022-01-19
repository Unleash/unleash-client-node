/* eslint-disable */
const { get } = require('http');
const { initialize } = require('../lib');

const { createClient } = require('redis');

class MyRedisStore {
  async set(key, data) {
    const client = createClient();
    await client.connect();
    await client.set(key, JSON.stringify(data));

  }
  async get(key) {
    const client = createClient();
    await client.connect();
    const data = await client.get(key);
    return JSON.parse(data);
  } 
}

const client = initialize({
  appName: 'my-application',
  url: 'http://asd:3000/proxy/',
  customHeaders: {
    Authorization: 'bootstrap',
  },
  storageProvider: new MyRedisStore(),
});

client.on('error', () => console.log("\x1b[31m", 'Unable to fetch feature toggles', "\x1b[0m"));
client.on('warn', console.log);
client.on('synchronized', () => {
  console.log('synchronized')
  console.log(
    `Feature toggle 'demoApp.step1' is:`, 
    '\x1b[32m',`${client.isEnabled('demoApp.step1')}`,
    '\x1b[0m',
  );
});
client.on('ready', () => console.log('ready'));


setInterval(() => {
  console.log(
    `Feature toggle 'demoApp.step1' is:`, 
    '\x1b[32m',`${client.isEnabled('demoApp.step1')}`,
    '\x1b[0m',
  );
}, 100)
