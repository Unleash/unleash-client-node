import test from 'ava';
import getUrl, { suffixSlash } from '../lib/url-utils';

test('geturl should return url with project query parameter if projectname is provided', t => {
  const result = getUrl('http://unleash-app.com', 'myProject');
  t.true(result === 'http://unleash-app.com/client/features?project=myProject');
});

test('geturl should return url without project if projectname is not provided', t => {
  const result = getUrl('http://unleash-app.com');
  t.true(result === 'http://unleash-app.com/client/features');
});

test('geturl should return url with namePrefix if namePrefix is provided', t => {
  const result = getUrl('http://unleash-app.com', '', 'unleash');
  t.true(result === 'http://unleash-app.com/client/features?namePrefix=unleash');
});

test('geturl should return url with namePrefix and project both are provided', t => {
  const result = getUrl('http://unleash-app.com', 'myProject', 'unleash');
  t.true(result === 'http://unleash-app.com/client/features?namePrefix=unleash&namePrefix=unleash');
});

test('geturl should return url with namePrefix, project and tags if all provided', t => {
  const result = getUrl('http://unleash-app.com', 'myProject', 'unleash', ['tagName:tagValue']);
  t.true(result === 'http://unleash-app.com/client/features?namePrefix=unleash&namePrefix=unleash&tag=tagName:tagValue');
});

test('geturl should return url with tags if tags are provided', t => {
  const result = getUrl('http://unleash-app.com', '', '', ['tagName:tagValue']);
  t.true(result === 'http://unleash-app.com/client/features?tag=tagName:tagValue');
});

test('geturl should return url with two tags if two tags are provided', t => {
  const result = getUrl('http://unleash-app.com', '', '', ['tagName:tagValue', 'tagName2:tagValue2']);
  t.true(result === 'http://unleash-app.com/client/features?tag=tagName:tagValue&tag=tagName2:tagValue2');
});

test('suffix slash should append / on url missing /', t => {
  const result = suffixSlash('http://unleash-app.com/api');
  t.true(result === 'http://unleash-app.com/api/');
});

test('suffix slash does not append / on url already ending with /', t => {
  const result = suffixSlash('http://unleash-app.com/api/');
  t.true(result === 'http://unleash-app.com/api/');
});
