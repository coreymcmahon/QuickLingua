# QuickLingua
QuickLingua is a JavaScript implementation of the SM2 algorithm used in the SuperMemo project for spaced repetition learning (see http://www.supermemo.com/english/ol/sm2.htm  for more details). It provides a (at least theoretically) optimal framework for learning large sets of data. In this implementation, this data is specifically foreign language vocabulary.

## The data
The provided dataset contains the top 5000 words in the Spanish language according to frequency. The data was taken from here: http://en.wiktionary.org/wiki/Wiktionary:Frequency_lists and translated using http://translate.google.com/

Note: this method isn't ideal in terms of accuracy. Things like noun gender, verb conjugation and context are not taken into consideration or included in the translation.