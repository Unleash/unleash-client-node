// Require the framework and instantiate it
const fastify = require('fastify')({ logger: false })

const PORT = process.env.PORT || process.env.HTTP_PORT || 3000
const url = process.env.UNLEASH_URL ||  'https://app.unleash-hosted.com/demo/api';
const apiKey = process.env.UNLEASH_API_TOKEN ||
    'test-server:default.8a090f30679be7254af997864d66b86e44dcfc5291916adff72a0fb5';

const { Unleash } = require('unleash-client');

const unleash = new Unleash({
  appName: 'node-test-server',
  url,
  refreshInterval: 2000,
  customHeaders: {
    Authorization: apiKey,
  },
});

let ready = false;

unleash.on('ready', () => {
    ready = true;
});

// required error handling when using unleash directly
unleash.on('error', console.error);

// ready 
fastify.get('/ready', async (req, reply) => {
    if(ready) {
        reply.code(200).send({status: 'ok'});
    } else {
        reply.code(503).send({status: 'not-ready'});
    }
});

fastify.get('/', async (req, reply) => {
  if(ready) {
      reply.code(200).send({status: 'ok'});
  } else {
      reply.code(503).send({status: 'not-ready'});
  }
});

// is-enabled
fastify.get('/is-enabled/:toggleName', async (req) => {
    const f = req.params.toggleName;
    const context = {...req.query};
    return { 
        name: f,
        enabled: unleash.isEnabled(f, context),
        context,
    }
});

fastify.get('/variant/:toggleName', async (req) => {
    const f = req.params.toggleName;
    const context = {...req.query};
    return { 
        name: f,
        variant: unleash.getVariant(f, context),
        context,
    }
});

// Run the server!
const start = async () => {
  try {
    await fastify.listen(PORT, '0.0.0.0')
    console.log(`now listening`);
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
console.log(`Starting on ${PORT}`);
start()