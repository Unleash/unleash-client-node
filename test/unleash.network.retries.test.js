import test from 'ava';
import { createServer } from 'http';
import { Unleash } from '../lib/unleash';

test.cb('should retry on error', (t) => {
  t.plan(1);

  let calls = 0;
  const server = createServer((req, res) => {
    calls++;
    res.writeHead(408);
    res.end();
  });

  server.listen(() => {
    const { port } = server.address();
  
    const unleash = new Unleash({
      appName: 'network',
      url: `http://localhost:${port}`,
      refreshInterval: 1,
      timeout: 100,
      disableMetrics: true,
    });
  
    unleash.on('error', () => {
      t.is(calls, 3);
      unleash.destroy();
      server.close();
      t.end();
    });
  
  }); 
  server.on('error', (e) => {
    t.fail(e);
    server.close();    
  });
  
});
