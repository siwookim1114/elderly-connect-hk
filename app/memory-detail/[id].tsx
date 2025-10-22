// app/memory-detail/[id].tsx
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import memoryGardenApi, { StoryResponse } from '../services/memoryGardenApi';

const { width } = Dimensions.get('window');

export default function MemoryDetail() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [story, setStory] = useState<StoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [audioLoading, setAudioLoading] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    loadStory();
    return () => {
      // Cleanup audio when component unmounts
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [id]);

  const loadStory = async () => {
    try {
      const storyData = await memoryGardenApi.getStory(id);
      setStory(storyData);
    } catch (error) {
      console.error('Error loading story:', error);
      Alert.alert('Error', 'Failed to load memory details');
    } finally {
      setLoading(false);
    }
  };

  const playCantoneseAudio = async () => {
    if (!story) return;

    try {
      setAudioLoading(true);
      
      if (sound) {
        await sound.unloadAsync();
      }

      const audioUrl = memoryGardenApi.getAudioStreamUrl(story.id);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );

      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio');
    } finally {
      setAudioLoading(false);
    }
  };

  const stopAudio = async () => {
    if (sound) {
      await sound.stopAsync();
      setIsPlaying(false);
    }
  };

  const toggleAudio = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      playCantoneseAudio();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{
            title: "Memory Detail",
            headerTitleAlign: "center",
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DD6B20" />
          <Text style={styles.loadingText}>Loading memory...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!story) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{
            title: "Memory Detail",
            headerTitleAlign: "center",
          }}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={80} color="#E53E3E" />
          <Text style={styles.errorTitle}>Memory Not Found</Text>
          <Text style={styles.errorSubtitle}>
            This memory could not be found or may have been deleted.
          </Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: "Memory Detail",
          headerTitleAlign: "center",
        }}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Photos Grid */}
        <View style={styles.photosContainer}>
          {story.photos.map((photo, index) => (
            <Image
              key={photo.id}
              source={{ uri: memoryGardenApi.getPhotoUrl(story.id, photo.id) }}
              style={[
                styles.photo,
                story.photos.length === 1 ? styles.singlePhoto : styles.multiPhoto
              ]}
              resizeMode="cover"
            />
          ))}
        </View>

        {/* Memory Info */}
        <View style={styles.infoContainer}>
          <View style={styles.metadataRow}>
            <View style={styles.metadataItem}>
              <Ionicons name="calendar-outline" size={20} color="#718096" />
              <Text style={styles.metadataText}>{story.date}</Text>
            </View>
            <View style={styles.metadataItem}>
              <Ionicons name="partly-sunny-outline" size={20} color="#718096" />
              <Text style={styles.metadataText}>{story.weather}</Text>
            </View>
            <View style={styles.metadataItem}>
              <Ionicons name="location-outline" size={20} color="#718096" />
              <Text style={styles.metadataText}>{story.location}</Text>
            </View>
          </View>

          {/* Story Section */}
          {story.story && (
            <View style={styles.storyContainer}>
              <View style={styles.storyHeader}>
                <Ionicons name="book-outline" size={24} color="#DD6B20" />
                <Text style={styles.storyTitle}>AI-Generated Story</Text>
              </View>
              <Text style={styles.storyText}>{story.story}</Text>
            </View>
          )}

          {/* Audio Section */}
          <View style={styles.audioContainer}>
            <View style={styles.audioHeader}>
              <Ionicons name="volume-high-outline" size={24} color="#DD6B20" />
              <Text style={styles.audioTitle}>Cantonese Audio</Text>
            </View>
            <Text style={styles.audioSubtitle}>
              Listen to your story in Cantonese
            </Text>
            
            <TouchableOpacity 
              style={[styles.audioButton, audioLoading && styles.audioButtonDisabled]}
              onPress={toggleAudio}
              disabled={audioLoading}
            >
              {audioLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons 
                  name={isPlaying ? "pause" : "play"} 
                  size={24} 
                  color="white" 
                />
              )}
              <Text style={styles.audioButtonText}>
                {audioLoading ? 'Loading...' : isPlaying ? 'Pause Audio' : 'Play in Cantonese'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E53E3E',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  backButton: {
    backgroundColor: '#DD6B20',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 8,
  },
  photo: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  singlePhoto: {
    width: width - 32,
    height: 300,
  },
  multiPhoto: {
    width: (width - 48) / 2,
    height: 150,
  },
  infoContainer: {
    padding: 16,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  metadataItem: {
    alignItems: 'center',
    flex: 1,
  },
  metadataText: {
    marginTop: 4,
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
  },
  storyContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  storyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  storyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginLeft: 8,
  },
  storyText: {
    fontSize: 16,
    color: '#4A5568',
    lineHeight: 24,
  },
  audioContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  audioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  audioTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginLeft: 8,
  },
  audioSubtitle: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 16,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DD6B20',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  audioButtonDisabled: {
    backgroundColor: '#A0AEC0',
  },
  audioButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});