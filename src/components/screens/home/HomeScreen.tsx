import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Dimensions, 
  FlatList,
  Animated,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Using online images
const slideImages = [
  { 
    id: '1',
    image: 'https://images.unsplash.com/photo-1509822929063-6b6cfc9b42f2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80', 
    title: 'Smart Farm Management',
    subtitle: 'Monitor your coconut farm from anywhere'
  },
  { 
    id: '2',
    image: 'https://images.unsplash.com/photo-1598928636135-d146006ff4be?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
    title: 'Maximize Yield',
    subtitle: 'Get data-driven insights for better results'
  },
  { 
    id: '3',
    image: 'https://images.unsplash.com/photo-1552410260-0fd9b577afa6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
    title: 'Weather Integration',
    subtitle: 'Optimize irrigation based on forecasts'
  },
  { 
    id: '4',
    image: 'https://images.unsplash.com/photo-1600673925282-a6bdc9f4f75f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
    title: 'Remote Control',
    subtitle: 'Automate irrigation and fertilization'
  }
];

const HomeScreen: React.FC = ({ navigation }: any) => {
  const { user, logout } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [imagesLoaded, setImagesLoaded] = useState(
    slideImages.map(() => false)
  );

  // Auto scroll for image slider
  useEffect(() => {
    const timerId = setInterval(() => {
      const nextIndex = (currentIndex + 1) % slideImages.length;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true
      });
      setCurrentIndex(nextIndex);
    }, 5000);

    return () => clearInterval(timerId);
  }, [currentIndex]);

  const menuItems = [
    {
      id: 'water',
      title: 'Water Scheduling',
      icon: 'water-outline',
      color: '#4DA3FF',
      bgColor: '#EBF5FF',
      onPress: () => navigation.navigate('Watering')
    },
    {
      id: 'yield',
      title: 'Coconut Yield',
      icon: 'leaf-outline',
      color: '#4CD964',
      bgColor: '#EAFFF2',
      onPress: () => navigation.navigate('CoconutYield')
    },
    {
      id: 'copra',
      title: 'Copra Identification',
      icon: 'scan-outline',
      color: '#9B59B6',
      bgColor: '#F8EFFF',
      onPress: () => navigation.navigate('CopraIdentification')
    },
    {
      id: 'oil',
      title: 'Drying Time in Copra',
      icon: 'flask-outline',
      color: '#FF9500',
      bgColor: '#FFF6EB',
      onPress: () => navigation.navigate('OilYield')
    },
    {
      id: 'locations',
      title: 'Locations',
      icon: 'location-outline',
      color: '#FF4D4D',
      bgColor: '#FFEBEB',
      onPress: () => navigation.navigate('LocationList')
    },
    {
      id: 'devices',
      title: 'Devices',
      icon: 'hardware-chip-outline',
      color: '#7F58FF',
      bgColor: '#F0EBFF',
      onPress: () => navigation.navigate('Devices')
    },
  ];

  const handleImageLoad = (index: number) => {
    const newLoadedState = [...imagesLoaded];
    newLoadedState[index] = true;
    setImagesLoaded(newLoadedState);
  };

  const renderSlideItem = (item:any, index:any) => {
    return (
      <View style={styles.slideItem}>
        <Image 
          source={{ uri: item.image }} 
          style={styles.slideImage}
          onLoad={() => handleImageLoad(index)}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.slideGradient}
        />
        <View style={styles.slideContent}>
          <Text style={styles.slideTitle}>{item.title}</Text>
          <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
        </View>
      </View>
    );
  };

  const renderDotIndicator = () => {
    return (
      <View style={styles.dotContainer}>
        {slideImages.map((_, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];
          
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 16, 8],
            extrapolate: 'clamp',
          });
          
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
            extrapolate: 'clamp',
          });
          
          return (
            <Animated.View
              key={`dot-${index}`}
              style={[
                styles.dot,
                { width: dotWidth, opacity },
              ]}
            />
          );
        })}
      </View>
    );
  };

  const onSlideChange = (event:any) => {
    const slideIndex = Math.floor(
      event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width
    );
    if (slideIndex >= 0) {
      setCurrentIndex(slideIndex);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with profile */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back</Text>
            <Text style={styles.nameText}>{user?.name || 'John Doe'}</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.profileImage} />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Text style={styles.profileInitial}>
                  {user?.name?.charAt(0) || 'J'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Image slider */}
        <View style={styles.sliderContainer}>
          <FlatList
            ref={flatListRef}
            data={slideImages}
            renderItem={({ item, index }) => renderSlideItem(item, index)}
            keyExtractor={item => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
          />
          {renderDotIndicator()}
        </View>

        {/* Menu grid */}
        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.menuGrid}>
            {menuItems.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuItem, { backgroundColor: item.bgColor }]}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                  <Ionicons name={item.icon} size={30} color={item.color} />
                </View>
                <Text style={styles.menuTitle}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Signout button */}
        <TouchableOpacity 
          style={styles.signOutButton} 
          onPress={logout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color="#6B7280" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'System',
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'System',
  },
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profilePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  sliderContainer: {
    height: 180,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  slideItem: {
    width,
    height: 180,
    paddingHorizontal: 20,
  },
  slideImage: {
    width: width - 40,
    height: 180,
    borderRadius: 16,
    position: 'absolute',
    backgroundColor: '#f0f0f0', // Placeholder color while loading
  },
  slideGradient: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 0,
    height: 100,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  slideContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  slideTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'System',
    marginBottom: 4,
  },
  slideSubtitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'System',
    opacity: 0.9,
  },
  dotContainer: {
    position: 'absolute',
    bottom: 15,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
  },
  menuContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1F2937',
    fontFamily: 'System',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#374151',
    fontFamily: 'System',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginTop: 16,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 8,
    fontFamily: 'System',
  },
});

export default HomeScreen;