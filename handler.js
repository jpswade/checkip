/**
 * Lambda Handler.
 *
 * @see http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html
 * @see https://serverless.com/framework/docs/providers/aws/events/apigateway/
 */

const ip = require('ip');
const fs = require('fs');
const util = require('util');
const dns = require('dns');

function getIpWhois(ip) {
  const ipv4AddressSpace = require('./data/ipv4-address-space.json');
  var ipSplit = ip.split('.');
  var prefix = ipSplit[0];
  var record = ipv4AddressSpace.registry.record[prefix];
  return record['whois'][0];
}

function getIpWhoisUrl(whois, ip = null) {
  const whoisUrls = {
    'whois.afrinic.net': 'http://www.afrinic.net/cgi-bin/whois?searchtext=%s',
    'whois.apnic.net': 'http://wq.apnic.net/apnic-bin/whois.pl?searchtext=%s',
    'whois.arin.net': 'http://whois.arin.net/rest/ip/%s',
    'whois.lacnic.net': 'http://lacnic.net/cgi-bin/lacnic/whois?query=%s',
    'whois.ripe.net': 'https://apps.db.ripe.net/search/query.html?searchtext=%s',
    'whois.iana.org': 'http://www.iana.org/cgi-bin/whois?q=%s',
  };
  if (whoisUrls[whois] !== 'undefined') {
    var url = whoisUrls[whois];
    if (ip) {
      return util.format(url, ip);
    }
    return url;
  }
}

function redirect(uri) {
  response = {
    statusCode: 302,
    headers: {
      'Location': '/' + uri
    },
    body: null,
  };
  return response;
}

module.exports.index = function(event, context, callback) {
  const ipAddress = event.requestContext.identity.sourceIp;
  response = redirect(ipAddress);
  return callback(null, response);
}

module.exports.check = function(event, context, callback) {
  let response = false;
  let path = event.path;
  let data = {};
  path = event.pathParameters.path;
  /*
  // @TODO Fix dns lookups.
  i = path.charAt(0);
  if (typeof i !== 'number') {
    dns.lookup(path, function(err, address, family) {
      response = redirect(address);
      return callback(null, response);
		});
  }*/
  let ipVersion = false;
  if (ip.isV4Format(path)) {
    ipVersion = 4;
  } else if (ip.isV6Format(path)) {
    ipVersion = 6;
  }
  if (ipVersion) {
    var whois = getIpWhois(path);
    data = {
      'ip': path,
      'version': ipVersion,
      'private': ip.isPrivate(path),
      'long': ip.toLong(path),
      'whois': whois,
      'whoisUrl': getIpWhoisUrl(whois, path),
    };
  } else {
    data = {
      'error': 'Unknown'
    };
  }

  if (!response) {
    response = {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  }
  return callback(null, response);
};
