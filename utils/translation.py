# -*- coding: utf-8 -*-

from django.utils.translation import get_language, ugettext as _
from django.conf import settings
from django.core.cache import cache

LANGUAGE_NAMES = (
    ('ab', _(u'Abkhazian'), u'Abkhazian'),
    ('aa', _(u'Afar'), u'Afar'),
    ('af', _(u'Afrikaans'), u'Afrikaans'),
    ('ak', _(u'Akan'), u'Akana'),
    ('sq', _(u'Albanian'), u'Shqip'),
    ('al', _(u'Alemannic'), u'Alemannisch'),
    ('am', _(u'Amharic'), u'Amharic'),
    ('ag', _(u'Anglo-Saxon'), u'AngloSaxon'),
    ('ar', _(u'Arabic'), u'العربية'),
    ('an', _(u'Aragonese'), u'Aragonés'),
    ('hy', _(u'Armenian'), u'Հայերեն'),
    ('ra', _(u'Aromanian'), u'Armãneashce'),
    ('as', _(u'Assamese'), u'Assamese'),
    ('at', _(u'Asturian'), u'Asturianu'),
    ('av', _(u'Avar'), u'Авар'),
    ('ay', _(u'Aymara'), u'Aymar'),
    ('az', _(u'Azeri'), u'Azərbaycan'),
    ('bm', _(u'Bambara'), u'Bamanankan'),
    ('ba', _(u'Bashkir'), u'Башҡорт'),
    ('eu', _(u'Basque'), u'Euskara'),
    ('be', _(u'Belarusian'), u'Беларуская'),
    ('bn', _(u'Bengali'), u'Bengali'),
    ('bh', _(u'Bihari'), u'भोजपुर'),
    ('bi', _(u'Bislama'), u'Bislama'),
    ('bs', _(u'Bosnian'), u'Bosanski'),
    ('br', _(u'Breton'), u'Brezhoneg'),
    ('bg', _(u'Bulgarian'), u'Български'),
    ('my', _(u'Burmese'), u'Myanmasa'),
    ('km', _(u'Cambodian'), u'Cambodian'),
    ('ca', _(u'Catalan'), u'Català'),
    ('ch', _(u'Chamorro'), u'Chamoru'),
    ('ce', _(u'Cherokee'), u'Cherokee'),
    ('zh', _(u'Chinese'), u'中文'),
    ('zh-cn', _(u'Chinese, Simplified'), u'简体字'),
    ('zh-tw', _(u'Chinese, Traditional'), u'簡體字'),
    ('kw', _(u'Cornish'), u'Kernewek/Karnuack'),
    ('co', _(u'Corsican'), u'Corsu'),
    ('cr', _(u'Cree'), u'Nehiyaw'),
    ('hr', _(u'Croatian'), u'Hrvatski'),
    ('cs', _(u'Czech'), u'Čeština'),
    ('da', _(u'Danish'), u'Dansk'),
    ('dv', _(u'Divehi'), u'Divehi'),
    ('nl', _(u'Dutch'), u'Nederlands'),
    ('dz', _(u'Dzongkha'), u'Dzongkha'),
    ('en', _(u'English'), u'English'),
    ('en-gb', _(u'English, British'), u'English, British'),
    ('eo', _(u'Esperanto'), u'Esperanto'),
    ('et', _(u'Estonian'), u'Eesti'),
    ('fo', _(u'Faroese'), u'Føroyskt'),
    ('fj', _(u'Fijian'), u'Na Vosa Vakaviti'),
    ('fi', _(u'Finnish'), u'Suomi'),
    ('fr', _(u'French'), u'Français'),
    ('gl', _(u'Galician'), u'Galego'),
    ('ka', _(u'Georgian'), u'ქართული'),
    ('de', _(u'German'), u'Deutsch'),
    ('el', _(u'Greek'), u'Ελληνικά'),
    ('kl', _(u'Greenlandic'), u'Kalaallisut'),
    ('gn', _(u'Guarani'), u'Avañe\'ẽ'),
    ('gu', _(u'Gujarati'), u'ગુજરાતી'),
    ('ha', _(u'Hausa'), u'هَوُسَ'),
    ('he', _(u'Hebrew'), u'עברית'),
    ('hi', _(u'Hindi'), u'हिन्दी'),
    ('hm', _(u'Hmong'), u'Hmong'),
    ('hu', _(u'Hungarian'), u'Magyar'),
    ('is', _(u'Icelandic'), u'Íslenska'),
    ('io', _(u'Ido'), u'Ido'),
    ('id', _(u'Indonesian'), u'Bahasa Indonesia'),
    ('ia', _(u'Interlingua'), u'Interlingua'),
    ('ie', _(u'Interlingue'), u'Interlingue'),
    ('iu', _(u'Inuktitut'), u'Inuktitut'),
    ('ik', _(u'Inupiak'), u'Iñupiak'),
    ('ga', _(u'Irish'), u'Gaeilge'),
    ('it', _(u'Italian'), u'Italiano'),
    ('ja', _(u'Japanese'), u'日本語'),
    ('jv', _(u'Javanese'), u'Basa Jawa'),
    ('kn', _(u'Kannada'), u'ಕನ್ನಡ'),
    ('ks', _(u'Kashmiri'), u'कश्मीरी - (كشميري'),
    ('cb', _(u'Kashubian'), u'Kaszëbsczi'),
    ('kk', _(u'Kazakh'), u'қазақша'),
    ('ky', _(u'Kirghiz'), u'Kırgızca'),
    ('rn', _(u'Kirundi'), u'Kirundi'),
    ('tm', _(u'Klingon'), u'tlhIngan-Hol'),
    ('ko', _(u'Korean'), u'한국어'),
    ('ku', _(u'Kurdish'), u'Kurdî / كوردی'),
    ('lo', _(u'Lao'), u'Lao'),
    ('la', _(u'Latin'), u'Latina'),
    ('lv', _(u'Latvian'), u'Latviešu'),
    ('li', _(u'Limburgian'), u'Limburgs'),
    ('ln', _(u'Lingala'), u'Lingala'),
    ('lt', _(u'Lithuanian'), u'Lietuvių'),
    ('jb', _(u'Lojban'), u'Lojban'),
    ('nd', _(u'Low Saxon'), u'Plattdüütsch'),
    ('lb', _(u'Luxembourgish'), u'Lëtzebuergesch'),
    ('mk', _(u'Macedonian'), u'Македонски'),
    ('mg', _(u'Malagasy'), u'Malagasy'),
    ('ms', _(u'Malay'), u'Bahasa Melayu'),
    ('ml', _(u'Malayalam'), u'Malayalam'),
    ('mt', _(u'Maltese'), u'bil-Malti'),
    ('gv', _(u'Manx'), u'Gaelg'),
    ('mi', _(u'Maori'), u'Māori'),
    ('mr', _(u'Marathi'), u'मराठी'),
    ('mh', _(u'Marshallese'), u'Ebon'),
    ('zm', _(u'Min Nan'), u'Bân-lâm-gú'),
    ('mo', _(u'Moldovan'), u'Moldoveana'),
    ('mn', _(u'Mongoloian'), u'Монгол'),
    ('nh', _(u'Nahuatl'), u'Nahuatl'),
    ('na', _(u'Nauruan'), u'dorerin Naoero'),
    ('ne', _(u'Nepali'), u'नेपाली'),
    ('nb', _(u'Norwegian, Bokmal'), u'Norsk Bokmål'),
    ('nn', _(u'Norwegian, Nynorsk'), u'Nynorsk'),
    ('oc', _(u'Occitan'), u'Occitan'),
    ('or', _(u'Oriya'), u'Oriya'),
    ('om', _(u'Oromo'), u'Oromoo'),
    ('pi', _(u'Pali'), u'पािऴ'),
    ('ps', _(u'Pashto'), u'پښتو'),
    ('fa', _(u'Persian'), u'فارسی'),
    ('pl', _(u'Polish'), u'Polski'),
    ('pt', _(u'Portuguese'), u'Português'),
    ('pa', _(u'Punjabi'), u'ਪੰਜਾਬੀ'),
    ('qu', _(u'Quechua'), u'Runa Simi'),
    ('rm', _(u'Raeto Romance'), u'Rumantsch'),
    ('ro', _(u'Romanian'), u'Română'),
    ('ru', _(u'Russian'), u'Русский'),
    ('rw', _(u'Rwandi'), u'Kinyarwanda'),
    ('sm', _(u'Samoan'), u'Gagana Samoa'),
    ('sg', _(u'Sango'), u'Sängö'),
    ('sa', _(u'Sanskrit'), u'संस्कृतम्'),
    ('sc', _(u'Sardinian'), u'Sardu'),
    ('gd', _(u'Scottish Gaelic'), u'Gàidhlig'),
    ('sr', _(u'Serbian'), u'Српски / Srpski'),
    ('sh', _(u'Serbo-Croatian'), u'Srpskohrvatski'),
    ('tn', _(u'Setswana'), u'Setswana'),
    ('sn', _(u'Shona'), u'chiShona'),
    ('sb', _(u'Sicilian'), u'Sicilianu'),
    ('se', _(u'Simple English'), u'Simple English'),
    ('sd', _(u'Sindhi'), u'سنڌي'),
    ('si', _(u'Sinhalese'), u'Sinhalese'),
    ('sk', _(u'Slovak'), u'Slovenčina'),
    ('sl', _(u'Slovenian'), u'Slovenščina'),
    ('so', _(u'Somali'), u'Soomaaliga'),
    ('st', _(u'Southern Sotho'), u'seSotho'),
    ('es', _(u'Spanish'), u'Español'),
    ('su', _(u'Sundanese'), u'Basa Sunda'),
    ('sw', _(u'Swahili'), u'Kiswahili'),
    ('ss', _(u'Swati'), u'SiSwati'),
    ('sv', _(u'Swedish'), u'Svenska'),
    ('tl', _(u'Tagalog'), u'Tagalog'),
    ('tg', _(u'Tajik'), u'Тоҷикӣ'),
    ('ta', _(u'Tamil'), u'தமிழ்'),
    ('tt', _(u'Tatar'), u'Tatarça / Татарча'),
    ('te', _(u'Telugu'), u'తెలుగు'),
    ('th', _(u'Thai'), u'ไทย'),
    ('bo', _(u'Tibetan'), u'Bod skad'),
    ('ti', _(u'Tigrinya'), u'Tigrinya'),
    ('tp', _(u'Tok Pisin'), u'Tok Pisin'),
    ('tq', _(u'Tokipona'), u'Tokipona'),
    ('to', _(u'Tongan'), u'faka Tonga'),
    ('ts', _(u'Tsonga'), u'Xitsonga'),
    ('tr', _(u'Turkish'), u'Türkçe'),
    ('tk', _(u'Turkmen'), u'تركمن / Туркмен'),
    ('tw', _(u'Twi'), u'Twi'),
    ('uk', _(u'Ukrainian'), u'Українська'),
    ('ur', _(u'Urdu'), u'اڙدو'),
    ('ug', _(u'Uyghur'), u'Oyghurque'),
    ('uz', _(u'Uzbek'), u'O‘zbek'),
    ('vi', _(u'Vietnamese'), u'Tiếng Việt'),
    ('vo', _(u'Volapuk'), u'Volapük'),
    ('wa', _(u'Walloon'), u'Walon'),
    ('cy', _(u'Welsh'), u'Cymraeg'),
    ('fy', _(u'West Frisian'), u'Frysk'),
    ('wo', _(u'Wolof'), u'Wollof'),
    ('xh', _(u'Xhosan'), u'isiXhosa'),
    ('yi', _(u'Yiddish'), u'ייִדיש'),
    ('yo', _(u'Yoruba'), u'Yorùbá'),
    ('za', _(u'Zhuang'), u'Cuengh'),
    ('zu', _(u'Zulu'), u'isiZulu'),
)

ORIGINAL_LANGUAGE_NAMES = dict((item[0], item[2]) for item in LANGUAGE_NAMES)

def get_languages_list(with_empty=False):
    cache_key = 'langs-cache-%s' % get_language() 
    
    languages = cache.get(cache_key)
    
    if not languages:
        languages = []
        
        for val, name in settings.ALL_LANGUAGES:
            if val in ORIGINAL_LANGUAGE_NAMES:
                name = u'%s (%s)' % (_(name), ORIGINAL_LANGUAGE_NAMES[val])
            else:
                name = _(name)
            languages.append((val, name))
        languages.sort(key=lambda item: item[1])
        cache.set(cache_key, languages, 60*60)
    if with_empty:
        languages = [('', '---------')]+languages
    return languages

from django.utils.translation.trans_real import parse_accept_lang_header
from django.utils import translation

def get_user_languages_from_request(request):
    if request.user.is_authenticated():
        languages = [l.language for l in request.user.userlanguage_set.all()]    
        if languages:
            return languages
        
    languages = []
    
    trans_lang = translation.get_language()
    if not trans_lang in languages:
        languages.append(trans_lang)
    
    if hasattr(request, 'session'):
        lang_code = request.session.get('django_language', None)
        if lang_code is not None and not lang_code in languages:
            languages.append(lang_code)
            
    cookie_lang_code = request.COOKIES.get(settings.LANGUAGE_COOKIE_NAME)
    if cookie_lang_code and not cookie_lang_code in languages:
        languages.append(cookie_lang_code)
        
    accept = request.META.get('HTTP_ACCEPT_LANGUAGE', '')        
    for lang, val in parse_accept_lang_header(accept):
        if lang and lang != '*' and not lang in languages:
            languages.append(lang)
    return languages