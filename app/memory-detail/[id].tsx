// app/memory-detail/[id].tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import memoryGardenApi, { StoryResponse } from '../services/memoryGardenApi';

const { width } = Dimensions.get('window');
const MEMORIES_KEY = '@memories';

interface LocalMemory {
  id: string;
  title: string;
  description: string;
  imageUri: string;
  date: string;
  story?: string;
  category: string;
}

// Cross-platform alert helper
const showAlert = (title: string, message?: string) => {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
};

// Cross-platform confirm helper
const showConfirm = (title: string, message: string, onConfirm: () => void) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'OK', onPress: onConfirm }
    ]);
  }
};

export default function MemoryDetail() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [story, setStory] = useState<StoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [audioLoading, setAudioLoading] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [isLocalMemory, setIsLocalMemory] = useState(false);

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
      // First try to load from API
      const storyData = await memoryGardenApi.getStory(id);
      setStory(storyData);
      setIsLocalMemory(false);
    } catch (error) {
      console.error('Error loading story from API:', error);
      // If API fails, try to load from local storage
      try {
        const storedMemories = await AsyncStorage.getItem(MEMORIES_KEY);
        if (storedMemories) {
          const memories: LocalMemory[] = JSON.parse(storedMemories);
          const localMemory = memories.find(m => m.id === id);
          if (localMemory) {
            // Convert local memory to StoryResponse format
            const localStory: StoryResponse = {
              id: localMemory.id,
              date: localMemory.date,
              weather: 'Unknown',
              location: 'Unknown',
              story: localMemory.story || localMemory.description,
              photos: [
                {
                  id: 'local-photo',
                  filename: 'local-image.jpg',
                  content_type: 'image/jpeg',
                  size: 0,
                  path: localMemory.imageUri
                }
              ],
              created_at: localMemory.date,
              updated_at: localMemory.date
            };
            setStory(localStory);
            setLocalImageUri(localMemory.imageUri);
            setIsLocalMemory(true);
          } else {
            console.error('Memory not found in local storage');
          }
        }
      } catch (localError) {
        console.error('Error loading from local storage:', localError);
      }
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
      console.log('Attempting to play audio from:', audioUrl);
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );

      console.log('Audio loaded successfully');
      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          console.log('Audio playback finished');
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      console.error('Audio URL was:', memoryGardenApi.getAudioStreamUrl(story.id));
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showAlert('Error', `Failed to play audio: ${errorMessage}`);
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
    if (isLocalMemory) {
      showAlert(
        'Feature Unavailable',
        'Cantonese audio is only available for memories uploaded to the server. Local memories do not have AI-generated audio.'
      );
      return;
    }
    if (isPlaying) {
      stopAudio();
    } else {
      playCantoneseAudio();
    }
  };

  const deleteMemory = async () => {
    console.log('Delete button pressed, isLocalMemory:', isLocalMemory);
    
    showConfirm(
      'Delete Memory',
      'Are you sure you want to delete this memory? This action cannot be undone.',
      async () => {
        console.log('Delete confirmed, starting deletion...');
        try {
          if (isLocalMemory) {
            console.log('Deleting local memory with id:', id);
            // Delete from local storage
            const storedMemories = await AsyncStorage.getItem(MEMORIES_KEY);
            console.log('Current stored memories:', storedMemories);
            if (storedMemories) {
              const memories: LocalMemory[] = JSON.parse(storedMemories);
              console.log('Parsed memories count:', memories.length);
              const updatedMemories = memories.filter(m => m.id !== id);
              console.log('Updated memories count:', updatedMemories.length);
              await AsyncStorage.setItem(MEMORIES_KEY, JSON.stringify(updatedMemories));
              console.log('Memory deleted successfully, navigating back...');
            }
            // Navigate back immediately after deletion
            router.back();
          } else {
            console.log('Attempting to delete API memory (not implemented)');
            // Delete from API (if API has delete endpoint)
            // await memoryGardenApi.deleteStory(id);
            showAlert('Info', 'API deletion not yet implemented');
          }
        } catch (error) {
          console.error('Error deleting memory:', error);
          showAlert('Error', 'Failed to delete memory');
        }
      }
    );
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
          {story.photos.map((photo, index) => {
            // Check if this is a local memory by checking if the photo id is 'local-photo'
            const isLocal = photo.id === 'local-photo';
            const imageUri = isLocal ? localImageUri || '' : memoryGardenApi.getPhotoUrl(story.id, photo.id);
            
            return (
              <Image
                key={photo.id}
                source={{ uri: imageUri }}
                style={[
                  styles.photo,
                  story.photos.length === 1 ? styles.singlePhoto : styles.multiPhoto
                ]}
                resizeMode="cover"
              />
            );
          })}
        </View>

        {/* Memory Info */}
        <View style={styles.infoContainer}>
          <View style={styles.metadataRow}>
            <View style={styles.metadataItem}>
              <Ionicons name="calendar-outline" size={20} color="#718096" />
              <Text style={styles.metadataText}>{story.date}</Text>
            </View>
          </View>

          {/* Story Section */}
          {story.story && (
            <View style={styles.storyContainer}>
              <View style={styles.storyHeader}>
                <Ionicons name="book-outline" size={24} color="#DD6B20" />
                <Text style={styles.storyTitle}>{isLocalMemory ? 'Memory Description' : 'AI-Generated Story'}</Text>
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

          {/* Delete Button */}
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={deleteMemory}
          >
            <Ionicons name="trash-outline" size={20} color="#E53E3E" />
            <Text style={styles.deleteButtonText}>Delete Memory</Text>
          </TouchableOpacity>
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
    marginBottom: 20,
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
  localNoticeContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF5F0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#DD6B20',
  },
  localNoticeText: {
    flex: 1,
    fontSize: 14,
    color: '#744210',
    marginLeft: 8,
    lineHeight: 20,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E53E3E',
  },
  deleteButtonText: {
    color: '#E53E3E',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});