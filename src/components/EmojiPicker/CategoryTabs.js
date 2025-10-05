import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '../Typography';
import { styles } from './styles';

const CategoryTabs = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => (
  <View style={styles.categoryContainer}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {categories
        .filter(category => typeof category === 'string' && category)
        .map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryTab,
              selectedCategory === category && styles.selectedCategoryTab,
            ]}
            onPress={() => onSelectCategory(category)}
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
);

export default CategoryTabs;