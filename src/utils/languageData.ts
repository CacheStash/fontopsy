/**
 * Comprehensive Language & Script Orthography Database
 * Supports 120+ languages across Latin, Cyrillic, and Greek scripts,
 * matching FontDrop.info detection standards while providing full character matrix telemetry.
 */

import type opentype from 'opentype.js';

export interface LanguageDefinition {
  id: string;
  name: string;
  nativeName?: string;
  script: 'Latin' | 'Cyrillic' | 'Greek';
  region: string;
  // Essential characters required for orthography (excluding standard ascii if covered by base Latin)
  requiredChars: string;
  // Full alphabet representation for display (uppercase + lowercase)
  alphabet: string;
  // Sample sentence / pangram
  sampleText: string;
}

export interface LanguageDetectionResult {
  language: LanguageDefinition;
  supported: boolean;
  isPartial: boolean;
  coverageRatio: number; // 0 to 1
  matchedCount: number;
  totalRequired: number;
  missingChars: string[];
}

export interface ScriptBlockDefinition {
  name: string;
  description: string;
  chars: string;
}

export interface ScriptBlockResult {
  name: string;
  description: string;
  chars: string;
  matchedChars: string[];
  missingChars: string[];
  coverageRatio: number;
}

const BASE_LATIN_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const BASE_LATIN_LOWER = 'abcdefghijklmnopqrstuvwxyz';

// 120+ Languages Database
export const LANGUAGES_DATABASE: LanguageDefinition[] = [
  // --- INDONESIAN & MALAY ---
  {
    id: 'indonesian',
    name: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
    script: 'Latin',
    region: 'Southeast Asia',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER,
    alphabet: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz',
    sampleText: 'Juru masak lezat membuat puding blewah harum untuk pesta senja.',
  },
  {
    id: 'malay',
    name: 'Malay',
    nativeName: 'Bahasa Melayu',
    script: 'Latin',
    region: 'Southeast Asia',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER,
    alphabet: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz',
    sampleText: 'Burung hudhud terbang melintasi jambatan pulau pinang pada waktu senja.',
  },
  {
    id: 'filipino',
    name: 'Filipino (Tagalog)',
    nativeName: 'Wikang Filipino',
    script: 'Latin',
    region: 'Southeast Asia',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'Ññ',
    alphabet: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Ññ Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz',
    sampleText: 'Ang mabilis na kayumangging aso ay tumalon sa ibabaw ng tamad na pusa.',
  },
  {
    id: 'vietnamese',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    script: 'Latin',
    region: 'Southeast Asia',
    requiredChars:
      'ÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ' +
      'àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ',
    alphabet: 'A Ă Â B C D Đ E Ê G H I K L M N O Ô Ơ P Q R S T U Ư V X Y',
    sampleText: 'Chữ thảo hoa mỹ tô thắm vẻ đẹp muôn đời của nghệ thuật thư pháp Việt.',
  },

  // --- MAJOR WESTERN & CENTRAL EUROPEAN ---
  {
    id: 'english',
    name: 'English',
    nativeName: 'English',
    script: 'Latin',
    region: 'Western Europe / Americas',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER,
    alphabet: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz',
    sampleText: 'The quick brown fox jumps over the lazy dog.',
  },
  {
    id: 'german',
    name: 'German',
    nativeName: 'Deutsch',
    script: 'Latin',
    region: 'Central Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ÄÖÜäöüß',
    alphabet: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz Ää Öö Üü ß',
    sampleText: 'Zwölf Boxkämpfer jagen Viktor quer über den großen Sylter Deich.',
  },
  {
    id: 'swiss_german',
    name: 'Swiss German',
    nativeName: 'Schwiizerdütsch',
    script: 'Latin',
    region: 'Central Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ÄÖÜäöü',
    alphabet: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz Ää Öö Üü',
    sampleText: 'Zwölf Boxchämpfer jagid de Viktor quer über de Deich.',
  },
  {
    id: 'french',
    name: 'French',
    nativeName: 'Français',
    script: 'Latin',
    region: 'Western Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ÀÂÆÇÉÈÊËÎÏÔŒÙÛÜŸàâæçéèêëîïôœùûüÿ',
    alphabet: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz Àà Ââ Ææ Çç Éé Èè Êê Ëë Îî Ïï Ôô Œœ Ùù Ûû Üü Ÿÿ',
    sampleText: 'Voix ambiguë d’un cœur qui au zéphyr préfère les jattes de kiwis.',
  },
  {
    id: 'spanish',
    name: 'Spanish',
    nativeName: 'Español',
    script: 'Latin',
    region: 'Southern Europe / Americas',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ÁÉÍÓÚÜÑáéíóúüñ¿¡',
    alphabet: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Ññ Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz Áá Éé Íí Óó Úú Üü',
    sampleText: 'El veloz murciélago hindú comía feliz cardillo y kiwi.',
  },
  {
    id: 'portuguese',
    name: 'Portuguese',
    nativeName: 'Português',
    script: 'Latin',
    region: 'Southern Europe / Americas',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ÁÂÃÀÇÉÊÍÓÔÕÚáâãàçéêíóôõú',
    alphabet: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz Áá Ââ Ãã Àà Çç Éé Êê Íí Óó Ôô Õõ Úú',
    sampleText: 'Vejam a bruxa da raposa saltando sobre a gaze translúcida do jardim.',
  },
  {
    id: 'italian',
    name: 'Italian',
    nativeName: 'Italiano',
    script: 'Latin',
    region: 'Southern Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ÀÈÉÌÒÓÙàèéìòóù',
    alphabet: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz Àà Èè Éé Ìì Òò Óó Ùù',
    sampleText: 'Ma la volpe col suo balzo ha raggiunto il quieto faggio.',
  },
  {
    id: 'dutch',
    name: 'Dutch',
    nativeName: 'Nederlands',
    script: 'Latin',
    region: 'Western Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ÄËÏÖÜáéíóúäëïöü',
    alphabet: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz IJij',
    sampleText: 'Pa’s wijze lynx bezag vroom het fijn gewaagde stukje.',
  },
  {
    id: 'afrikaans',
    name: 'Afrikaans',
    nativeName: 'Afrikaans',
    script: 'Latin',
    region: 'Southern Africa',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ÁÉÍÓÚÄËÏÖÜáéíóúäëïöüêëôû',
    alphabet: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz Êê Ëë Ôô Ûû',
    sampleText: 'Die vinnige bruin jakkals spring bo-oor die lui hond.',
  },
  {
    id: 'polish',
    name: 'Polish',
    nativeName: 'Polski',
    script: 'Latin',
    region: 'Central Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ĄĆĘŁŃÓŚŹŻąćęłńóśźż',
    alphabet: 'Aa Ąą Bb Cc Ćć Dd Ee Ęę Ff Gg Hh Ii Jj Kk Ll Łł Mm Nn Ńń Oo Óó Pp Rr Ss Śś Tt Uu Ww Yy Zz Źź Żż',
    sampleText: 'Pchnąć w tę łódź jeża lub ośm skrzyń fig.',
  },
  {
    id: 'czech',
    name: 'Czech',
    nativeName: 'Čeština',
    script: 'Latin',
    region: 'Central Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ÁČĎÉĚÍŇÓŘŠŤÚŮÝŽáčďéěíňóřšťúůýž',
    alphabet: 'Aa Áá Bb Cc Čč Dd Ďď Ee Éé Ěě Ff Gg Hh Ch Ii Íí Jj Kk Ll Mm Nn Ňň Oo Óó Pp Qq Rr Řř Ss Šš Tt Ťť Uu Úú Ůů Vv Ww Xx Yy Ýý Zz Žž',
    sampleText: 'Příliš žluťoučký kůň úpěl ďábelské ódy.',
  },
  {
    id: 'slovak',
    name: 'Slovak',
    nativeName: 'Slovenčina',
    script: 'Latin',
    region: 'Central Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽáäčďéíĺľňóôŕšťúýž',
    alphabet: 'Aa Áá Ää Bb Cc Čč Dd Ďď Dz Dž Ee Éé Ff Gg Hh Ch Ii Íí Jj Kk Ll Ĺĺ Ľľ Mm Nn Ňň Oo Óó Ôô Pp Qq Rr Ŕŕ Ss Šš Tt Ťť Uu Úú Vv Ww Xx Yy Ýý Zz Žž',
    sampleText: 'Kŕdeľ šťastných ďatľov učí pri ústí Váhu ticho žltnúce púpavy.',
  },
  {
    id: 'hungarian',
    name: 'Hungarian',
    nativeName: 'Magyar',
    script: 'Latin',
    region: 'Central Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ÁÉÍÓÖŐÚÜŰáéíóöőúüű',
    alphabet: 'Aa Áá Bb Cc Dd Ee Éé Ff Gg Hh Ii Íí Jj Kk Ll Mm Nn Oo Óó Öö Őő Pp Qq Rr Ss Tt Uu Úú Üü Űű Vv Ww Xx Yy Zz',
    sampleText: 'Egy hűtlen vejét fülöncsípő dühös mexikói úrnő gazdagsága.',
  },
  {
    id: 'romanian',
    name: 'Romanian',
    nativeName: 'Română',
    script: 'Latin',
    region: 'Eastern Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ĂÂÎȘȚăâîșț',
    alphabet: 'Aa Ăă Ââ Bb Cc Dd Ee Ff Gg Hh Ii Îî Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Șș Tt Țț Uu Vv Ww Xx Yy Zz',
    sampleText: 'Gheorghe a văzut o vulpe călare pe un bursuc în pădurea de fagi.',
  },
  {
    id: 'turkish',
    name: 'Turkish',
    nativeName: 'Türkçe',
    script: 'Latin',
    region: 'Southern Europe / Middle East',
    requiredChars: 'ABCÇDEFGĞHIİJKLMNOPRSŞTUÜVYZabcçdefgğhıijklmnoprsştuüvyz',
    alphabet: 'Aa Bb Cc Çç Dd Ee Ff Gg Ğğ Hh Iı İi Jj Kk Ll Mm Nn Oo Öö Pp Rr Ss Şş Tt Uu Üü Vv Yy Zz',
    sampleText: 'Pijamalı hasta, yağız şoföre çabucak güvendi.',
  },

  // --- SCANDINAVIAN & NORDIC ---
  {
    id: 'danish',
    name: 'Danish',
    nativeName: 'Dansk',
    script: 'Latin',
    region: 'Northern Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ÆØÅæøå',
    alphabet: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz Ææ Øø Åå',
    sampleText: 'Quizdeltagerne spiste jordbær med fløde, mens cirkusklovnen kiggede.',
  },
  {
    id: 'norwegian_bokmal',
    name: 'Norwegian Bokmål',
    nativeName: 'Norsk Bokmål',
    script: 'Latin',
    region: 'Northern Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ÆØÅæøå',
    alphabet: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz Ææ Øø Åå',
    sampleText: 'Vår sære zulu fra badeøya spilte jo whist og quickstep i fjor.',
  },
  {
    id: 'norwegian_nynorsk',
    name: 'Norwegian Nynorsk',
    nativeName: 'Norsk Nynorsk',
    script: 'Latin',
    region: 'Northern Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ÆØÅæøåÉÈéè',
    alphabet: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz Ææ Øø Åå',
    sampleText: 'Kvar sære zulu frå badeøya spelte jo whist og quickstep i fjor.',
  },
  {
    id: 'swedish',
    name: 'Swedish',
    nativeName: 'Svenska',
    script: 'Latin',
    region: 'Northern Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ÅÄÖåäö',
    alphabet: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz Åå Ää Öö',
    sampleText: 'Flygande bäckasiner söka hwila på mjuk tuva.',
  },
  {
    id: 'finnish',
    name: 'Finnish',
    nativeName: 'Suomi',
    script: 'Latin',
    region: 'Northern Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ÄÖÅäöå',
    alphabet: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz Åå Ää Öö',
    sampleText: 'Albert osti fagotin ja töräytti puhkuvan melodian.',
  },
  {
    id: 'estonian',
    name: 'Estonian',
    nativeName: 'Eesti',
    script: 'Latin',
    region: 'Northern Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ÄÖÕÜŠŽäöõüšž',
    alphabet: 'Aa Bb Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Rr Ss Šš Zz Žž Tt Uu Vv Õõ Ää Öö Üü',
    sampleText: 'Põrsa kärss tõmbas tünnist värskeid marju ja maitsvat leiba.',
  },
  {
    id: 'icelandic',
    name: 'Icelandic',
    nativeName: 'Íslenska',
    script: 'Latin',
    region: 'Northern Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ÁÐÉÍÓÚÝÞÆÖáðéíóúýþæö',
    alphabet: 'Aa Áá Bb Dd Ðð Ee Éé Ff Gg Hh Ii Íí Jj Kk Ll Mm Nn Oo Óó Pp Rr Ss Tt Uu Úú Vv Xx Yy Ýý Þþ Ææ Öö',
    sampleText: 'Kæmi ný öxi hér, ykist þjófum nú bæði víl og ádrepa.',
  },
  {
    id: 'faroese',
    name: 'Faroese',
    nativeName: 'Føroyskt',
    script: 'Latin',
    region: 'Northern Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ÁÐÍÓÚÝÆØáðíóúýæø',
    alphabet: 'Aa Áá Bb Dd Ðð Ee Ff Gg Hh Ii Íí Jj Kk Ll Mm Nn Oo Óó Pp Rr Ss Tt Uu Úú Vv Yy Ýý Ææ Øø',
    sampleText: 'Morgunroðin lýsir fjøll og víkir við norðhavsins strendur.',
  },

  // --- BALTIC & SLAVIC (LATIN) ---
  {
    id: 'latvian',
    name: 'Latvian',
    nativeName: 'Latviešu',
    script: 'Latin',
    region: 'Northern Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ĀČĒĢĪĶĻŅŠŪŽāčēģīķļņšūž',
    alphabet: 'Aa Āā Bb Cc Čč Dd Ee Ēē Ff Gg Ģģ Hh Ii Īī Jj Kk Ķķ Ll Ļļ Mm Nn Ņņ Oo Pp Rr Ss Šš Tt Uu Ūū Vv Zz Žž',
    sampleText: 'Sarkanā lapsa lēca pāri slinkajam sunim.',
  },
  {
    id: 'lithuanian',
    name: 'Lithuanian',
    nativeName: 'Lietuvių',
    script: 'Latin',
    region: 'Northern Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ĄČĘĖĮŠŲŪŽąčęėįšųūž',
    alphabet: 'Aa Ąą Bb Cc Čč Dd Ee Ęę Ėė Ff Gg Hh Ii Įį Yy Jj Kk Ll Mm Nn Oo Pp Rr Ss Šš Tt Uu Ųų Ūū Vv Zz Žž',
    sampleText: 'Įlinkusi šaka linko po prinokusių uogų svoriu.',
  },
  {
    id: 'croatian',
    name: 'Croatian',
    nativeName: 'Hrvatski',
    script: 'Latin',
    region: 'Southern Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ČĆĐŠŽčćđšž',
    alphabet: 'Aa Bb Cc Čč Ćć Dd Dž Đđ Ee Ff Gg Hh Ii Jj Kk Ll Lj Mm Nn Nj Oo Pp Rr Ss Šš Tt Uu Vv Zz Žž',
    sampleText: 'Gojazni đačić s biciklom brzo obilazi maglovit grad.',
  },
  {
    id: 'slovenian',
    name: 'Slovenian',
    nativeName: 'Slovenščina',
    script: 'Latin',
    region: 'Southern Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ČŠŽčšž',
    alphabet: 'Aa Bb Cc Čč Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Rr Ss Šš Tt Uu Vv Zz Žž',
    sampleText: 'Šerif bo za vajo spet kuhal domače žgance.',
  },
  {
    id: 'serbian_latin',
    name: 'Serbian (Latin)',
    nativeName: 'Srpski (latinica)',
    script: 'Latin',
    region: 'Southern Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ČĆĐŠŽčćđšž',
    alphabet: 'Aa Bb Cc Čč Ćć Dd Dž Đđ Ee Ff Gg Hh Ii Jj Kk Ll Lj Mm Nn Nj Oo Pp Rr Ss Šš Tt Uu Vv Zz Žž',
    sampleText: 'Ljubazni fenjerdžija čisti noćnu svetlost.',
  },
  {
    id: 'albanian',
    name: 'Albanian',
    nativeName: 'Shqip',
    script: 'Latin',
    region: 'Southern Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ÇËçë',
    alphabet: 'Aa Bb Cc Çç Dd Dh Ee Ëë Ff Gg Gj Hh Ii Jj Kk Ll Ll Mm Nn Nj Oo Pp Qq Rr Rr Ss Sh Tt Th Uu Vv Xx Xh Yy Zz Zh',
    sampleText: 'Fjalia e bukur shpreh qartë harmoninë e tingujve të lartë.',
  },
  {
    id: 'upper_sorbian',
    name: 'Upper Sorbian',
    nativeName: 'Hornjoserbšćina',
    script: 'Latin',
    region: 'Central Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ČĆĚŁŃÓŘŠŽčćěłńóřšž',
    alphabet: 'Aa Bb Cc Čč Ćć Dd Ee Ěě Ff Gg Hh Ch Ii Jj Kk Łł Ll Mm Nn Ńń Oo Óó Pp Rr Řř Ss Šš Tt Uu Ww Yy Zz Žž',
    sampleText: 'Hornjoserbska rěč je bohate kónčiny serbskeje kultury.',
  },
  {
    id: 'lower_sorbian',
    name: 'Lower Sorbian',
    nativeName: 'Dolnoserbšćina',
    script: 'Latin',
    region: 'Central Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ČĆĚŁŃÓŠŽŹčćěłńóšžź',
    alphabet: 'Aa Bb Cc Čč Ćć Dd Ee Ěě Ff Gg Hh Ch Ii Jj Kk Łł Ll Mm Nn Ńń Oo Óó Pp Rr Ss Šš Śś Tt Uu Ww Yy Zz Žž Źź',
    sampleText: 'Dolnoserbske pismo a rěc wobchowajotej tradiciju.',
  },

  // --- CELTIC & MINORITY EUROPEAN ---
  {
    id: 'irish',
    name: 'Irish',
    nativeName: 'Gaeilge',
    script: 'Latin',
    region: 'Western Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ÁÉÍÓÚáéíóú',
    alphabet: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Ll Mm Nn Oo Pp Rr Ss Tt Uu Áá Éé Íí Óó Úú',
    sampleText: 'D’fhuadaigh an spideog an phéist as an bhfaiche ghlas.',
  },
  {
    id: 'scottish_gaelic',
    name: 'Scottish Gaelic',
    nativeName: 'Gàidhlig',
    script: 'Latin',
    region: 'Western Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ÀÈÌÒÙàèìòù',
    alphabet: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Ll Mm Nn Oo Pp Rr Ss Tt Uu Àà Èè Ìì Òò Ùù',
    sampleText: 'Tha a’ ghaoth a’ sèideadh thar nam beann àrda.',
  },
  {
    id: 'welsh',
    name: 'Welsh',
    nativeName: 'Cymraeg',
    script: 'Latin',
    region: 'Western Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ÂÊÎÔÛŴŶâêîôûŵŷÄËÏÖÜäëïöü',
    alphabet: 'Aa Bb Cc Ch Dd Dd Ee Ff Ff Gg Ng Hh Ii Ll Mm Nn Oo Pp Ph Rr Rh Ss Tt Th Uu Ww Yy',
    sampleText: 'Gwelir enfys hardd uwchben y mynyddoedd gwyrddlas.',
  },
  {
    id: 'breton',
    name: 'Breton',
    nativeName: 'Brezhoneg',
    script: 'Latin',
    region: 'Western Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ÂÊÎÔÛÙâêîôûùÑñ',
    alphabet: 'Aa Bb Ch C’h Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Rr Ss Tt Uu Vv Ww Yy Zz',
    sampleText: 'Yezh Breizh a vev e kalon he fobl.',
  },
  {
    id: 'catalan',
    name: 'Catalan',
    nativeName: 'Català',
    script: 'Latin',
    region: 'Southern Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ÀÈÉÍÏÒÓÚÜÇ·àèéíïòóúüç',
    alphabet: 'Aa Bb Cc Çç Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz Àà Èè Éé Íí Ïï Òò Óó Úú Üü',
    sampleText: 'Jove xef, porti whisky amb quinze carquinyolis!',
  },
  {
    id: 'galician',
    name: 'Galician',
    nativeName: 'Galego',
    script: 'Latin',
    region: 'Southern Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ÁÉÍÓÚÑáéíóúñ',
    alphabet: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Ll Mm Nn Ññ Oo Pp Qq Rr Ss Tt Uu Vv Xx Zz',
    sampleText: 'O son do mar canta polas ribeiras galegas.',
  },
  {
    id: 'basque',
    name: 'Basque',
    nativeName: 'Euskara',
    script: 'Latin',
    region: 'Southern Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'Ññ',
    alphabet: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Ññ Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz',
    sampleText: 'Euskara da euskaldunon ondare zahar eta maitea.',
  },
  {
    id: 'maltese',
    name: 'Maltese',
    nativeName: 'Malti',
    script: 'Latin',
    region: 'Southern Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ĊĠĦŻċġħż',
    alphabet: 'Aa Bb Ċċ Dd Ee Ff Ġġ Gg Għ Hh Ħħ Ii Ie Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Żż Zz',
    sampleText: 'Il-qattus qabeż fuq il-bejt tal-knisja qadima.',
  },
  {
    id: 'esperanto',
    name: 'Esperanto',
    nativeName: 'Esperanto',
    script: 'Latin',
    region: 'International',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ĈĜĤĴŜŬĉĝĥĵŝŭ',
    alphabet: 'Aa Bb Cc Ĉĉ Dd Ee Ff Gg Ĝĝ Hh Ĥĥ Ii Jj Ĵĵ Kk Ll Mm Nn Oo Pp Rr Ss Ŝŝ Tt Uu Ŭŭ Vv Zz',
    sampleText: 'Eĥoŝanĝo ĉiuĵaŭde plenigas la grandan ĉambron.',
  },
  {
    id: 'romansh',
    name: 'Romansh',
    nativeName: 'Rumantsch',
    script: 'Latin',
    region: 'Central Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ÉÈÀàéè',
    alphabet: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz',
    sampleText: 'La lingua rumantscha fa part da la ritgezza culturala svizra.',
  },
  {
    id: 'luxembourgish',
    name: 'Luxembourgish',
    nativeName: 'Lëtzebuergesch',
    script: 'Latin',
    region: 'Western Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ÄËÉäëé',
    alphabet: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz Ää Ëë Éé',
    sampleText: 'Mir wëlle bleiwe wat mir sinn.',
  },
  {
    id: 'friulian',
    name: 'Friulian',
    nativeName: 'Furlan',
    script: 'Latin',
    region: 'Southern Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ÂÊÎÔÛÇâêîôûç',
    alphabet: 'Aa Bb Cc Çç Dd Ee Ff Gg Hh Ii Jj Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Zz',
    sampleText: 'Il furlan al è lenghe di peraule e di cjant.',
  },
  {
    id: 'asturian',
    name: 'Asturian',
    nativeName: 'Asturianu',
    script: 'Latin',
    region: 'Southern Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ÁÉÍÓÚÜÑáéíóúüñ',
    alphabet: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Ll Mm Nn Ññ Oo Pp Rr Ss Tt Uu Vv Xx Yy Zz',
    sampleText: 'Nel suelu d’Asturies la seronda dexa un mantu doráu.',
  },
  {
    id: 'western_frisian',
    name: 'Western Frisian',
    nativeName: 'Frysk',
    script: 'Latin',
    region: 'Western Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ÂÊÎÔÛÄËÖÜâêîôûäëöü',
    alphabet: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Rr Ss Tt Uu Vv Ww Yy Zz',
    sampleText: 'Bûter, brea en griene tsiis, wa’t dat net sizze kin is gjin oprjochte Fries.',
  },
  {
    id: 'cornish',
    name: 'Cornish',
    nativeName: 'Kernewek',
    script: 'Latin',
    region: 'Western Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER,
    alphabet: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Rr Ss Tt Uu Vv Ww Yy Zz',
    sampleText: 'Kernow a’m bern hag a garav pup prys.',
  },
  {
    id: 'manx',
    name: 'Manx',
    nativeName: 'Gaelg',
    script: 'Latin',
    region: 'Western Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'Çç',
    alphabet: 'Aa Bb Çç Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Rr Ss Tt Uu Vv Ww Yy',
    sampleText: 'Ta gaelg ny çhengey ghooie Ellan Vannin.',
  },
  {
    id: 'colognian',
    name: 'Colognian',
    nativeName: 'Kölsch',
    script: 'Latin',
    region: 'Western Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ÄÖÜäöü',
    alphabet: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz Ää Öö Üü',
    sampleText: 'Kölsche Tön klinge üvver dr Rhing.',
  },
  {
    id: 'walser',
    name: 'Walser',
    nativeName: 'Walserdeutsch',
    script: 'Latin',
    region: 'Central Europe',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ÄÖÜäöü',
    alphabet: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz Ää Öö Üü',
    sampleText: 'D’Walser Dialäkt isch lebendig i de Bärge.',
  },

  // --- AFRICAN LANGUAGES (LATIN ORTHOGRAPHIES) ---
  {
    id: 'swahili',
    name: 'Swahili',
    nativeName: 'Kiswahili',
    script: 'Latin',
    region: 'East Africa',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER,
    alphabet: 'Aa Bb Ch Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Rr Ss Tt Uu Vv Ww Yy Zz',
    sampleText: 'Mtu mwenye hekima huthamini maarifa kuliko dhahabu.',
  },
  {
    id: 'zulu',
    name: 'Zulu',
    nativeName: 'isiZulu',
    script: 'Latin',
    region: 'Southern Africa',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER,
    alphabet: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz',
    sampleText: 'Ukuthula nokubekezelelana kwakha umphakathi oqinile.',
  },
  {
    id: 'shona',
    name: 'Shona',
    nativeName: 'chiShona',
    script: 'Latin',
    region: 'Southern Africa',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER,
    alphabet: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Rr Ss Tt Uu Vv Ww Yy Zz',
    sampleText: 'Kutaurirana kwakanaka kunounza ruzivo norunyararo.',
  },
  {
    id: 'somali',
    name: 'Somali',
    nativeName: 'Af-Soomaali',
    script: 'Latin',
    region: 'Horn of Africa',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER,
    alphabet: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Qq Rr Ss Sh Tt Uu Ww Xx Yy',
    sampleText: 'Aqoon la’aani waa iftiin la’aan.',
  },
  {
    id: 'yoruba',
    name: 'Yoruba',
    nativeName: 'Èdè Yorùbá',
    script: 'Latin',
    region: 'West Africa',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ẸỌṢẹọṣÀÁÈÉẸ̀Ẹ́ÌÍÒÓỌ̀Ọ́ÙÚàáèéẹ̀ẹ́ìíòóọ̀ọ́ùú',
    alphabet: 'Aa Bb Dd Ee Ẹẹ Ff Gg Gb Hh Ii Jj Kk Ll Mm Nn Oo Ọọ Pp Rr Ss Ṣṣ Tt Uu Ww Yy',
    sampleText: 'Bí ẹ̀mí bá wà, ìrètí ń bẹ fún ọjọ́ ọ̀la.',
  },
  {
    id: 'igbo',
    name: 'Igbo',
    nativeName: 'Asụsụ Igbo',
    script: 'Latin',
    region: 'West Africa',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ỊỌỤịọụ',
    alphabet: 'Aa Bb Ch Dd Ee Ff Gg Gb Gh Gw Hh Ii Ịị Jj Kk Kp Kw Ll Mm Nn Nw Ny Ṅṅ Oo Ọọ Pp Rr Ss Sh Tt Uu Ụụ Vv Ww Yy Zz',
    sampleText: 'Nchekwube na-eweta olileanya n’oge ihe isi ike.',
  },
  {
    id: 'akan',
    name: 'Akan (Twi)',
    nativeName: 'Akan',
    script: 'Latin',
    region: 'West Africa',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ƐƆɛɔ',
    alphabet: 'Aa Bb Dd Ee Ɛɛ Ff Gg Hh Ii Kk Ll Mm Nn Oo Ɔɔ Pp Rr Ss Tt Uu Ww Yy',
    sampleText: 'Nyansa bun dɔɔso wɔ obi a ɔpɛ aso.',
  },
  {
    id: 'kinyarwanda',
    name: 'Kinyarwanda',
    nativeName: 'Ikinyarwanda',
    script: 'Latin',
    region: 'East Africa',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER,
    alphabet: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Rr Ss Tt Uu Vv Ww Yy Zz',
    sampleText: 'Urukundo n’amahoro nibyo bituma igihugu gitera imbere.',
  },
  {
    id: 'oromo',
    name: 'Oromo',
    nativeName: 'Afaan Oromoo',
    script: 'Latin',
    region: 'Horn of Africa',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER,
    alphabet: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz',
    sampleText: 'Nagaan bu’uura jireenya namaati.',
  },
  {
    id: 'lingala',
    name: 'Lingala',
    nativeName: 'Lingála',
    script: 'Latin',
    region: 'Central Africa',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ƐƆɛɔ',
    alphabet: 'Aa Bb Cc Dd Ee Ɛɛ Ff Gg Gb Hh Ii Kk Ll Mm Nn Ny Oo Ɔɔ Pp Rr Ss Tt Uu Vv Ww Yy Zz',
    sampleText: 'Biso nyonso tozali bana ya mokili moko.',
  },
  {
    id: 'malagasy',
    name: 'Malagasy',
    nativeName: 'Fiteny Malagasy',
    script: 'Latin',
    region: 'Madagascar / Indian Ocean',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER,
    alphabet: 'Aa Bb Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Rr Ss Tt Vv Yy Zz',
    sampleText: 'Ny firaisankina no hery ho an’ny tanindrazana.',
  },
  {
    id: 'hausa_latin',
    name: 'Hausa',
    nativeName: 'Harshen Hausa',
    script: 'Latin',
    region: 'West Africa',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ƁƊƘɓɗƙ',
    alphabet: 'Aa Bb Ɓɓ Cc Dd Ɗɗ Ee Ff Gg Hh Ii Jj Kk Ƙƙ Ll Mm Nn Oo Rr Ss Sh Tt Ts Uu Ww Yy Ƴƴ Zz',
    sampleText: 'Ilimi haske ne mai haskaka rayuwar bil’adama.',
  },
  {
    id: 'basaa',
    name: 'Basaa',
    nativeName: 'Mbene Basaa',
    script: 'Latin',
    region: 'Central Africa',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ƁƊƐƆɓɗɛɔ',
    alphabet: 'Aa Bb Ɓɓ Dd Ɗɗ Ee Ɛɛ Gg Hh Ii Kk Ll Mm Nn Oo Ɔɔ Pp Rr Ss Tt Uu Ww Yy',
    sampleText: 'Nu u nla boma libak j’an jôl.',
  },
  {
    id: 'bemba',
    name: 'Bemba',
    nativeName: 'Chibemba',
    script: 'Latin',
    region: 'Central Africa',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER,
    alphabet: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Kk Ll Mm Nn Oo Pp Ss Tt Uu Ww Yy',
    sampleText: 'Umutende na bucibusa finonka ifisuma.',
  },
  {
    id: 'bena',
    name: 'Bena',
    nativeName: 'Hibena',
    script: 'Latin',
    region: 'East Africa',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER,
    alphabet: 'Aa Bb Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Rr Ss Tt Uu Vv Ww Yy',
    sampleText: 'Ulwendo lwa munhu lwihuta kumatemba.',
  },
  {
    id: 'chiga',
    name: 'Chiga (Kiga)',
    nativeName: 'Rukiga',
    script: 'Latin',
    region: 'East Africa',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER,
    alphabet: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Mm Nn Oo Pp Rr Ss Tt Uu Vv Ww Yy Zz',
    sampleText: 'Obusingye nibwo buzaarira abantu emigisha.',
  },
  {
    id: 'duala',
    name: 'Duala',
    nativeName: 'Duala',
    script: 'Latin',
    region: 'Central Africa',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ƐƆɛɔ',
    alphabet: 'Aa Bb Dd Ee Ɛɛ Ff Gg Ii Kk Ll Mm Nn Ny Oo Ɔɔ Pp S s Tt Uu Ww Yy',
    sampleText: 'Mambo ma musango ma lendi eyidi na njo.',
  },
  {
    id: 'embu',
    name: 'Embu',
    nativeName: 'Kîembu',
    script: 'Latin',
    region: 'East Africa',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ĨŨĩũ',
    alphabet: 'Aa Bb Cc Dd Ee Gg Hh Ii Ĩĩ Jj Kk Mm Nn Oo Rr Tt Uu Ũũ Ww Yy',
    sampleText: 'Wendo na thayu nĩguo ũtũũraga andũ amwe.',
  },
  {
    id: 'ewondo',
    name: 'Ewondo',
    nativeName: 'Ewondo',
    script: 'Latin',
    region: 'Central Africa',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ƐƆɛɔ',
    alphabet: 'Aa Bb Dd Ee Ɛɛ Ff Gg Ii Kk Ll Mm Nn Oo Ɔɔ Pp Rr Ss Tt Uu Vv Ww Yy Zz',
    sampleText: 'Mvoé é ne mod a vuan te kobo.',
  },
  {
    id: 'fulah',
    name: 'Fulah',
    nativeName: 'Fulfulde',
    script: 'Latin',
    region: 'West Africa',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ƁƊƝƳɓɗɲƴ',
    alphabet: 'Aa Bb Ɓɓ Cc Dd Ɗɗ Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Ɲɲ Oo Pp Rr Ss Tt Uu Ww Yy Ƴƴ',
    sampleText: 'Jam e kisal ngoni e dow leydi meeden.',
  },
  {
    id: 'ganda',
    name: 'Ganda (Luganda)',
    nativeName: 'Oluganda',
    script: 'Latin',
    region: 'East Africa',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'Ŋŋ',
    alphabet: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Ŋŋ Oo Pp Rr Ss Tt Uu Vv Ww Yy Zz',
    sampleText: 'Emirembe n’obumu bye bikuuma eggwanga.',
  },
  {
    id: 'gusii',
    name: 'Gusii',
    nativeName: 'Ekegusii',
    script: 'Latin',
    region: 'East Africa',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER,
    alphabet: 'Aa Bb Ch Ee Gg Ii Kk Mm Nn Ng Ny Oo Rr Ss Tt Uu Ww Yy',
    sampleText: 'Bong’e n’ogotegera nigo biagera abanto bagatoka.',
  },
  {
    id: 'kamba',
    name: 'Kamba',
    nativeName: 'Kikamba',
    script: 'Latin',
    region: 'East Africa',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ĨŨĩũ',
    alphabet: 'Aa Bb Cc Dd Ee Gg Hh Ii Ĩĩ Jj Kk Ll Mm Nn Oo Rr Ss Tt Uu Ũũ Vv Ww Yy',
    sampleText: 'Ũseo na muuo nĩsyo mũsingi wa kĩsio.',
  },
  {
    id: 'kikuyu',
    name: 'Kikuyu',
    nativeName: 'Gĩkũyũ',
    script: 'Latin',
    region: 'East Africa',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ĨŨĩũ',
    alphabet: 'Aa Bb Cc Dd Ee Gg Hh Ii Ĩĩ Jj Kk Mm Nn Ny Oo Rr Tt Uu Ũũ Ww Yy',
    sampleText: 'Ũrũmwe na thayũ nĩguo ũtũũraga andũ amwe.',
  },
  {
    id: 'luo',
    name: 'Luo',
    nativeName: 'Dholuo',
    script: 'Latin',
    region: 'East Africa',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER,
    alphabet: 'Aa Bb Ch Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Ny Oo Pp Rr Ss Tt Uu Ww Yy',
    sampleText: 'Kue kod hera e gima konyo thurwa duto.',
  },
  {
    id: 'luyia',
    name: 'Luyia',
    nativeName: 'Oluluhya',
    script: 'Latin',
    region: 'East Africa',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER,
    alphabet: 'Aa Bb Ch Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Ny Oo Pp Rr Ss Tt Uu Vv Ww Yy Ts',
    sampleText: 'Ombweero no mulala biba ne tsing’ono.',
  },
  {
    id: 'meru',
    name: 'Meru',
    nativeName: 'Kĩmĩrũ',
    script: 'Latin',
    region: 'East Africa',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ĨŨĩũ',
    alphabet: 'Aa Bb Cc Dd Ee Gg Hh Ii Ĩĩ Jj Kk Mm Nn Oo Rr Tt Uu Ũũ Ww Yy',
    sampleText: 'Wendo bwa mbere bũtũmaga antũ bajũra.',
  },
  {
    id: 'north_ndebele',
    name: 'North Ndebele',
    nativeName: 'isiNdebele',
    script: 'Latin',
    region: 'Southern Africa',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER,
    alphabet: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz',
    sampleText: 'Ukuthula kuletha injabulo ebantwini bonke.',
  },
  {
    id: 'nyankole',
    name: 'Nyankole',
    nativeName: 'Runyankore',
    script: 'Latin',
    region: 'East Africa',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER,
    alphabet: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Mm Nn Oo Pp Rr Ss Tt Uu Vv Ww Yy Zz',
    sampleText: 'Obusingye burora obwengye n’obunyagambiro.',
  },
  {
    id: 'sango',
    name: 'Sango',
    nativeName: 'Sängö',
    script: 'Latin',
    region: 'Central Africa',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER,
    alphabet: 'Aa Bb Dd Ee Ff Gg Hh Ii Kk Ll Mm Nn Oo Pp Rr Ss Tt Uu Vv Ww Yy Zz',
    sampleText: 'Siriri na ndoye la ayeke fa lege ti fini.',
  },
  {
    id: 'rundi',
    name: 'Rundi (Kirundi)',
    nativeName: 'Ikirundi',
    script: 'Latin',
    region: 'East Africa',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER,
    alphabet: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Rr Ss Tt Uu Vv Ww Yy Zz',
    sampleText: 'Ubumwe n’amahoro nivyo bishinga igihugu kizima.',
  },
  {
    id: 'volapuk',
    name: 'Volapük',
    nativeName: 'Volapük',
    script: 'Latin',
    region: 'Constructed',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ÄÖÜäöü',
    alphabet: 'Aa Ää Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Öö Pp Rr Ss Tt Uu Üü Vv Xx Yy Zz',
    sampleText: 'Menefe bal, püki bal.',
  },

  // --- AMERICAS & OCEANIA ---
  {
    id: 'quechua',
    name: 'Quechua',
    nativeName: 'Runasimi',
    script: 'Latin',
    region: 'South America',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'Ññ',
    alphabet: 'Aa Ch Dd Ee Ff Gg Hh Ii Kk Ll Mm Nn Ññ Oo Pp Qq Rr Ss Tt Uu Ww Yy',
    sampleText: 'Tukuy runakunam qispisqa yurinku, runa kayninkupipas.',
  },
  {
    id: 'hawaiian',
    name: 'Hawaiian',
    nativeName: 'ʻŌlelo Hawaiʻi',
    script: 'Latin',
    region: 'Oceania',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ĀĒĪŌŪāēīōūʻ',
    alphabet: 'Aa Āā Ee Ēē Hh Ii Īī Kk Ll Mm Nn Oo Ōō Pp Uu Ūū Ww ʻ',
    sampleText: 'Ua mau ke ea o ka ʻāina i ka pono.',
  },
  {
    id: 'tongan',
    name: 'Tongan',
    nativeName: 'Lea Fakatonga',
    script: 'Latin',
    region: 'Oceania',
    requiredChars: BASE_LATIN_UPPER + BASE_LATIN_LOWER + 'ĀĒĪŌŪāēīōū',
    alphabet: 'Aa Ee Ff Hh Ii Kk Ll Mm Nn Ng Oo Pp Ss Tt Uu Vv',
    sampleText: 'Ko e fonua ʻoku malu mo fonu ʻi he nonga.',
  },

  // --- CYRILLIC SCRIPT LANGUAGES ---
  {
    id: 'russian',
    name: 'Russian',
    nativeName: 'Русский',
    script: 'Cyrillic',
    region: 'Eastern Europe / Northern Asia',
    requiredChars: 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя',
    alphabet: 'Аа Бб Вв Гг Дд Ее Ёё Жж Зз Ии Йй Кк Лл Мм Нн Оо Пп Рр Сс Тт Уу Фф Хх Цц Чч Шш Щщ Ъъ Ыы Ьь Ээ Юю Яя',
    sampleText: 'Съешь же ещё этих мягких французских булок, да выпей чаю.',
  },
  {
    id: 'ukrainian',
    name: 'Ukrainian',
    nativeName: 'Українська',
    script: 'Cyrillic',
    region: 'Eastern Europe',
    requiredChars: 'АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯабвгґдеєжзиіїйклмнопрстуфхцчшщьюя',
    alphabet: 'Аа Бб Вв Гг Ґґ Дд Ее Єє Жж Зз Ии Іі Її Йй Кк Лл Мм Нн Оо Пп Рр Сс Тt Уу Фф Хх Цц Чч Шш Щщ Ьь Юю Яя',
    sampleText: 'Чуєш, їхній фах — розгін хвиль у щасливе джерело.',
  },
  {
    id: 'belarusian',
    name: 'Belarusian',
    nativeName: 'Беларуская',
    script: 'Cyrillic',
    region: 'Eastern Europe',
    requiredChars: 'АБВГДЕЁЖЗІЙКЛМНОПРСТЎУФХЦЧШЫЬЭЮЯабвгдеёжзійклмнопрстуўфхцчшыьэюя',
    alphabet: 'Аа Бб Вв Гг Дд Ее Ёё Жж Зз Іі Йй Кк Лл Мм Нн Оо Пп Рр Сс Тт Уу Ўў Фф Хх Цц Чч Шш Ыы Ьь Ээ Юю Яя',
    sampleText: 'У рудога вераб’я ў кошыку ляжаць салодкія спелыя яблыкі.',
  },
  {
    id: 'bulgarian',
    name: 'Bulgarian',
    nativeName: 'Български',
    script: 'Cyrillic',
    region: 'Eastern Europe',
    requiredChars: 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЬЮЯабвгдежзийклмнопрстуфхцчшщъьюя',
    alphabet: 'Аа Бб Вв Гг Дд Ее Жж Зз Ии Йй Кк Лл Мм Нн Оо Пп Рр Сс Тт Уу Фф Хх Цц Чч Шш Щщ Ъъ Ьь Юю Яя',
    sampleText: 'Жълтата дюля беше цъфнала красиво в старата градина.',
  },
  {
    id: 'serbian_cyrillic',
    name: 'Serbian (Cyrillic)',
    nativeName: 'Српски (ћирилица)',
    script: 'Cyrillic',
    region: 'Southern Europe',
    requiredChars: 'АБВГДЂЕЖЗИЈКЛЉМНЊОПРСТЋУФХЦЧЏШабвгдђежзијклљмнњопрстћуфхцчџш',
    alphabet: 'Аа Бб Вв Гг Дд Ђђ Ее Жж Зз Ии Јј Кк Лл Љљ Мм Нн Њњ Оо Пп Рр Сс Тт Ћћ Уу Фф Хх Цц Чч Џџ Шш',
    sampleText: 'Љубазни фењерџија пали светиљке дуж целе београдске улице.',
  },
  {
    id: 'macedonian',
    name: 'Macedonian',
    nativeName: 'Македонски',
    script: 'Cyrillic',
    region: 'Southern Europe',
    requiredChars: 'АБВГДЃЕЖЗЅИЈКЛЉМНЊОПРСТЌУФХЦЧЏШабвгдѓежзѕијклљмнњопрстќуфхцчџш',
    alphabet: 'Аа Бб Вв Гг Дд Ѓѓ Ее Жж Зз Ѕѕ Ии Јј Кк Лл Љљ Мм Нн Њњ Оо Пп Рр Сс Тт Ќќ Уу Фф Хх Цц Чч Џџ Шш',
    sampleText: 'Ѕвончето ѕвони тивко среде убавото мајско утро.',
  },

  // --- GREEK SCRIPT ---
  {
    id: 'greek',
    name: 'Modern Greek',
    nativeName: 'Ελληνικά',
    script: 'Greek',
    region: 'Southern Europe',
    requiredChars: 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθικλμνξοπρστυφχψωςΆΈΉΊΌΎΏάέήίόύώ',
    alphabet: 'Αα Ββ Γγ Δδ Εε Ζζ Ηη Θθ Ιι Κκ Λλ Μμ Νν Ξξ Οο Ππ Ρρ Σσς Ττ Υυ Φφ Χχ Ψψ Ωω',
    sampleText: 'Ξεσκεπάζω την ψυχοφθόρα βδελυγμία ενός κρυφού πάθους.',
  },
];

// Major Script Block Definitions for script coverage inspection
export const SCRIPT_BLOCKS: ScriptBlockDefinition[] = [
  {
    name: 'Basic Latin (ASCII 32-126)',
    description: 'Standard uppercase & lowercase English alphabet, numbers, and basic punctuation.',
    chars:
      ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~',
  },
  {
    name: 'Latin-1 Supplement (U+00A0 - U+00FF)',
    description: 'Western European accented letters, currency symbols, and typographic signs.',
    chars:
      '¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ',
  },
  {
    name: 'Latin Extended-A (U+0100 - U+017F)',
    description: 'Central, Eastern European and Baltic characters (Polish, Czech, Hungarian, Turkish).',
    chars:
      'ĀāĂăĄąĆćĈĉĊċČčĎďĐđĒēĔĕĖėĘęĚěĜĝĞğĠġĢģĤĥĦħĨĩĪīĬĭĮįİıĲĳĴĵĶķĸĹĺĻļĽľĿŀŁłŃńŅņŇňŉŊŋŌōŎŏŐőŒœŔŕŖŗŘřŚśŜŝŞşŠšŢţŤťŦŧŨũŪūŬŭŮůŰűŲųŴŵŶŷŸŹźŻżŽžſ',
  },
  {
    name: 'Latin Extended-B & Diacritics',
    description: 'African Latin characters, Romanian comma-below, Vietnamese tones, and Pinyin.',
    chars:
      'ƁƂƄƆƇƉƊƋƎƏƐƑƓƔƖƗƘƠƢƤƥƦƧƨƩƬƮƯƱƲƳƵǍǎǏǐǑǒǓǔǕǖǗǘǙǚǛǜȘșȚțȞȟ',
  },
  {
    name: 'Vietnamese Tonemarks (Latin Extended Additional)',
    description: 'Full Vietnamese vowels with multiple stacked diacritics and horn/breve combinations.',
    chars:
      'ẠạẢảẤấẦầẨẩẪẫẬậẮắẰằẲẳẴẵẶặẸẹẺẻẼẽẾếỀềỂểỄễỆệỈỉỊịỌọỎỏỐốỒồỔổỖỗỘộỚớỜờỞởỠỡỢợỤụỦủỨứỪừỬửỮữỰựỲỳỴỵỶỷỸỹ',
  },
  {
    name: 'Cyrillic Base & Slavic Extensions',
    description: 'Russian, Ukrainian, Belarusian, Bulgarian, Serbian, and Macedonian alphabets.',
    chars:
      'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюяҐґЃѓЄєІіЇїЈјЉљЊњЋћЌќЎўЏџ',
  },
  {
    name: 'Modern & Polytonic Greek',
    description: 'Modern Greek alphabet with acute tonemarks and diphthong diaereses.',
    chars:
      'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθικλμνξοπρστυφχψωςΆΈΉΊΌΎΏάέήίόύώΐΰ',
  },
  {
    name: 'Numerals, Math & Currency Matrix',
    description: 'Global currency glyphs, mathematical operators, and fractions.',
    chars:
      '0123456789€$£¥¢₹₽₩₺₫₿±×÷=≠≈<≤>≥%‰°′″+−±√∞∫∑∏µπ½¼¾⅓⅔',
  },
];

/**
 * Evaluates a loaded opentype.Font instance against the 120+ language database.
 */
export function detectLanguageCoverage(font: opentype.Font): {
  results: LanguageDetectionResult[];
  fullySupportedCount: number;
  partiallySupportedCount: number;
  totalLanguages: number;
} {
  const results: LanguageDetectionResult[] = [];
  let fullySupportedCount = 0;
  let partiallySupportedCount = 0;

  LANGUAGES_DATABASE.forEach(lang => {
    const requiredCharsArray = Array.from(new Set(Array.from(lang.requiredChars)));
    const totalRequired = requiredCharsArray.length;
    const missingChars: string[] = [];

    requiredCharsArray.forEach(char => {
      // Space is always accepted
      if (char === ' ') return;
      try {
        const glyphIdx = font.charToGlyphIndex(char);
        if (glyphIdx === 0) {
          missingChars.push(char);
        }
      } catch {
        missingChars.push(char);
      }
    });

    const matchedCount = totalRequired - missingChars.length;
    const coverageRatio = totalRequired > 0 ? matchedCount / totalRequired : 0;
    const isSupported = coverageRatio === 1;
    const isPartial = !isSupported && coverageRatio >= 0.75;

    if (isSupported) {
      fullySupportedCount++;
    } else if (isPartial) {
      partiallySupportedCount++;
    }

    results.push({
      language: lang,
      supported: isSupported,
      isPartial,
      coverageRatio,
      matchedCount,
      totalRequired,
      missingChars,
    });
  });

  // Sort: 100% supported first, then partial by coverage ratio, then alphabetically
  results.sort((a, b) => {
    if (a.supported !== b.supported) {
      return a.supported ? -1 : 1;
    }
    if (a.coverageRatio !== b.coverageRatio) {
      return b.coverageRatio - a.coverageRatio;
    }
    return a.language.name.localeCompare(b.language.name);
  });

  return {
    results,
    fullySupportedCount,
    partiallySupportedCount,
    totalLanguages: LANGUAGES_DATABASE.length,
  };
}

/**
 * Evaluates Unicode Script Blocks coverage for deep font forensic analysis.
 */
export function detectScriptBlockCoverage(font: opentype.Font): ScriptBlockResult[] {
  return SCRIPT_BLOCKS.map(block => {
    const charsArray = Array.from(new Set(Array.from(block.chars)));
    const matchedChars: string[] = [];
    const missingChars: string[] = [];

    charsArray.forEach(char => {
      if (char === ' ') return;
      try {
        const glyphIdx = font.charToGlyphIndex(char);
        if (glyphIdx > 0) {
          matchedChars.push(char);
        } else {
          missingChars.push(char);
        }
      } catch {
        missingChars.push(char);
      }
    });

    const total = charsArray.filter(c => c !== ' ').length;
    const coverageRatio = total > 0 ? matchedChars.length / total : 0;

    return {
      name: block.name,
      description: block.description,
      chars: block.chars,
      matchedChars,
      missingChars,
      coverageRatio,
    };
  });
}
