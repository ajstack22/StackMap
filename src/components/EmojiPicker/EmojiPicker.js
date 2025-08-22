import React, { useState, useEffect } from 'react';
import { Text, TextInput } from '../Typography';
import {
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Image,
  FlatList,
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  SHADOWS,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  COLORS,
  isTablet,
  CUSTOM_IMAGE_SOURCES,
  getCustomImageSource,
} from '../../constants';
import emojiData from 'emoji-datasource-apple/emoji.json';

const { width: screenWidth } = Dimensions.get('window');

// Create emoji search index from emoji data
const createEmojiSearchIndex = () => {
  const searchIndex = {};
  emojiData.forEach(emoji => {
    if (emoji.unified) {
      // Convert unified code to actual emoji
      const emojiChar = String.fromCodePoint(
        ...emoji.unified.split('-').map(u => parseInt(u, 16)),
      );

      // Index by short names, keywords, and category
      const searchTerms = [
        ...(emoji.short_names || []),
        ...(emoji.keywords || []),
        emoji.category,
      ];

      searchIndex[emojiChar] = {
        emoji: emojiChar,
        searchTerms: searchTerms.map(term => term.toLowerCase()),
        category: emoji.category,
        sortOrder: emoji.sort_order,
      };
    }
  });
  return searchIndex;
};

const EMOJI_SEARCH_INDEX = createEmojiSearchIndex();

// Simple emoji categories for now - we'll use the comprehensive search
const EMOJI_CATEGORIES = {
  Smileys: [
    '😀',
    '😃',
    '😄',
    '😁',
    '😅',
    '😂',
    '🤣',
    '😊',
    '😇',
    '🙂',
    '😉',
    '😌',
    '😍',
    '🥰',
    '😘',
    '😗',
    '😙',
    '😚',
    '😋',
    '😛',
    '😝',
    '😜',
    '🤪',
    '🤨',
    '🧐',
    '🤓',
    '😎',
    '🤩',
    '🥳',
    '😏',
    '😒',
    '😞',
    '😔',
    '😟',
    '😕',
    '🙁',
    '☹️',
    '😣',
    '😖',
    '😫',
    '😩',
    '🥺',
    '😢',
    '😭',
    '😤',
    '😠',
    '😡',
    '🤬',
    '🤯',
    '😳',
    '🥵',
    '🥶',
    '😱',
    '😨',
    '😰',
    '😥',
    '😓',
    '🤗',
    '🤔',
    '🤭',
    '🤫',
    '🤥',
    '😶',
    '😐',
    '😑',
    '😬',
    '🙄',
    '😯',
    '😦',
    '😧',
    '😮',
    '😲',
    '🥱',
    '😴',
    '🤤',
    '😪',
    '😵',
    '🤐',
    '🥴',
    '🤢',
    '🤮',
    '🤧',
    '😷',
    '🤒',
    '🤕',
  ],
  People: [
    '👶',
    '👧',
    '🧒',
    '👦',
    '👩',
    '🧑',
    '👨',
    '👩‍🦱',
    '🧑‍🦱',
    '👨‍🦱',
    '👩‍🦰',
    '🧑‍🦰',
    '👨‍🦰',
    '👱‍♀️',
    '👱',
    '👱‍♂️',
    '👩‍🦳',
    '🧑‍🦳',
    '👨‍🦳',
    '👩‍🦲',
    '🧑‍🦲',
    '👨‍🦲',
    '🧔‍♀️',
    '🧔',
    '🧔‍♂️',
    '👵',
    '🧓',
    '👴',
    '👲',
    '👳‍♀️',
    '👳',
    '👳‍♂️',
    '🧕',
    '👮‍♀️',
    '👮',
    '👮‍♂️',
    '👷‍♀️',
    '👷',
    '👷‍♂️',
    '💂‍♀️',
    '💂',
    '💂‍♂️',
    '🕵️‍♀️',
    '🕵️',
    '🕵️‍♂️',
    '👩‍⚕️',
    '🧑‍⚕️',
    '👨‍⚕️',
    '👩‍🌾',
    '🧑‍🌾',
    '👨‍🌾',
    '👩‍🍳',
    '🧑‍🍳',
    '👨‍🍳',
    '👩‍🎓',
    '🧑‍🎓',
    '👨‍🎓',
    '👩‍🎤',
    '🧑‍🎤',
    '👨‍🎤',
    '👩‍🏫',
    '🧑‍🏫',
    '👨‍🏫',
    '👩‍🏭',
    '🧑‍🏭',
    '👨‍🏭',
    '👩‍💻',
    '🧑‍💻',
    '👨‍💻',
    '👩‍💼',
    '🧑‍💼',
    '👨‍💼',
    '👩‍🔧',
    '🧑‍🔧',
    '👨‍🔧',
    '👩‍🔬',
    '🧑‍🔬',
    '👨‍🔬',
    '👩‍🎨',
    '🧑‍🎨',
    '👨‍🎨',
    '👩‍🚒',
    '🧑‍🚒',
    '👨‍🚒',
    '👩‍✈️',
    '🧑‍✈️',
    '👨‍✈️',
    '👩‍🚀',
    '🧑‍🚀',
    '👨‍🚀',
    '👩‍⚖️',
    '🧑‍⚖️',
    '👨‍⚖️',
    '👰‍♀️',
    '👰',
    '👰‍♂️',
    '🤵‍♀️',
    '🤵',
    '🤵‍♂️',
    '👸',
    '🤴',
    '🥷',
    '🦸‍♀️',
    '🦸',
    '🦸‍♂️',
    '🦹‍♀️',
    '🦹',
    '🦹‍♂️',
    '🤶',
    '🧑‍🎄',
    '🎅',
    '🧙‍♀️',
    '🧙',
    '🧙‍♂️',
    '🧝‍♀️',
    '🧝',
    '🧝‍♂️',
    '🧛‍♀️',
    '🧛',
    '🧛‍♂️',
    '🧟‍♀️',
    '🧟',
    '🧟‍♂️',
    '🧞‍♀️',
    '🧞',
    '🧞‍♂️',
    '🧜‍♀️',
    '🧜',
    '🧜‍♂️',
    '🧚‍♀️',
    '🧚',
    '🧚‍♂️',
    '👼',
    '🤰',
    '🤱',
    '👩‍🍼',
    '🧑‍🍼',
    '👨‍🍼',
    '🙇‍♀️',
    '🙇',
    '🙇‍♂️',
    '💁‍♀️',
    '💁',
    '💁‍♂️',
    '🙅‍♀️',
    '🙅',
    '🙅‍♂️',
    '🙆‍♀️',
    '🙆',
    '🙆‍♂️',
    '🙋‍♀️',
    '🙋',
    '🙋‍♂️',
    '🧏‍♀️',
    '🧏',
    '🧏‍♂️',
    '🤦‍♀️',
    '🤦',
    '🤦‍♂️',
    '🤷‍♀️',
    '🤷',
    '🤷‍♂️',
    '🙎‍♀️',
    '🙎',
    '🙎‍♂️',
    '🙍‍♀️',
    '🙍',
    '🙍‍♂️',
    '💇‍♀️',
    '💇',
    '💇‍♂️',
    '💆‍♀️',
    '💆',
    '💆‍♂️',
    '🧖‍♀️',
    '🧖',
    '🧖‍♂️',
    '💅',
    '🤳',
    '💃',
    '🕺',
    '👯‍♀️',
    '👯',
    '👯‍♂️',
    '🕴️',
    '👩‍🦽',
    '🧑‍🦽',
    '👨‍🦽',
    '👩‍🦼',
    '🧑‍🦼',
    '👨‍🦼',
    '🚶‍♀️',
    '🚶',
    '🚶‍♂️',
    '👩‍🦯',
    '🧑‍🦯',
    '👨‍🦯',
    '🧎‍♀️',
    '🧎',
    '🧎‍♂️',
    '🏃‍♀️',
    '🏃',
    '🏃‍♂️',
    '🧍‍♀️',
    '🧍',
    '🧍‍♂️',
    '👫',
    '👭',
    '👬',
    '👩‍❤️‍👨',
    '👩‍❤️‍👩',
    '💑',
    '👨‍❤️‍👨',
    '👩‍❤️‍💋‍👨',
    '👩‍❤️‍💋‍👩',
    '💏',
    '👨‍❤️‍💋‍👨',
    '👨‍👩‍👦',
    '👨‍👩‍👧',
    '👨‍👩‍👧‍👦',
    '👨‍👩‍👦‍👦',
    '👨‍👩‍👧‍👧',
    '👩‍👩‍👦',
    '👩‍👩‍👧',
    '👩‍👩‍👧‍👦',
    '👩‍👩‍👦‍👦',
    '👩‍👩‍👧‍👧',
    '👨‍👨‍👦',
    '👨‍👨‍👧',
    '👨‍👨‍👧‍👦',
    '👨‍👨‍👦‍👦',
    '👨‍👨‍👧‍👧',
    '👩‍👦',
    '👩‍👧',
    '👩‍👧‍👦',
    '👩‍👦‍👦',
    '👩‍👧‍👧',
    '👨‍👦',
    '👨‍👧',
    '👨‍👧‍👦',
    '👨‍👦‍👦',
    '👨‍👧‍👧',
    '🤲',
    '👐',
    '🙌',
    '👏',
    '🤝',
    '👍',
    '👎',
    '👊',
    '✊',
    '🤛',
    '🤜',
    '🤞',
    '✌️',
    '🤟',
    '🤘',
    '👌',
    '🤌',
    '🤏',
    '👈',
    '👉',
    '👆',
    '👇',
    '☝️',
    '✋',
    '🤚',
    '🖐️',
    '🖖',
    '👋',
    '🤙',
    '💪',
    '🦾',
    '🖕',
    '✍️',
    '🙏',
    '🦶',
    '🦵',
    '🦿',
    '💄',
    '💋',
    '👄',
    '🦷',
    '👅',
    '👂',
    '🦻',
    '👃',
    '👣',
    '👁️',
    '👀',
    '🫀',
    '🫁',
    '🧠',
    '🦴',
    '🦳',
    '🦱',
    '🦲',
    '🦰',
  ],
  Lifestyle: [
    '👕',
    '👔',
    '👗',
    '👘',
    '👙',
    '👚',
    '👛',
    '👜',
    '👝',
    '🎒',
    '👞',
    '👟',
    '🥾',
    '🥿',
    '👠',
    '👡',
    '👢',
    '👑',
    '👒',
    '🎩',
    '🎓',
    '🧢',
    '⛑️',
    '🪖',
    '💄',
    '💍',
    '💼',
    '🧳',
    '👓',
    '🕶️',
    '🥽',
    '🌂',
    '🧥',
    '🦺',
    '👖',
    '🧣',
    '🧤',
    '🧦',
    '🪥',
    '🧼',
    '🧽',
    '🧴',
    '🛁',
    '🚿',
    '🚽',
    '🧻',
    '🪒',
    '💊',
    '💉',
    '🩹',
    '🩺',
    '🌡️',
    '🧹',
    '🧺',
    '🧯',
    '🛏️',
    '🛋️',
    '🪑',
    '🚪',
    '🪟',
    '🧱',
    '🏠',
    '🏡',
    '🏘️',
    '🍳',
    '🥘',
    '🍲',
    '🥗',
    '🍱',
    '🍜',
    '🍝',
    '🍕',
    '🍔',
    '🥪',
    '🌮',
    '🌯',
    '🥙',
    '🍖',
    '🍗',
    '🥩',
    '🥓',
    '🧀',
    '🥚',
    '🥞',
    '🧇',
    '🥐',
    '🍞',
    '🥖',
    '🥨',
    '🍩',
    '🍪',
    '🎂',
    '🍰',
    '🧁',
    '🍫',
    '🍬',
    '🍭',
    '🍯',
    '🥛',
    '☕',
    '🍵',
    '🧃',
    '🥤',
    '🧊',
    '🍽️',
    '🍴',
    '🥄',
    '🔪',
    '🧭',
    '🧷',
    '🧵',
    '🪡',
    '🧶',
    '🪢',
    '🧲',
    '🔑',
    '🗝️',
    '🪜',
    '🧰',
    '🪛',
    '🔧',
    '🔨',
    '⚒️',
    '🪚',
    '🔩',
    '⚙️',
    '🪙',
    '💳',
    '💰',
    '💵',
    '💸',
    '🧾',
    '✉️',
    '📧',
    '📨',
    '📬',
    '📮',
    '🗳️',
    '✏️',
    '✒️',
    '🖊️',
    '🖌️',
    '📝',
    '📄',
    '📃',
    '📑',
    '📊',
    '📈',
    '📉',
    '📆',
    '📅',
    '🗓️',
    '📇',
    '🗂️',
    '📁',
    '🗄️',
    '🗑️',
    '📱',
    '☎️',
    '📞',
    '📟',
    '📠',
    '💻',
    '🖥️',
    '⌨️',
    '🖱️',
    '🖨️',
    '🗜️',
    '💽',
    '💾',
    '💿',
    '📀',
    '🎥',
    '📹',
    '📷',
    '📸',
    '🔦',
    '💡',
    '🕯️',
    '🪔',
    '🔌',
    '🔋',
    '🪫',
    '🚰',
    '🚬',
    '⚰️',
    '🪦',
    '⚱️',
    '🗿',
    '🪧',
    '🏧',
    '🚮',
    '🚻',
    '🚹',
    '🚺',
    '🚼',
    '🚾',
    '🛂',
    '🛃',
    '🛄',
    '🛅',
  ],
  Food: [
    '🍏',
    '🍎',
    '🍐',
    '🍊',
    '🍋',
    '🍌',
    '🍉',
    '🍇',
    '🍓',
    '🍈',
    '🍒',
    '🍑',
    '🥭',
    '🍍',
    '🥥',
    '🥝',
    '🍅',
    '🍆',
    '🥑',
    '🥦',
    '🥬',
    '🥒',
    '🌶️',
    '🌽',
    '🥕',
    '🥔',
    '🍠',
    '🥐',
    '🥖',
    '🍞',
    '🥨',
    '🧀',
    '🥚',
    '🍳',
    '🥞',
    '🥓',
    '🥩',
    '🍗',
    '🍖',
    '🌭',
    '🍔',
    '🍟',
    '🍕',
    '🥪',
    '🥙',
    '🌮',
    '🌯',
    '🥗',
    '🥘',
    '🥫',
    '🍝',
    '🍜',
    '🍲',
    '🍛',
    '🍣',
    '🍱',
    '🍤',
    '🍙',
    '🍚',
    '🍘',
    '🍥',
    '🥮',
    '🍢',
    '🍡',
    '🍧',
    '🍨',
    '🍦',
    '🥧',
    '🧁',
    '🍰',
    '🎂',
    '🍮',
    '🍭',
    '🍬',
    '🍫',
    '🍿',
    '🍩',
    '🍪',
    '🌰',
    '🥜',
    '🍯',
    '🥛',
    '🍼',
    '☕',
    '🍵',
    '🥤',
    '🍶',
    '🍺',
    '🍻',
    '🥂',
    '🍷',
    '🥃',
    '🍸',
    '🍹',
    '🍾',
  ],
  Animals: [
    '🐶',
    '🐱',
    '🐭',
    '🐹',
    '🐰',
    '🦊',
    '🐻',
    '🐼',
    '🐨',
    '🐯',
    '🦁',
    '🐮',
    '🐷',
    '🐽',
    '🐸',
    '🐵',
    '🙈',
    '🙉',
    '🙊',
    '🐒',
    '🐔',
    '🐧',
    '🐦',
    '🐤',
    '🐣',
    '🐥',
    '🦆',
    '🦅',
    '🦉',
    '🦇',
    '🐺',
    '🐗',
    '🐴',
    '🦄',
    '🐝',
    '🐛',
    '🦋',
    '🐌',
    '🐞',
    '🐜',
    '🦟',
    '🦗',
    '🕷️',
    '🕸️',
    '🦂',
    '🐢',
    '🐍',
    '🦎',
    '🦖',
    '🦕',
    '🐙',
    '🦑',
    '🦐',
    '🦀',
    '🐡',
    '🐠',
    '🐟',
    '🐬',
    '🐳',
    '🐋',
    '🦈',
    '🐊',
    '🐅',
    '🐆',
    '🦓',
    '🦍',
    '🦧',
    '🐘',
    '🦛',
    '🦏',
    '🐪',
    '🐫',
    '🦒',
    '🦘',
    '🐃',
    '🐂',
    '🐄',
    '🐎',
    '🐖',
    '🐏',
    '🐑',
    '🦙',
    '🐐',
    '🦌',
    '🐕',
    '🐩',
    '🦮',
    '🐕‍🦺',
    '🐈',
    '🐈‍⬛',
    '🐓',
    '🦃',
    '🦚',
    '🦜',
    '🦢',
    '🦩',
    '🕊️',
    '🐇',
    '🦝',
    '🦨',
    '🦡',
    '🦦',
    '🦥',
    '🐁',
    '🐀',
    '🐿️',
    '🦔',
  ],
  Travel: [
    '🚗',
    '🚕',
    '🚙',
    '🚌',
    '🚎',
    '🏎️',
    '🚓',
    '🚑',
    '🚒',
    '🚐',
    '🛻',
    '🚚',
    '🚛',
    '🚜',
    '🏍️',
    '🛵',
    '🚲',
    '🛴',
    '🚁',
    '🛸',
    '🚀',
    '✈️',
    '🛫',
    '🛬',
    '🪂',
    '💺',
    '🚤',
    '⛵',
    '🛶',
    '🚢',
    '🛳️',
    '⚓',
    '🚇',
    '🚊',
    '🚝',
    '🚄',
    '🚅',
    '🚈',
    '🚂',
    '🚆',
    '🚋',
    '🚃',
    '🚟',
    '🚠',
    '🚡',
    '🚖',
    '🚘',
    '🚍',
    '🚔',
    '🚨',
    '🚥',
    '🚦',
    '🛑',
    '🚧',
    '🏗️',
    '🏭',
    '🏠',
    '🏡',
    '🏘️',
    '🏚️',
    '🏢',
    '🏬',
    '🏣',
    '🏤',
    '🏥',
    '🏦',
    '🏨',
    '🏪',
    '🏫',
    '🏩',
    '💒',
    '🏛️',
    '⛪',
    '🕌',
    '🕍',
    '🛕',
    '🕋',
    '⛩️',
    '🗾',
    '🎑',
    '🏞️',
    '🌅',
    '🌄',
    '🌠',
    '🎇',
    '🎆',
    '🌇',
    '🌆',
    '🏙️',
    '🌃',
    '🌌',
    '🌉',
    '🌁',
  ],
  Objects: [
    '⌚',
    '📱',
    '📲',
    '💻',
    '⌨️',
    '🖥️',
    '🖨️',
    '🖱️',
    '🖲️',
    '🕹️',
    '🗜️',
    '💽',
    '💾',
    '💿',
    '📀',
    '📼',
    '📷',
    '📸',
    '📹',
    '🎥',
    '📽️',
    '🎞️',
    '📞',
    '☎️',
    '📟',
    '📠',
    '📺',
    '📻',
    '🎙️',
    '🎚️',
    '🎛️',
    '🧭',
    '⏱️',
    '⏲️',
    '⏰',
    '🕰️',
    '⌛',
    '⏳',
    '📡',
    '🔋',
    '🔌',
    '💡',
    '🔦',
    '🕯️',
    '🧯',
    '🛢️',
    '💸',
    '💵',
    '💴',
    '💶',
    '💷',
    '💰',
    '💳',
    '💎',
    '⚖️',
    '🧰',
    '🔧',
    '🔨',
    '⚒️',
    '🛠️',
    '⛏️',
    '🔩',
    '⚙️',
    '🧱',
    '⛓️',
    '🧲',
    '🔫',
    '💣',
    '🧨',
    '🔪',
    '🗡️',
    '⚔️',
    '🛡️',
    '🚬',
    '⚰️',
    '⚱️',
    '🏺',
    '🔮',
    '📿',
    '🧿',
    '💈',
    '⚗️',
    '🔭',
    '🔬',
    '🕳️',
    '💊',
    '💉',
    '🧬',
    '🦠',
    '🧫',
    '🧪',
    '🌡️',
    '🧹',
    '🧺',
    '🧻',
    '🚽',
    '🚰',
    '🚿',
    '🛁',
    '🛀',
    '🧼',
    '🧽',
    '🧴',
    '🛎️',
    '🔑',
    '🗝️',
    '🚪',
    '🛋️',
    '🛏️',
    '🛌',
    '🧸',
    '🖼️',
    '🛍️',
    '🛒',
    '🎁',
    '🎈',
    '🎏',
    '🎀',
    '🎊',
    '🎉',
    '🎎',
    '🏮',
    '🎐',
    '🧧',
    '✉️',
    '📩',
    '📨',
    '📧',
    '💌',
    '📥',
    '📤',
    '📦',
    '🏷️',
    '📪',
    '📫',
    '📬',
    '📭',
    '📮',
    '📯',
    '📜',
    '📃',
    '📄',
    '📑',
    '🧾',
    '📊',
    '📈',
    '📉',
    '🗒️',
    '🗓️',
    '📆',
    '📅',
    '🗑️',
    '📇',
    '🗃️',
    '🗳️',
    '🗄️',
    '📋',
    '📁',
    '📂',
    '🗂️',
    '🗞️',
    '📰',
    '📓',
    '📔',
    '📒',
    '📕',
    '📗',
    '📘',
    '📙',
    '📚',
    '📖',
    '🔖',
    '🧷',
    '🔗',
    '📎',
    '🖇️',
    '📐',
    '📏',
    '🧮',
    '📌',
    '📍',
    '✂️',
    '🖊️',
    '🖋️',
    '✒️',
    '🖌️',
    '🖍️',
    '📝',
    '✏️',
    '🔍',
    '🔎',
    '🔏',
    '🔐',
    '🔒',
    '🔓',
  ],
};

// Skin tone modifiers
const SKIN_TONE_MODIFIERS = {
  none: null,
  light: '🏻',
  mediumLight: '🏼',
  medium: '🏽',
  mediumDark: '🏾',
  dark: '🏿',
};

// List of emojis that support skin tone modifiers
// This includes base people emojis and hand gestures only
const SKIN_TONE_SUPPORTED = [
  // Hand gestures
  '👋',
  '🤚',
  '🖐',
  '✋',
  '🖖',
  '👌',
  '🤌',
  '🤏',
  '✌️',
  '🤞',
  '🤟',
  '🤘',
  '🤙',
  '👈',
  '👉',
  '👆',
  '🖕',
  '👇',
  '☝️',
  '👍',
  '👎',
  '✊',
  '👊',
  '🤛',
  '🤜',
  '👏',
  '🙌',
  '👐',
  '🤲',
  '🙏',
  '✍️',
  '💅',
  '🤳',
  '💪',
  // Body parts
  '🦵',
  '🦶',
  '👂',
  '🦻',
  '👃',
  // Base people (no gender/role modifiers)
  '👶',
  '🧒',
  '👦',
  '👧',
  '🧑',
  '👨',
  '👩',
  '🧓',
  '👴',
  '👵',
  // Simple professions and roles
  '👮',
  '👷',
  '💂',
  '🕵️',
  '👳',
  '👲',
  '🧕',
  '🤴',
  '👸',
  '🎅',
  '🤶',
  '🦸',
  '🦹',
  '🧙',
  '🧚',
  '🧛',
  '🧜',
  '🧝',
  '🧞',
  '🧟',
  '👼',
  '🤰',
  '🤱',
  // Activities
  '🙇',
  '💁',
  '🙅',
  '🙆',
  '🙋',
  '🧏',
  '🤦',
  '🤷',
  '🙎',
  '🙍',
  '💇',
  '💆',
  '🧖',
  '💃',
  '🕺',
  '🕴',
  '🚶',
  '🧍',
  '🧎',
  '🏃',
  '🤸',
  '🏋️',
  '🤾',
  '🏌️',
  '🏇',
  '🧘',
  '🏄',
  '🏊',
  '🤽',
  '🚣',
  '🧗',
  '🚵',
  '🚴',
  '🤹',
];

// Helper function to check if emoji supports skin tone
const supportsSkinTone = icon => {
  return SKIN_TONE_SUPPORTED.includes(icon);
};

// Helper function to apply skin tone to emoji
const applySkinTone = (icon, skinTone) => {
  if (!skinTone || !supportsSkinTone(icon)) {
    return icon;
  }

  // Simply concatenate the skin tone modifier
  // React Native should handle the rendering
  return icon + skinTone;
};

// Helper function to detect if a string contains emoji
const containsEmoji = text => {
  // Unicode ranges for emoji detection
  const emojiRegex =
    /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]|[\u{2300}-\u{23FF}]|[\u{2460}-\u{24FF}]|[\u{2B50}]/gu;
  return emojiRegex.test(text);
};

// Helper function to extract emojis from text
const extractEmojis = text => {
  // More comprehensive emoji regex that works on both iOS and Android
  // Includes emoji sequences, modifiers, and zero-width joiners
  const emojiRegex =
    /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Component})+/gu;
  const matches = text.match(emojiRegex);
  if (!matches) return '';

  // Filter out non-visible characters and join the results
  const emojis = matches
    .filter(match => {
      // Remove any standalone variation selectors or zero-width joiners
      return match && match.trim() && !/^[\uFE0F\u200D]+$/.test(match);
    })
    .join('');

  return emojis;
};

// Custom images list (matching PWA)
const CUSTOM_IMAGES = [
  { name: 'Chicken Nuggets', src: 'ChickenNuggets.png' },
  { name: 'Fish Sticks', src: 'FishSticks.png' },
  { name: 'Fusion', src: 'Fusion.png' },
  { name: 'Golden Retriever', src: 'GoldenRetriever.png' },
  { name: 'Goldfish Crackers', src: 'GoldfishCrackers.png' },
  { name: 'Kart', src: 'kart.png' },
  { name: 'Lambo', src: 'lambo.png' },
  { name: 'RAV4', src: 'RAV4.png' },
  { name: 'Swingset', src: 'Swingset.png' },
  { name: 'Breakfast Dog', src: 'breakfast_dog.png' },
];

const EmojiPicker = ({
  visible = false,
  onClose,
  onSelect,
  mode = 'modal', // 'modal' or 'inline'
  theme,
  selectedEmoji,
  showCustomImages = true,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('Lifestyle');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const [categoryKeys, setCategoryKeys] = useState(
    Object.keys(EMOJI_CATEGORIES),
  );
  const [selectedSkinTone, setSelectedSkinTone] = useState(null);
  const [showSkinToneSelector, setShowSkinToneSelector] = useState(false);
  const [detectedEmoji, setDetectedEmoji] = useState('');

  // Calculate columns based on screen size and platform
  // For Android phones use 6 columns, for web use 8-10 based on screen size
  const numColumns =
    Platform.OS === 'web'
      ? isTablet()
        ? 10
        : 8
      : isTablet()
      ? 10
      : Platform.OS === 'android'
      ? 6
      : 5;

  // Initialize categories with custom images
  useEffect(() => {
    if (showCustomImages) {
      // Add Custom category dynamically
      if (!EMOJI_CATEGORIES.Custom) {
        EMOJI_CATEGORIES.Custom = CUSTOM_IMAGES;
      }
      setCategoryKeys(Object.keys(EMOJI_CATEGORIES));
      // Prefer Lifestyle category if available, otherwise Custom
      setSelectedCategory('Lifestyle');
    } else {
      // Remove Custom category if it exists
      if (EMOJI_CATEGORIES.Custom) {
        delete EMOJI_CATEGORIES.Custom;
      }
      setCategoryKeys(Object.keys(EMOJI_CATEGORIES));
      setSelectedCategory('Lifestyle');
    }
  }, [showCustomImages]);

  // Filter items based on search
  useEffect(() => {
    if (searchQuery) {
      // Check if the search query contains emoji(s)
      const extractedEmojis = extractEmojis(searchQuery);
      if (extractedEmojis) {
        setDetectedEmoji(extractedEmojis);
      } else {
        setDetectedEmoji('');
      }

      const query = searchQuery.toLowerCase();
      const filtered = [];

      // Search all categories when there's a search query
      Object.entries(EMOJI_CATEGORIES).forEach(([category, items]) => {
        items.forEach(item => {
          if (typeof item === 'string') {
            // For emojis, check if search terms match
            const emojiInfo = EMOJI_SEARCH_INDEX[item];
            if (emojiInfo) {
              const matches = emojiInfo.searchTerms.some(term =>
                term.includes(query),
              );
              if (matches || item.includes(searchQuery)) {
                filtered.push({ type: 'emoji', icon: item, category });
              }
            }
          } else {
            // For custom images
            if (item.name.toLowerCase().includes(query)) {
              filtered.push({ type: 'image', ...item, category });
            }
          }
        });
      });

      setFilteredItems(filtered);
    } else {
      // No search, show selected category
      setDetectedEmoji('');
      const items = EMOJI_CATEGORIES[selectedCategory] || [];
      setFilteredItems(
        items.map(item =>
          typeof item === 'string'
            ? { type: 'emoji', icon: item, category: selectedCategory }
            : { type: 'image', ...item, category: selectedCategory },
        ),
      );
    }
  }, [searchQuery, selectedCategory]);

  const handleSelect = item => {
    if (item.type === 'emoji') {
      onSelect(item.icon);
    } else {
      // For custom images, we'll use a special format
      onSelect(`image:${item.src}`);
    }
    if (mode === 'modal') {
      onClose();
    }
    setSearchQuery('');
  };

  const renderItem = ({ item }) => {
    if (item.type === 'placeholder') {
      return <View style={styles.emojiItem} />;
    }

    // Apply skin tone if applicable
    let displayEmoji = item.icon;
    if (
      item.type === 'emoji' &&
      selectedCategory === 'People' &&
      selectedSkinTone &&
      supportsSkinTone(item.icon)
    ) {
      displayEmoji = applySkinTone(item.icon, selectedSkinTone);
    }

    const isSelected =
      item.type === 'emoji'
        ? selectedEmoji === displayEmoji
        : selectedEmoji === `image:${item.src}`;

    return (
      <TouchableOpacity
        style={[styles.emojiItem, isSelected && styles.selectedItem]}
        onPress={() =>
          handleSelect(
            item.type === 'emoji' ? { ...item, icon: displayEmoji } : item,
          )
        }
      >
        {item.type === 'emoji' ? (
          <Text style={styles.emoji}>{displayEmoji}</Text>
        ) : (
          <Image
            source={getCustomImageSource(item.src)}
            style={styles.customImage}
            resizeMode="contain"
          />
        )}
      </TouchableOpacity>
    );
  };

  const content = (
    <View
      style={[styles.container, mode === 'inline' && styles.inlineContainer]}
    >
      {/* Header */}
      {mode === 'modal' && (
        <View style={styles.header}>
          <Text style={styles.title}>Choose an emoji</Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search, type, or paste emoji..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="done"
          keyboardType="default"
          autoFocus={false}
          enablesReturnKeyAutomatically={true}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close" size={20} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Category Tabs */}
      {!searchQuery && (
        <View style={styles.categoryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categoryKeys.map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryTab,
                  selectedCategory === category && styles.selectedCategoryTab,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category &&
                      styles.selectedCategoryText,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Skin Tone Selector */}
      {selectedCategory === 'People' && !searchQuery && (
        <View style={styles.skinToneContainer}>
          <View style={styles.skinToneOptions}>
            <TouchableOpacity
              style={[
                styles.skinToneOption,
                !selectedSkinTone && styles.selectedSkinTone,
              ]}
              onPress={() => setSelectedSkinTone(null)}
            >
              <Text style={styles.skinToneEmoji}>👋</Text>
            </TouchableOpacity>
            {Object.entries(SKIN_TONE_MODIFIERS)
              .filter(([key]) => key !== 'none')
              .map(([key, modifier]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.skinToneOption,
                    selectedSkinTone === modifier && styles.selectedSkinTone,
                  ]}
                  onPress={() => setSelectedSkinTone(modifier)}
                >
                  <Text style={styles.skinToneEmoji}>
                    {applySkinTone('👋', modifier)}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
        </View>
      )}

      {/* Detected Emoji Result */}
      {detectedEmoji && searchQuery && (
        <View style={styles.detectedEmojiContainer}>
          <Text style={styles.detectedEmojiLabel}>Tap to use your emoji:</Text>
          <TouchableOpacity
            style={[
              styles.detectedEmojiButton,
              { backgroundColor: theme?.light || '#E8F0FE' },
            ]}
            onPress={() => handleSelect({ type: 'emoji', icon: detectedEmoji })}
            activeOpacity={0.7}
          >
            <Text style={styles.detectedEmoji}>{detectedEmoji}</Text>
            <Icon
              name="check-circle"
              size={24}
              color={theme?.primary || '#667eea'}
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>
          <Text style={styles.detectedEmojiHint}>
            You can type or paste any emoji!
          </Text>
        </View>
      )}

      {/* Emoji Grid */}
      {
        <View style={{ flex: 1, overflow: 'hidden' }}>
          <FlatList
            data={(() => {
              // Add empty items to fill the last row
              const items = [...filteredItems];
              const remainder = items.length % numColumns;
              if (remainder !== 0) {
                for (let i = 0; i < numColumns - remainder; i++) {
                  items.push({ type: 'placeholder', id: `placeholder-${i}` });
                }
              }
              return items;
            })()}
            renderItem={renderItem}
            keyExtractor={(item, index) =>
              item.type === 'emoji'
                ? item.icon
                : item.type === 'placeholder'
                ? item.id
                : item.src
            }
            numColumns={numColumns}
            contentContainerStyle={styles.emojiGrid}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={Platform.OS === 'android'}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            windowSize={
              Platform.OS === 'web' ? 21 : Platform.OS === 'android' ? 10 : 21
            }
            maxToRenderPerBatch={
              Platform.OS === 'web' ? 50 : Platform.OS === 'android' ? 10 : 15
            }
            initialNumToRender={Platform.OS === 'web' ? 50 : 20}
          />
        </View>
      }
    </View>
  );

  if (mode === 'inline') {
    return content;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalContent}
          onPress={e => e.stopPropagation()}
        >
          {content}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    flex: 1,
  },
  inlineContainer: {
    borderRadius: RADIUS.lg,
    backgroundColor: '#f5f5f5',
    height: Platform.OS === 'web' ? 400 : 300,
    maxHeight: Platform.OS === 'web' ? 400 : 300,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    height:
      Platform.OS === 'web' ? '70%' : Platform.OS === 'android' ? '75%' : '80%',
    maxHeight:
      Platform.OS === 'web' ? 600 : Platform.OS === 'android' ? '75%' : '80%',
    maxWidth: isTablet() ? 700 : '100%',
    alignSelf: 'center',
    width: '100%',
    ...SHADOWS.level3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingHorizontal: isTablet() ? SPACING.xl : SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  title: {
    fontSize: isTablet() ? TYPOGRAPHY.sizes.xl : TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.gray[900],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    margin: SPACING.md,
    marginHorizontal: isTablet() ? SPACING.xl : SPACING.md,
    height: isTablet() ? 48 : 40,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.sm,
    fontSize: isTablet() ? TYPOGRAPHY.sizes.lg : TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.gray[900],
    ...(Platform.OS === 'android' && {
      textAlignVertical: 'center',
    }),
  },
  categoryContainer: {
    paddingHorizontal: isTablet() ? SPACING.xl : SPACING.md,
    marginBottom: SPACING.sm,
    height: isTablet() ? 44 : 36,
  },
  categoryTab: {
    paddingHorizontal: isTablet() ? SPACING.lg : SPACING.md,
    paddingVertical: SPACING.xs,
    marginRight: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.gray[100],
    height: isTablet() ? 40 : 32,
    justifyContent: 'center',
  },
  selectedCategoryTab: {
    backgroundColor: '#667eea',
  },
  categoryText: {
    fontSize: isTablet() ? TYPOGRAPHY.sizes.md : TYPOGRAPHY.sizes.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.gray[700],
  },
  selectedCategoryText: {
    color: 'white',
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  emojiGrid: {
    paddingVertical: SPACING.md,
    paddingHorizontal: Platform.OS === 'android' ? SPACING.sm : SPACING.md,
    paddingBottom: Platform.OS === 'android' ? 80 : SPACING.md, // Extra bottom padding for Android
  },
  emojiItem: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin:
      Platform.OS === 'web'
        ? 4
        : Platform.OS === 'android'
        ? 2
        : isTablet()
        ? SPACING.xs
        : 3,
    borderRadius: RADIUS.md,
    minHeight:
      Platform.OS === 'web'
        ? 56
        : isTablet()
        ? 64
        : Platform.OS === 'android'
        ? 52
        : 60,
  },
  selectedItem: {
    backgroundColor: COLORS.gray[200],
  },
  emoji: {
    fontSize:
      Platform.OS === 'web'
        ? 28
        : isTablet()
        ? 42
        : Platform.OS === 'android'
        ? 28
        : 32,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    textAlign: 'center',
  },
  customImage: {
    width: isTablet() ? 48 : 36,
    height: isTablet() ? 48 : 36,
  },
  skinToneContainer: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: isTablet() ? SPACING.xl : SPACING.md,
  },
  skinToneOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  skinToneOption: {
    width: isTablet() ? 44 : 36,
    height: isTablet() ? 44 : 36,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray[100],
  },
  selectedSkinTone: {
    backgroundColor: '#667eea',
  },
  skinToneEmoji: {
    fontSize: isTablet() ? 26 : 22,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  detectedEmojiContainer: {
    paddingHorizontal: isTablet() ? SPACING.xl : SPACING.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  detectedEmojiLabel: {
    fontSize: isTablet() ? TYPOGRAPHY.sizes.sm : TYPOGRAPHY.sizes.xs,
    color: COLORS.gray[600],
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  detectedEmojiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: '#667eea',
    ...SHADOWS.level2,
  },
  detectedEmoji: {
    fontSize: isTablet() ? 48 : 40,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  detectedEmojiHint: {
    fontSize: isTablet() ? TYPOGRAPHY.sizes.xs : 11,
    color: COLORS.gray[500],
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    marginTop: SPACING.xs,
  },
});

export default EmojiPicker;
