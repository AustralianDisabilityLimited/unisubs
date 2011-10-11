"""
Big shout out to Michael Richardson and Fernando Takai for this class.
https://bitbucket.org/fernandotakai/tender-multipass/src/0a8c0020e7bb/tender_multipass.py
"""

import sys
import base64
import hashlib
from itertools import izip, cycle
import simplejson as json
from dateutil import parser
from dateutil.tz import tzutc
from datetime import datetime
from M2Crypto import EVP

class MultiPass(object):
    def __init__(self, site_key, api_key):
        self.secret = hashlib.sha1(api_key + site_key).digest()[:16]
        # Yes, really.
        self.iv = "OpenSSL for Ruby"
        self.aes = EVP.Cipher("aes_128_cbc", key=self.secret,
            iv=self.iv, op=1)

    def handle_xor(self, raw_string):
        """Double XOR the first block"""
        data = list(raw_string)
        new_data = [chr(ord(x) ^ ord(y)) for (x, y)
            in izip(raw_string[:16], cycle(self.iv))]
        data[:16] = new_data
        return ''.join(data)

    def encode(self, data):
        """Turns a dictionary into urlquoted base64'd encrypted JSON data.

        >>> import datetime
        >>> import tender_multipass
        >>> multipass = tender_multipass.MultiPass("some_site", "some_key")
        >>> expires = datetime.datetime(2009, 10, 19, 20, 07) + datetime.timedelta(days=14)
        >>> data = {"name": "Michael", "email": "michael@mtrichardson.com", "expires": expires.strftime("%Y-%m-%dT%H:%M")}
        >>> multipass.encode(data)
        '4rdsKqcXzJVqbltYJdayy6lIkwtl7vAivlgyDkWCfORWze5HrvfuarBh8Yvkush8cOywmDG4y4M96vuIyAIWskXOpUaCT_-zQ-JU8Jf0u0X7-bTwjdWyzub6srayFyKn'

        """
        aes = EVP.Cipher("aes_128_cbc", key=self.secret,
            iv=self.iv, op=1)
        
        raw_string = json.dumps(data)
        raw_string = self.handle_xor(raw_string)
        v = aes.update(raw_string)
        v += aes.final()
        return base64.urlsafe_b64encode(v)

    def decode(self, data):
        aes = EVP.Cipher("aes_128_cbc", key=self.secret,
            iv=self.iv, op=0)

        data = data.encode('ascii')

        string = base64.urlsafe_b64decode(data + '=' * (4 - len(data) % 4))
        v = aes.update(string)
        v += aes.final()
        v = self.handle_xor(v)

        obj = json.loads(v)

        if 'expires' in obj:
            expires_utc = parser.parse(obj['expires'])
            if datetime.now(tz=tzutc()) > expires_utc:
                raise Exception("Expired!")

        return obj
