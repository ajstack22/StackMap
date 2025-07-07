import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  StyleSheet,
  Image,
  FlatList,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SHADOWS, TYPOGRAPHY, SPACING, RADIUS, COLORS, isTablet, CUSTOM_IMAGE_SOURCES } from '../../constants';
import emojiData from 'emoji-datasource-apple/emoji.json';

const { width: screenWidth } = Dimensions.get('window');

// Create emoji search index from emoji data
const createEmojiSearchIndex = () => {
  const searchIndex = {};
  emojiData.forEach(emoji => {
    if (emoji.unified) {
      // Convert unified code to actual emoji
      const emojiChar = String.fromCodePoint(...emoji.unified.split('-').map(u => parseInt(u, 16)));
      
      // Index by short names, keywords, and category
      const searchTerms = [
        ...(emoji.short_names || []),
        ...(emoji.keywords || []),
        emoji.category
      ];
      
      searchIndex[emojiChar] = {
        emoji: emojiChar,
        searchTerms: searchTerms.map(term => term.toLowerCase()),
        category: emoji.category,
        sortOrder: emoji.sort_order
      };
    }
  });
  return searchIndex;
};

const EMOJI_SEARCH_INDEX = createEmojiSearchIndex();

// Simple emoji categories for now - we'll use the comprehensive search
const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕'],
  'People': ['👶', '👧', '🧒', '👦', '👩', '🧑', '👨', '👩‍🦱', '🧑‍🦱', '👨‍🦱', '👩‍🦰', '🧑‍🦰', '👨‍🦰', '👱‍♀️', '👱', '👱‍♂️', '👩‍🦳', '🧑‍🦳', '👨‍🦳', '👩‍🦲', '🧑‍🦲', '👨‍🦲', '🧔‍♀️', '🧔', '🧔‍♂️', '👵', '🧓', '👴', '👲', '👳‍♀️', '👳', '👳‍♂️', '🧕', '👮‍♀️', '👮', '👮‍♂️', '👷‍♀️', '👷', '👷‍♂️', '💂‍♀️', '💂', '💂‍♂️', '🕵️‍♀️', '🕵️', '🕵️‍♂️', '👩‍⚕️', '🧑‍⚕️', '👨‍⚕️', '👩‍🌾', '🧑‍🌾', '👨‍🌾', '👩‍🍳', '🧑‍🍳', '👨‍🍳', '👩‍🎓', '🧑‍🎓', '👨‍🎓', '👩‍🎤', '🧑‍🎤', '👨‍🎤', '👩‍🏫', '🧑‍🏫', '👨‍🏫', '👩‍🏭', '🧑‍🏭', '👨‍🏭', '👩‍💻', '🧑‍💻', '👨‍💻', '👩‍💼', '🧑‍💼', '👨‍💼', '👩‍🔧', '🧑‍🔧', '👨‍🔧', '👩‍🔬', '🧑‍🔬', '👨‍🔬', '👩‍🎨', '🧑‍🎨', '👨‍🎨', '👩‍🚒', '🧑‍🚒', '👨‍🚒', '👩‍✈️', '🧑‍✈️', '👨‍✈️', '👩‍🚀', '🧑‍🚀', '👨‍🚀', '👩‍⚖️', '🧑‍⚖️', '👨‍⚖️', '👰‍♀️', '👰', '👰‍♂️', '🤵‍♀️', '🤵', '🤵‍♂️', '👸', '🤴', '🥷', '🦸‍♀️', '🦸', '🦸‍♂️', '🦹‍♀️', '🦹', '🦹‍♂️', '🤶', '🧑‍🎄', '🎅', '🧙‍♀️', '🧙', '🧙‍♂️', '🧝‍♀️', '🧝', '🧝‍♂️', '🧛‍♀️', '🧛', '🧛‍♂️', '🧟‍♀️', '🧟', '🧟‍♂️', '🧞‍♀️', '🧞', '🧞‍♂️', '🧜‍♀️', '🧜', '🧜‍♂️', '🧚‍♀️', '🧚', '🧚‍♂️', '👼', '🤰', '🤱', '👩‍🍼', '🧑‍🍼', '👨‍🍼', '🙇‍♀️', '🙇', '🙇‍♂️', '💁‍♀️', '💁', '💁‍♂️', '🙅‍♀️', '🙅', '🙅‍♂️', '🙆‍♀️', '🙆', '🙆‍♂️', '🙋‍♀️', '🙋', '🙋‍♂️', '🧏‍♀️', '🧏', '🧏‍♂️', '🤦‍♀️', '🤦', '🤦‍♂️', '🤷‍♀️', '🤷', '🤷‍♂️', '🙎‍♀️', '🙎', '🙎‍♂️', '🙍‍♀️', '🙍', '🙍‍♂️', '💇‍♀️', '💇', '💇‍♂️', '💆‍♀️', '💆', '💆‍♂️', '🧖‍♀️', '🧖', '🧖‍♂️', '💅', '🤳', '💃', '🕺', '👯‍♀️', '👯', '👯‍♂️', '🕴️', '👩‍🦽', '🧑‍🦽', '👨‍🦽', '👩‍🦼', '🧑‍🦼', '👨‍🦼', '🚶‍♀️', '🚶', '🚶‍♂️', '👩‍🦯', '🧑‍🦯', '👨‍🦯', '🧎‍♀️', '🧎', '🧎‍♂️', '🏃‍♀️', '🏃', '🏃‍♂️', '🧍‍♀️', '🧍', '🧍‍♂️', '👫', '👭', '👬', '👩‍❤️‍👨', '👩‍❤️‍👩', '💑', '👨‍❤️‍👨', '👩‍❤️‍💋‍👨', '👩‍❤️‍💋‍👩', '💏', '👨‍❤️‍💋‍👨', '👨‍👩‍👦', '👨‍👩‍👧', '👨‍👩‍👧‍👦', '👨‍👩‍👦‍👦', '👨‍👩‍👧‍👧', '👩‍👩‍👦', '👩‍👩‍👧', '👩‍👩‍👧‍👦', '👩‍👩‍👦‍👦', '👩‍👩‍👧‍👧', '👨‍👨‍👦', '👨‍👨‍👧', '👨‍👨‍👧‍👦', '👨‍👨‍👦‍👦', '👨‍👨‍👧‍👧', '👩‍👦', '👩‍👧', '👩‍👧‍👦', '👩‍👦‍👦', '👩‍👧‍👧', '👨‍👦', '👨‍👧', '👨‍👧‍👦', '👨‍👦‍👦', '👨‍👧‍👧', '🤲', '👐', '🙌', '👏', '🤝', '👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘', '👌', '🤌', '🤏', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤙', '💪', '🦾', '🖕', '✍️', '🙏', '🦶', '🦵', '🦿', '💄', '💋', '👄', '🦷', '👅', '👂', '🦻', '👃', '👣', '👁️', '👀', '🫀', '🫁', '🧠', '🦴', '🦳', '🦱', '🦲', '🦰'],
  'Lifestyle': ['👕', '👔', '👗', '👘', '👙', '👚', '👛', '👜', '👝', '🎒', '👞', '👟', '🥾', '🥿', '👠', '👡', '👢', '👑', '👒', '🎩', '🎓', '🧢', '⛑️', '🪖', '💄', '💍', '💼', '🧳', '👓', '🕶️', '🥽', '🌂', '🧥', '🦺', '👖', '🧣', '🧤', '🧦', '🪥', '🧼', '🧽', '🧴', '🛁', '🚿', '🚽', '🧻', '🪒', '💊', '💉', '🩹', '🩺', '🌡️', '🧹', '🧺', '🧯', '🛏️', '🛋️', '🪑', '🚪', '🪟', '🧱', '🏠', '🏡', '🏘️', '🍳', '🥘', '🍲', '🥗', '🍱', '🍜', '🍝', '🍕', '🍔', '🥪', '🌮', '🌯', '🥙', '🍖', '🍗', '🥩', '🥓', '🧀', '🥚', '🥞', '🧇', '🥐', '🍞', '🥖', '🥨', '🍩', '🍪', '🎂', '🍰', '🧁', '🍫', '🍬', '🍭', '🍯', '🥛', '☕', '🍵', '🧃', '🥤', '🧊', '🍽️', '🍴', '🥄', '🔪', '🧭', '🧷', '🧵', '🪡', '🧶', '🪢', '🧲', '🔑', '🗝️', '🪜', '🧰', '🪛', '🔧', '🔨', '⚒️', '🪚', '🔩', '⚙️', '🪙', '💳', '💰', '💵', '💸', '🧾', '✉️', '📧', '📨', '📬', '📮', '🗳️', '✏️', '✒️', '🖊️', '🖌️', '📝', '📄', '📃', '📑', '📊', '📈', '📉', '📆', '📅', '🗓️', '📇', '🗂️', '📁', '🗄️', '🗑️', '📱', '☎️', '📞', '📟', '📠', '💻', '🖥️', '⌨️', '🖱️', '🖨️', '🗜️', '💽', '💾', '💿', '📀', '🎥', '📹', '📷', '📸', '🔦', '💡', '🕯️', '🪔', '🔌', '🔋', '🪫', '🚰', '🚬', '⚰️', '🪦', '⚱️', '🗿', '🪧', '🏧', '🚮', '🚻', '🚹', '🚺', '🚼', '🚾', '🛂', '🛃', '🛄', '🛅'],
  'Food': ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🥔', '🍠', '🥐', '🥖', '🍞', '🥨', '🧀', '🥚', '🍳', '🥞', '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🌮', '🌯', '🥗', '🥘', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🍤', '🍙', '🍚', '🍘', '🍥', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '☕', '🍵', '🥤', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🍾'],
  'Animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔'],
  'Travel': ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🚁', '🛸', '🚀', '✈️', '🛫', '🛬', '🪂', '💺', '🚤', '⛵', '🛶', '🚢', '🛳️', '⚓', '🚇', '🚊', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚋', '🚃', '🚟', '🚠', '🚡', '🚖', '🚘', '🚍', '🚔', '🚨', '🚥', '🚦', '🛑', '🚧', '🏗️', '🏭', '🏠', '🏡', '🏘️', '🏚️', '🏢', '🏬', '🏣', '🏤', '🏥', '🏦', '🏨', '🏪', '🏫', '🏩', '💒', '🏛️', '⛪', '🕌', '🕍', '🛕', '🕋', '⛩️', '🗾', '🎑', '🏞️', '🌅', '🌄', '🌠', '🎇', '🎆', '🌇', '🌆', '🏙️', '🌃', '🌌', '🌉', '🌁'],
  'Objects': ['⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '💰', '💳', '💎', '⚖️', '🧰', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '💊', '💉', '🧬', '🦠', '🧫', '🧪', '🌡️', '🧹', '🧺', '🧻', '🚽', '🚰', '🚿', '🛁', '🛀', '🧼', '🧽', '🧴', '🛎️', '🔑', '🗝️', '🚪', '🛋️', '🛏️', '🛌', '🧸', '🖼️', '🛍️', '🛒', '🎁', '🎈', '🎏', '🎀', '🎊', '🎉', '🎎', '🏮', '🎐', '🧧', '✉️', '📩', '📨', '📧', '💌', '📥', '📤', '📦', '🏷️', '📪', '📫', '📬', '📭', '📮', '📯', '📜', '📃', '📄', '📑', '🧾', '📊', '📈', '📉', '🗒️', '🗓️', '📆', '📅', '🗑️', '📇', '🗃️', '🗳️', '🗄️', '📋', '📁', '📂', '🗂️', '🗞️', '📰', '📓', '📔', '📒', '📕', '📗', '📘', '📙', '📚', '📖', '🔖', '🧷', '🔗', '📎', '🖇️', '📐', '📏', '🧮', '📌', '📍', '✂️', '🖊️', '🖋️', '✒️', '🖌️', '🖍️', '📝', '✏️', '🔍', '🔎', '🔏', '🔐', '🔒', '🔓']
};



// Skin tone modifiers
const SKIN_TONE_MODIFIERS = {
  none: null,
  light: '🏻',
  mediumLight: '🏼',
  medium: '🏽',
  mediumDark: '🏾',
  dark: '🏿'
};

// List of emojis that support skin tone modifiers
// This includes base people emojis and hand gestures only
const SKIN_TONE_SUPPORTED = [
  // Hand gestures
  '👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', 
  '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', 
  '👏', '🙌', '👐', '🤲', '🙏', '✍️', '💅', '🤳', '💪',
  // Body parts
  '🦵', '🦶', '👂', '🦻', '👃',
  // Base people (no gender/role modifiers)
  '👶', '🧒', '👦', '👧', '🧑', '👨', '👩', '🧓', '👴', '👵',
  // Simple professions and roles
  '👮', '👷', '💂', '🕵️', '👳', '👲', '🧕', '🤴', '👸', '🎅', '🤶', 
  '🦸', '🦹', '🧙', '🧚', '🧛', '🧜', '🧝', '🧞', '🧟', '👼', '🤰', '🤱',
  // Activities
  '🙇', '💁', '🙅', '🙆', '🙋', '🧏', '🤦', '🤷', '🙎', '🙍', '💇', '💆',
  '🧖', '💃', '🕺', '🕴', '🚶', '🧍', '🧎', '🏃', '🤸', '🏋️', '🤾', '🏌️',
  '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴', '🤹'
];

// Helper function to check if emoji supports skin tone
const supportsSkinTone = (emoji) => {
  return SKIN_TONE_SUPPORTED.includes(emoji);
};

// Helper function to apply skin tone to emoji
const applySkinTone = (emoji, skinTone) => {
  if (!skinTone || !supportsSkinTone(emoji)) {
    return emoji;
  }
  
  // Simply concatenate the skin tone modifier
  // React Native should handle the rendering
  return emoji + skinTone;
};

// Helper function to detect if a string contains emoji
const containsEmoji = (text) => {
  // Unicode ranges for emoji detection
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]|[\u{2300}-\u{23FF}]|[\u{2460}-\u{24FF}]|[\u{2B50}]/gu;
  return emojiRegex.test(text);
};

// Helper function to extract emojis from text
const extractEmojis = (text) => {
  // More comprehensive emoji regex that works on both iOS and Android
  // Includes emoji sequences, modifiers, and zero-width joiners
  const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Component})+/gu;
  const matches = text.match(emojiRegex);
  if (!matches) return '';
  
  // Filter out non-visible characters and join the results
  const emojis = matches.filter(match => {
    // Remove any standalone variation selectors or zero-width joiners
    return match && match.trim() && !/^[\uFE0F\u200D]+$/.test(match);
  }).join('');
  
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
  const [categoryKeys, setCategoryKeys] = useState(Object.keys(EMOJI_CATEGORIES));
  const [selectedSkinTone, setSelectedSkinTone] = useState(null);
  const [showSkinToneSelector, setShowSkinToneSelector] = useState(false);
  const [detectedEmoji, setDetectedEmoji] = useState('');
  
  // Calculate columns based on screen size
  // For phones, use 5 columns to ensure they fit properly without scrolling
  const numColumns = isTablet() ? 10 : 5;
  
  // Initialize categories with custom images
  useEffect(() => {
    if (showCustomImages) {
      // Add Custom category dynamically
      if (!EMOJI_CATEGORIES['Custom']) {
        EMOJI_CATEGORIES['Custom'] = CUSTOM_IMAGES;
      }
      setCategoryKeys(Object.keys(EMOJI_CATEGORIES));
      // Prefer Lifestyle category if available, otherwise Custom
      setSelectedCategory('Lifestyle');
    } else {
      // Remove Custom category if it exists
      if (EMOJI_CATEGORIES['Custom']) {
        delete EMOJI_CATEGORIES['Custom'];
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
              const matches = emojiInfo.searchTerms.some(term => term.includes(query));
              if (matches || item.includes(searchQuery)) {
                filtered.push({ type: 'emoji', emoji: item, category });
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
            ? { type: 'emoji', emoji: item, category: selectedCategory }
            : { type: 'image', ...item, category: selectedCategory }
        )
      );
    }
  }, [searchQuery, selectedCategory]);
  
  const handleSelect = (item) => {
    if (item.type === 'emoji') {
      onSelect(item.emoji);
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
    let displayEmoji = item.emoji;
    if (item.type === 'emoji' && selectedCategory === 'People' && selectedSkinTone && supportsSkinTone(item.emoji)) {
      displayEmoji = applySkinTone(item.emoji, selectedSkinTone);
    }
    
    const isSelected = item.type === 'emoji' 
      ? selectedEmoji === displayEmoji 
      : selectedEmoji === `image:${item.src}`;
      
    return (
      <TouchableOpacity
        style={[styles.emojiItem, isSelected && styles.selectedItem]}
        onPress={() => handleSelect(item.type === 'emoji' ? { ...item, emoji: displayEmoji } : item)}
      >
        {item.type === 'emoji' ? (
          <Text style={styles.emoji}>{displayEmoji}</Text>
        ) : (
          <Image 
            source={CUSTOM_IMAGE_SOURCES[item.src]}
            style={styles.customImage}
            resizeMode="contain"
          />
        )}
      </TouchableOpacity>
    );
  };
  
  const content = (
    <View style={[styles.container, mode === 'inline' && styles.inlineContainer]}>
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
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
          >
            {categoryKeys.map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryTab,
                  selectedCategory === category && styles.selectedCategoryTab
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category && styles.selectedCategoryText
                ]}>
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
              style={[styles.skinToneOption, !selectedSkinTone && styles.selectedSkinTone]}
              onPress={() => setSelectedSkinTone(null)}
            >
              <Text style={styles.skinToneEmoji}>👋</Text>
            </TouchableOpacity>
            {Object.entries(SKIN_TONE_MODIFIERS).filter(([key]) => key !== 'none').map(([key, modifier]) => (
              <TouchableOpacity
                key={key}
                style={[styles.skinToneOption, selectedSkinTone === modifier && styles.selectedSkinTone]}
                onPress={() => setSelectedSkinTone(modifier)}
              >
                <Text style={styles.skinToneEmoji}>{applySkinTone('👋', modifier)}</Text>
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
            style={[styles.detectedEmojiButton, { backgroundColor: theme?.light || '#E8F0FE' }]}
            onPress={() => handleSelect({ type: 'emoji', emoji: detectedEmoji })}
            activeOpacity={0.7}
          >
            <Text style={styles.detectedEmoji}>{detectedEmoji}</Text>
            <Icon name="check-circle" size={24} color={theme?.primary || '#667eea'} style={{ marginLeft: 8 }} />
          </TouchableOpacity>
          <Text style={styles.detectedEmojiHint}>You can type or paste any emoji!</Text>
        </View>
      )}
      
      {/* Emoji Grid */}
      {(
        <View style={{ flex: 1 }}>
          <FlatList
            data={(() => {
              // Add empty items to fill the last row
              const items = [...filteredItems];
              const remainder = items.length % numColumns;
              if (remainder !== 0) {
                for (let i = 0; i < (numColumns - remainder); i++) {
                  items.push({ type: 'placeholder', id: `placeholder-${i}` });
                }
              }
              return items;
            })()}
            renderItem={renderItem}
            keyExtractor={(item, index) => 
              item.type === 'emoji' ? item.emoji : 
              item.type === 'placeholder' ? item.id : item.src
            }
            numColumns={numColumns}
            contentContainerStyle={styles.emojiGrid}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          />
        </View>
      )}
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
          onPress={(e) => e.stopPropagation()}
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
    height: 300,
    maxHeight: 300,
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
    height: '80%',
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
    fontSize: isTablet() ? TYPOGRAPHY.fontSize.xl : TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
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
    fontSize: isTablet() ? TYPOGRAPHY.fontSize.lg : TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.gray[900],
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
    fontSize: isTablet() ? TYPOGRAPHY.fontSize.md : TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.gray[700],
  },
  selectedCategoryText: {
    color: 'white',
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  emojiGrid: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md, // Consistent padding on sides
  },
  emojiItem: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: isTablet() ? SPACING.xs : 3, // Smaller margin on phones
    borderRadius: RADIUS.md,
    minHeight: isTablet() ? 64 : 60, // Slightly larger for better touch targets with 5 columns
  },
  selectedItem: {
    backgroundColor: COLORS.gray[200],
  },
  emoji: {
    fontSize: isTablet() ? 42 : 32,
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
  },
  detectedEmojiContainer: {
    paddingHorizontal: isTablet() ? SPACING.xl : SPACING.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  detectedEmojiLabel: {
    fontSize: isTablet() ? TYPOGRAPHY.fontSize.sm : TYPOGRAPHY.fontSize.xs,
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
  },
  detectedEmojiHint: {
    fontSize: isTablet() ? TYPOGRAPHY.fontSize.xs : 11,
    color: COLORS.gray[500],
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    marginTop: SPACING.xs,
  },
});

export default EmojiPicker;