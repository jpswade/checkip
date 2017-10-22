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
  if (record.whois && record.whois.length > 0) {
    return record.whois[0];
  }
  return false;
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
    if (!url) {
      return false;
    }
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
  body = '<title>A simple "What Is My IP Address?" lookup service.</title>'
  body += '<a href="/' + ipAddress + '">' + ipAddress + '</a>';
  response = {
    statusCode: 200,
    headers: {
      'Content-type': 'text/html',
      'Remote-addr': ipAddress,
    },
    body: body
  };
  return callback(null, response);
}

module.exports.check = function(event, context, callback) {
  let response = false;
  let data = {};
  let path = event.pathParameters.path;
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
    pattern = /^(?:[a-z\d])(?:[a-z\d-\.]*)\.(?:[a-z]+)$/;
    if (path.match(pattern)) {
      var dnsSync = require('dns-sync');
      let ipAddress = dnsSync.resolve(path);
      if (ipAddress) {
        response = redirect(ipAddress);
      } else {
        data = {
          'error': 'Unable to get IP Address'
        };
      }
    } else {
      data = {
        'error': 'Unknown input'
      };
    }
  }

  if (!response) {
    response = {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  }
  return callback(null, response);
};
