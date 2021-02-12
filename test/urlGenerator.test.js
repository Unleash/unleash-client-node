import test from 'ava';
import UrlGenerator from '../lib/urlGenerator';

test('geturl should return url with project query parameter if projectname is provided', t => {
    const result = UrlGenerator.getUrl('http://unleash-app.com', 'myProject');
    t.true(result === 'http://unleash-app.com/client/features?project=myProject');
});

test('geturl should return url without project if projectname is not provided', t => {
    const result = UrlGenerator.getUrl('http://unleash-app.com');
    t.true(result === 'http://unleash-app.com/client/features');
});
