"""Universal Language Codes

This library aims to provide an [en/de]coding utility for language codes.

To get a "universal" language code you create a LanguageCode object, giving it
the code and the standard it should use to look up that code.

    >>> lc = LanguageCode('en', 'iso-639-1')

Internally the code is stored in a custom standard designed specifically for
this purpose.  It doesn't have any use in the real world, so to get a useful
representation out you "encode" the code:

    >>> lc.encode('iso-639-2')
    'eng'

This is similar to Python's handling of Unicode and byte strings:

    >>> s = 'Hello, world'.decode('ascii')

    >>> s
    u'Hello, world'

    >>> s.encode('utf-8')
    'Hello, world'

"""

import copy


def _reverse_dict(d):
    return dict([(v, k) for k, v in d.items()])


INTERNAL_NAMES = {}
TO_INTERNAL = {}
FROM_INTERNAL = {}


def add_standard(standard, mapping, base=None, exclude=None):
    """Add a new standard to the list of supported standards.

    `mapping` should be a dictionary mapping your custom standard's codes to the
    internal "universal" code used by this library.

    `base` is optional.  If given it will use the given standard as a base and
    copy all of its mappings before updating it with the ones you pass in
    through `mappings`.

    This can be useful for creating your own custom standard that's mostly like
    an existing one except for a few changes:

        >>> add_standard('my-standard', {'american': 'en'}, base='iso-639-1')

    This example creates a new custom standard, which is pretty much like
    ISO-639-1 but adds a code called 'american' that represents the English
    language.  Now you can do:

        >>> lc = LanguageCode('american', 'my-standard')
        >>> lc.encode('iso-639-2')
        'en'

    You can pass a list of codes to exclude from the base through the `exclude`
    parameter:

        >>> add_standard('my-standard', {'american': 'en'},
                         base='iso-639-1', exclude=('no', 'en'))

    """
    if base:
        m = copy.copy(TO_INTERNAL[base])
        m.update(mapping)

        if exclude:
            for c in exclude:
                del m[c]
    else:
        m = mapping

    TO_INTERNAL[standard] = m
    FROM_INTERNAL[standard] = _reverse_dict(m)


def _generate_initial_data():
    INTERNAL_NAMES.update({
        'aa': u'Afar',
        'ab': u'Abkhazian',
        'ae': u'Avestan',
        'af': u'Afrikaans (Afrikaans)',
        'aka': u'Akan',
        'amh': u'Amharic',
        'an': u'Aragonese',
        'ar': u'Arabic (\u0627\u0644\u0639\u0631\u0628\u064a\u0629)',
        'as': u'Assamese (Assamese)',
        'ase': u'American Sign Language',
        'ast': u'Asturian',
        'av': u'Avaric',
        'ay': u'Aymara (Aymar)',
        'az': u'Azerbaijani (Az\u0259rbaycan)',
        'ba': u'Bashkir',
        'bam': u'Bambara',
        'be': u'Belarusian (\u0411\u0435\u043b\u0430\u0440\u0443\u0441\u043a\u0430\u044f)',
        'ber': u'Berber',
        'bh': u'Bihari',
        'bg': u'Bulgarian (\u0411\u044a\u043b\u0433\u0430\u0440\u0441\u043a\u0438)',
        'bi': u'Bislama (Bislama)',
        'bn': u'Bengali (Bengali)',
        'bnt': u'Ibibio',
        'bo': u'Tibetan (Bod skad)',
        'br': u'Breton (Brezhoneg)',
        'bs': u'Bosnian (Bosanski)',
        'ca': u'Catalan (Catal\xe0)',
        'ce': u'Chechen',
        'ch': u'Chamorro',
        'co': u'Corsican',
        'cr': u'Cree (Nehiyaw)',
        'cs': u'Czech (\u010ce\u0161tina)',
        'cu': u'Church Slavic',
        'cv': u'Chuvash',
        'cy': u'Welsh (Cymraeg)',
        'da': u'Danish (Dansk)',
        'de': u'German (Deutsch)',
        'dv': u'Divehi',
        'dz': u'Dzongkha',
        'ee': u'Ewe',
        'el': u'Greek (\u0395\u03bb\u03bb\u03b7\u03bd\u03b9\u03ba\u03ac)',
        'en': u'English (English)',
        'en-gb': u'English, British (English, British)',
        'eo': u'Esperanto (Esperanto)',
        'es': u'Spanish (Espa\xf1ol)',
        'es-ar': u'Spanish, Argentinian',
        'es-mx': u'Mexican Spanish',
        'es-ni': u'Nicaraguan Spanish',
        'et': u'Estonian (Eesti)',
        'eu': u'Basque (Euskara)',
        'fa': u'Persian (\u0641\u0627\u0631\u0633\u06cc)',
        'ff': u'Fulah',
        'fi': u'Finnish (Suomi)',
        'fil': u'Filipino',
        'fj': u'Fijian',
        'fo': u'Faroese',
        'fr': u'French (Fran\xe7ais)',
        'fr-ca': u'French, Canadian',
        'ful': u'Fula',
        'fy-nl': u'Frisian',
        'ga': u'Irish (Gaeilge)',
        'gd': u'Scottish Gaelic',
        'gl': u'Galician (Galego)',
        'gn': u'Guaran',
        'gu': u'Gujarati (\u0a97\u0ac1\u0a9c\u0ab0\u0abe\u0aa4\u0ac0)',
        'gv': u'Manx',
        'hai': u'Haida',
        'hau': u'Hausa',
        'he': u'Hebrew (\u05e2\u05d1\u05e8\u05d9\u05ea)',
        'hi': u'Hindi (\u0939\u093f\u0928\u094d\u0926\u0940)',
        'ho': u'Hiri Motu',
        'hr': u'Croatian (Hrvatski)',
        'ht': u'Creole, Haitian',
        'hu': u'Hungarian (Magyar)',
        'hy': u'Armenian (\u0540\u0561\u0575\u0565\u0580\u0565\u0576)',
        'hz': u'Herero',
        'ibo': u'Igbo',
        'ia': u'Interlingua',
        'id': u'Indonesian (Bahasa Indonesia)',
        'ie': u'Interlingue',
        'ik': u'Inupia',
        'ii': u'Sichuan Yi',
        'io': u'Ido',
        'is': u'Icelandic (\xcdslenska)',
        'it': u'Italian (Italiano)',
        'iu': u'Inuktitut (Inuktitut)',
        'ja': u'Japanese (\u65e5\u672c\u8a9e)',
        'jv': u'Javanese',
        'ka': u'Georgian (\u10e5\u10d0\u10e0\u10d7\u10e3\u10da\u10d8)',
        'kau': u'Kanuri',
        'kik': u'Gikuyu',
        'kin': u'Kinyarwanda',
        'kj': u'Kuanyama, Kwanyama',
        'kk': u'Kazakh (\u049b\u0430\u0437\u0430\u049b\u0448\u0430)',
        'kl': u'Kalaallisut',
        'km': u'Khmer (Cambodian)',
        'kn': u'Kannada (\u0c95\u0ca8\u0ccd\u0ca8\u0ca1)',
        'ko': u'Korean (\ud55c\uad6d\uc5b4)',
        'kon': u'Kongo',
        'ks': u'Kashmiri',
        'ku': u'Kurdish',
        'kv': u'Komi',
        'kw': u'Cornish (Kernewek/Karnuack)',
        'ky': u'Kyrgyz (K\u0131rg\u0131zca)',
        'la': u'Latin',
        'lb': u'Luxembourgish',
        'lg': u'Ganda',
        'li': u'Limburgish',
        'lin': u'Lingala',
        'lkt': u'Lakota',
        'lo': u'Lao (Lao)',
        'lt': u'Lithuanian (Lietuvi\u0173)',
        'lu': u'Luba-Katagana',
        'lua': u'Luba-Kasai',
        'luo': u'Luo',
        'luy': u'Luhya',
        'lv': u'Latvian (Latvie\u0161u)',
        'meta-geo': u'Metadata: Geo',
        'meta-tw': u'Metadata: Twitter',
        'meta-wiki': u'Metadata: Wikipedia',
        'mh': u'Marshallese',
        'mi': u'Maori',
        'mk': u'Macedonian (\u041c\u0430\u043a\u0435\u0434\u043e\u043d\u0441\u043a\u0438)',
        'ml': u'Malayalam (Malayalam)',
        'mlg': u'Malagasy',
        'mn': u'Mongolian (\u041c\u043e\u043d\u0433\u043e\u043b)',
        'mnk': u'Mandinka',
        'mo': u'Moldavian, Moldovan',
        'moh': u'Mohawk',
        'mos': u'Mossi',
        'mr': u'Marathi (\u092e\u0930\u093e\u0920\u0940)',
        'ms': u'Malay (Bahasa Melayu)',
        'mt': u'Maltese (bil-Malti)',
        'my': u'Burmese (Myanmasa)',
        'na': u'Naurunan',
        'nb': u'Norwegian Bokmal (Norsk Bokm\xe5l)',
        'nd': u'North Ndebele',
        'ne': u'Nepali (\u0928\u0947\u092a\u093e\u0932\u0940)',
        'ng': u'Ndonga',
        'nl': u'Dutch (Nederlands)',
        'nn': u'Norwegian Nynorsk (Nynorsk)',
        'no': u'Norwegian',
        'nr': u'Southern Ndebele',
        'nso': u'Northern Sotho',
        'nv': u'Navajo',
        'nya': u'Chewa',
        'oc': u'Occitan (Occitan)',
        'oji': u'Ojibwe',
        'or': u'Oriya (Oriya)',
        'orm': u'Oromo',
        'os': u'Ossetian, Ossetic',
        'pa': u'Punjabi (\u0a2a\u0a70\u0a1c\u0a3e\u0a2c\u0a40)',
        'pi': u'Pali',
        'pl': u'Polish (Polski)',
        'ps': u'Pashto (\u067e\u069a\u062a\u0648)',
        'pt': u'Portuguese (Portugu\xeas)',
        'pt-br': u'Portuguese, Brazilian',
        'que': u'Quechua',
        'rm': u'Romansh',
        'ro': u'Romanian (Rom\xe2n\u0103)',
        'ru': u'Russian (\u0420\u0443\u0441\u0441\u043a\u0438\u0439)',
        'run': u'Rundi',
        'rup': u'Macedo (Aromanian) Romanian',
        'ry': u'Rusyn',
        'sa': u'Sanskrit',
        'sc': u'Sardinian',
        'sd': u'Sindhi',
        'se': u'Northern Sami',
        'sg': u'Sango',
        'sh': u'Serbo-Croatian (Srpskohrvatski)',
        'si': u'Sinhala (Sinhalese)',
        'sk': u'Slovak (Sloven\u010dina)',
        'sl': u'Slovenian (Sloven\u0161\u010dina)',
        'sm': u'Samoan',
        'sna': u'Shona',
        'som': u'Somali',
        'sot': u'Sotho',
        'sq': u'Albanian (Shqip)',
        'sr': u'Serbian (\u0421\u0440\u043f\u0441\u043a\u0438 / Srpski)',
        'sr-latn': u'Serbian, Latin',
        'ss': u'Swati',
        'su': u'Sudanese',
        'sv': u'Swedish (Svenska)',
        'swa': u'Swahili',
        'ta': u'Tamil (\u0ba4\u0bae\u0bbf\u0bb4\u0bcd)',
        'te': u'Telugu (\u0c24\u0c46\u0c32\u0c41\u0c17\u0c41)',
        'tg': u'Tajik',
        'th': u'Thai (\u0e44\u0e17\u0e22)',
        'tir': u'Tigrinya',
        'tk': u'Turkmen',
        'tl': u'Tagalog (Tagalog)',
        'tlh': u'Klingon',
        'to': u'Tonga',
        'tr': u'Turkish (T\xfcrk\xe7e)',
        'ts': u'Tsonga',
        'tsn': u'Tswana',
        'tt': u'Tartar',
        'tw': u'Twi',
        'ty': u'Tahitian',
        'ug': u'Uighur',
        'uk': u'Ukrainian (\u0423\u043a\u0440\u0430\u0457\u043d\u0441\u044c\u043a\u0430)',
        'umb': u'Umbundu',
        'ur': u'Urdu (\u0627\u0699\u062f\u0648)',
        'uz': u'Uzbek (O\u2018zbek)',
        've': u'Venda',
        'vi': u'Vietnamese (Ti\u1ebfng Vi\u1ec7t)',
        'vo': u'Volapuk',
        'wa': u'Walloon',
        'wol': u'Wolof',
        'xho': u'Xhosa',
        'yi': u'Yiddish (\u05d9\u05d9\u05b4\u05d3\u05d9\u05e9)',
        'yor': u'Yoruba',
        'za': u'Zhuang, Chuang:',
        'zh': u'Chinese, Yue (\u4e2d\u6587)',
        'zh-cn': u'Chinese, Simplified (\u7b80\u4f53\u5b57)',
        'zh-tw': u'Chinese, Traditional (\u7c21\u9ad4\u5b57)',
        'zul': u'Zulu',
    })

    add_standard('iso-639-1', {
        'ab': 'ab',
        'aa': 'aa',
        'af': 'af',
        'ak': 'aka',
        'sq': 'sq',
        'am': 'amh',
        'ar': 'ar',
        'an': 'an',
        'hy': 'hy',
        'as': 'as',
        'av': 'av',
        'ae': 'ae',
        'ay': 'ay',
        'az': 'az',
        'bm': 'bam',
        'ba': 'ba',
        'eu': 'eu',
        'be': 'be',
        'bn': 'bn',
        'bh': 'bh',
        'bi': 'bi',
        'bs': 'bs',
        'br': 'br',
        'bg': 'bg',
        'my': 'my',
        'ca': 'ca',
        'km': 'km',
        'ch': 'ch',
        'ce': 'ce',
        'ny': 'nya',
        'zh': 'zh',
        'cu': 'cu',
        'cv': 'cv',
        'kw': 'kw',
        'co': 'co',
        'cr': 'cr',
        'hr': 'hr',
        'cs': 'cs',
        'da': 'da',
        'dv': 'dv',
        'nl': 'nl',
        'dz': 'dz',
        'en': 'en',
        'eo': 'eo',
        'et': 'et',
        'ee': 'ee',
        'fo': 'fo',
        'fj': 'fj',
        'fi': 'fi',
        'fr': 'fr',
        'ff': 'ff',
        'gl': 'gl',
        'lg': 'lg',
        'ka': 'ka',
        'de': 'de',
        'el': 'el',
        'gn': 'gn',
        'gu': 'gu',
        'ht': 'ht',
        'ha': 'hau',
        'he': 'he',
        'hz': 'hz',
        'hi': 'hi',
        'ho': 'ho',
        'hu': 'hu',
        'is': 'is',
        'io': 'io',
        'ig': 'ibo',
        'id': 'id',
        'ia': 'ia',
        'ie': 'ie',
        'iu': 'iu',
        'ik': 'ik',
        'ga': 'ga',
        'it': 'it',
        'ja': 'ja',
        'jv': 'jv',
        'kl': 'kl',
        'kn': 'kn',
        'kr': 'kau',
        'ks': 'ks',
        'kk': 'kk',
        'ki': 'kik',
        'rw': 'kin',
        'ky': 'ky',
        'kv': 'kv',
        'kg': 'kon',
        'ko': 'ko',
        'kj': 'kj',
        'ku': 'ku',
        'lo': 'lo',
        'la': 'la',
        'lv': 'lv',
        'li': 'li',
        'ln': 'lin',
        'lt': 'lt',
        'lu': 'lu',
        'lb': 'lb',
        'mk': 'mk',
        'mg': 'mlg',
        'ms': 'ms',
        'ml': 'ml',
        'mt': 'mt',
        'gv': 'gv',
        'mi': 'mi',
        'mr': 'mr',
        'mh': 'mh',
        'mo': 'mo',
        'mn': 'mn',
        'na': 'na',
        'nv': 'nv',
        'ng': 'ng',
        'ne': 'ne',
        'nd': 'nd',
        'se': 'se',
        'no': 'nb',
        'nb': 'nb',
        'nn': 'nn',
        'oc': 'oc',
        'oj': 'oji',
        'or': 'or',
        'om': 'orm',
        'os': 'os',
        'pi': 'pi',
        'pa': 'pa',
        'fa': 'fa',
        'pl': 'pl',
        'pt': 'pt',
        'ps': 'ps',
        'qu': 'que',
        'ro': 'ro',
        'rm': 'rm',
        'rn': 'run',
        'ru': 'ru',
        'ry': 'ry',
        'sm': 'sm',
        'sg': 'sg',
        'sa': 'sa',
        'sc': 'sc',
        'gd': 'gd',
        'sr': 'sr',
        'sh': 'sh',
        'sn': 'sna',
        'ii': 'ii',
        'sd': 'sd',
        'si': 'si',
        'sk': 'sk',
        'sl': 'sl',
        'so': 'som',
        'st': 'sot',
        'nr': 'nr',
        'es': 'es',
        'su': 'su',
        'sw': 'swa',
        'ss': 'ss',
        'sv': 'sv',
        'tl': 'tl',
        'ty': 'ty',
        'tg': 'tg',
        'ta': 'ta',
        'tt': 'tt',
        'te': 'te',
        'th': 'th',
        'bo': 'bo',
        'ti': 'tir',
        'to': 'to',
        'ts': 'ts',
        'tn': 'tsn',
        'tr': 'tr',
        'tk': 'tk',
        'tw': 'tw',
        'ug': 'ug',
        'uk': 'uk',
        'ur': 'ur',
        'uz': 'uz',
        've': 've',
        'vi': 'vi',
        'vo': 'vo',
        'wa': 'wa',
        'cy': 'cy',
        'fy': 'fy-nl',
        'wo': 'wol',
        'xh': 'xho',
        'yi': 'yi',
        'yo': 'yor',
        'za': 'za',
        'zu': 'zul',
    })

    add_standard('django', {
        'ar': 'ar',
        'az': 'az',
        'bg': 'bg',
        'bn': 'bn',
        'bs': 'bs',
        'ca': 'ca',
        'cs': 'cs',
        'cy': 'cy',
        'da': 'da',
        'de': 'de',
        'el': 'el',
        'en': 'en',
        'en-gb': 'en-gb',
        'es': 'es',
        'es-ar': 'es-ar',
        'es-mx': 'es-mx',
        'es-ni': 'es-ni',
        'et': 'et',
        'eu': 'eu',
        'fa': 'fa',
        'fi': 'fi',
        'fr': 'fr',
        'fy-nl': 'fy-nl',
        'ga': 'ga',
        'gl': 'gl',
        'he': 'he',
        'hi': 'hi',
        'hr': 'hr',
        'hu': 'hu',
        'id': 'id',
        'is': 'is',
        'it': 'it',
        'ja': 'ja',
        'ka': 'ka',
        'km': 'km',
        'kn': 'kn',
        'ko': 'ko',
        'lt': 'lt',
        'lv': 'lv',
        'mk': 'mk',
        'ml': 'ml',
        'mn': 'mn',
        'nl': 'nl',
        'nb': 'nb',
        'nn': 'nn',
        'pa': 'pa',
        'pl': 'pl',
        'pt': 'pt',
        'pt-br': 'pt-br',
        'ro': 'ro',
        'ru': 'ru',
        'sk': 'sk',
        'sl': 'sl',
        'sq': 'sq',
        'sr': 'sr',
        'sr-latn': 'sr-latn',
        'sv': 'sv',
        'ta': 'ta',
        'te': 'te',
        'th': 'th',
        'tr': 'tr',
        'uk': 'uk',
        'ur': 'ur',
        'vi': 'vi',
        'zh-cn': 'zh-cn',
        'zh-tw': 'zh-tw',
    })

    add_standard('unisubs', {
        'es-ar': 'es-ar',
        'en-gb': 'en-gb',
        'pt-br': 'pt-br',
        'sr-latn': 'sr-latn',
        'zh-cn': 'zh-cn',
        'zh-tw': 'zh-tw',
        'eo': 'eo',
        'meta-tw': 'meta-tw',
        'meta-geo': 'meta-geo',
        'meta-wiki': 'meta-wiki',
        'iu': 'iu',
        'moh': 'moh',
        'oji': 'oji',
        'cr': 'cr',
        'hai': 'hai',
        'ase': 'ase',
        'wol': 'wol',
        'que': 'que',
        'swa': 'swa',
        'br': 'br',
        'be': 'be',
        'ber': 'ber',
        'hau': 'hau',
        'orm': 'orm',
        'zul': 'zul',
        'som': 'som',
        'yor': 'yor',
        'ibo': 'ibo',
        'af': 'af',
        'kin': 'kin',
        'amh': 'amh',
        'sna': 'sna',
        'bam': 'bam',
        'aka': 'aka',
        'bnt': 'bnt',
        'ful': 'ful',
        'mlg': 'mlg',
        'lin': 'lin',
        'nya': 'nya',
        'xho': 'xho',
        'kon': 'kon',
        'tir': 'tir',
        'luo': 'luo',
        'lua': 'lua',
        'kik': 'kik',
        'mos': 'mos',
        'sot': 'sot',
        'luy': 'luy',
        'tsn': 'tsn',
        'kau': 'kau',
        'umb': 'umb',
        'nso': 'nso',
        'mnk': 'mnk',
        'ky': 'ky',
        'mr': 'mr',
        'ml': 'ml',
        'or': 'or',
        'gu': 'gu',
        'as': 'as',
        'fil': 'fil',
        'si': 'si',
        'zh': 'zh',
        'oc': 'oc',
        'ht': 'ht',
        'ne': 'ne',
        'ee': 'ee',
        'ms': 'ms',
        'yi': 'yi',
        'my': 'my',
        'bo': 'bo',
        'ast': 'ast',
        'ay': 'ay',
        'ps': 'ps',
        'lkt': 'lkt',
        'kw': 'kw',
        'tlh': 'tlh',
        'mt': 'mt',
        'hy': 'hy',
        'bi': 'bi',
        'fr-ca': 'fr-ca',
        'sh': 'sh',
        'lo': 'lo',
        'rup': 'rup',
        'tl': 'tl',
        'uz': 'uz',
        'kk': 'kk',
    }, base='django')

_generate_initial_data()

class LanguageCode(object):
    def __init__(self, language_code, standard):
        self._code = TO_INTERNAL[standard.lower()][language_code]

    def encode(self, standard, fuzzy=False):
        """Return the code for this language in the given standard."""
        if fuzzy:
            return self._fuzzy_encode(standard)
        else:
            return FROM_INTERNAL[standard.lower()][self._code]

    def _fuzzy_encode(self, standard):
        """Return the code or closest approximate for this language in the given standard.

        This will try harder than the `encode()` function, but may result in
        data loss.  For example:

            >>> lc = LanguageCode('en-gb', 'django')

            >>> lc.name()
            'British English'

            >>> lc.encode('iso-639-1')
            KeyError...

            >>> lc.fuzzy_encode('iso-639-1')
            'en'

        Here's an example of how you can lose data:

            >>> original = 'en-gb'                           # Start with 'en-gb'
            >>> lc = LanguageCode(original, 'django')        # Decode as Django
            >>> new_lang = lc.fuzzy_encode('iso-639-1')      # Fuzzy encode to ISO-639-1
            >>> new_lc = LanguageCode(new_lang, 'iso-639-1') # Decode as ISO-639-1
            >>> result = new_lc.encode('django')             # Encode back to Django
            >>> assert original != result

        """
        # TODO: This.
        return

    def name(self):
        return INTERNAL_NAMES[self._code]

    def aliases(self):
        """Return the "aliases" for this language code.

        This is easiest to describe with an example:

            >>> LanguageCode('en', 'iso-639-1').aliases()
            { 'iso-639-1': 'en',
              'iso-639-2': 'eng',
              'django': 'en',
              # ...
            }
        """
        standards = FROM_INTERNAL.keys()
        return dict([(standard, FROM_INTERNAL[standard][self._code])
                     for standard in standards
                     if FROM_INTERNAL[standard].get(self._code)])


def _debug_missing_languages(standard):
    """Return a list of all the languages missing from the given standard."""
    return [(internal_code, name)
            for internal_code, name in INTERNAL_NAMES.items()
            if internal_code not in FROM_INTERNAL]
