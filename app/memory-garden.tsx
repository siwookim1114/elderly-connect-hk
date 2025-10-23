// app/memory-garden.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert, FlatList, Image, Modal, Platform, RefreshControl, SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import memoryGardenApi from './services/memoryGardenApi';

interface Memory {
  id: string;
  title: string;
  description: string;
  imageUri: string;
  date: string;
  story?: string;
  category: string;
}

const MEMORIES_KEY = '@memories';

export default function MemoryGarden() {
  const router = useRouter();
  const { t } = useTranslation();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [showImagesModal, setShowImagesModal] = useState(false);
  const [availableImages, setAvailableImages] = useState<Array<{id: string, storyId: string, url: string, date: string}>>([]);
  const [imagesLoading, setImagesLoading] = useState(false);

  useEffect(() => {
    checkApiConnection();
    loadMemories();
  }, []);

  // Reload memories when screen comes into focus (e.g., after deleting)
  useFocusEffect(
    useCallback(() => {
      console.log('Memory Garden focused, reloading memories...');
      loadMemories();
    }, [apiConnected])
  );

  const checkApiConnection = async () => {
    try {
      const isConnected = await memoryGardenApi.healthCheck();
      setApiConnected(isConnected);
    } catch (error) {
      console.log('API not available, using local storage');
      setApiConnected(false);
    }
  };

  const loadAvailableImages = async () => {
    if (!apiConnected) return;
    
    try {
      setImagesLoading(true);
      const images = await memoryGardenApi.getAllImages();
      setAvailableImages(images);
    } catch (error) {
      console.error('Error loading available images:', error);
    } finally {
      setImagesLoading(false);
    }
  };

  const loadMemories = async () => {
    try {
      if (apiConnected) {
        // Load from API
        const stories = await memoryGardenApi.getAllStories();
        const apiMemories: Memory[] = stories.map(story => ({
          id: story.id,
          title: `Memory from ${story.date}`,
          description: story.story || 'A precious memory',
          imageUri: story.photos.length > 0 ? memoryGardenApi.getPhotoUrl(story.id, story.photos[0].id) : '',
          date: story.date,
          category: 'Story',
          story: story.story
        }));
        setMemories(apiMemories);
      } else {
        // Load from local storage
        const storedMemories = await AsyncStorage.getItem(MEMORIES_KEY);
        if (storedMemories) {
          setMemories(JSON.parse(storedMemories));
        }
      }
    } catch (error) {
      console.error('Error loading memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveMemories = async (newMemories: Memory[]) => {
    try {
      if (apiConnected) {
        // Save to API - this would require implementing the upload functionality
        console.log('API save not implemented yet, using local storage');
      }
      await AsyncStorage.setItem(MEMORIES_KEY, JSON.stringify(newMemories));
      setMemories(newMemories);
    } catch (error) {
      console.error('Error saving memories:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMemories();
    setRefreshing(false);
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert(t('memoryGarden.permissionRequired'), t('memoryGarden.libraryPermissionDenied'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const date = new Date().toISOString().split('T')[0];
      
      // Convert to base64 for web to persist across reloads
      let imageUri = asset.uri;
      if (Platform.OS === 'web' && asset.uri) {
        try {
          const response = await fetch(asset.uri);
          const blob = await response.blob();
          const reader = new FileReader();
          imageUri = await new Promise((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.error('Error converting image to base64:', error);
        }
      }
      
      if (apiConnected) {
        try {
          const name = asset.fileName || asset.uri.split('/').pop() || `photo_${Date.now()}.jpg`;
          const type = (asset as any).mimeType || 'image/jpeg';
          await memoryGardenApi.uploadPhotosAndGenerateStory(
            [
              {
                uri: asset.uri,
                name,
                type,
              },
            ],
            date,
            'Clear sky',
            'Unknown'
          );
          await loadMemories();
        } catch (e) {
          console.error('Upload failed, saving locally instead:', e);
          const newMemory: Memory = {
            id: Date.now().toString(),
            title: `${t('memoryGarden.addMemory')} ${memories.length + 1}`,
            description: t('memoryGarden.noMemoriesSubtitle'),
            imageUri: imageUri,
            date,
            category: 'General',
            story: t('memoryGarden.aiGeneratedStory')
          };
          const updatedMemories = [...memories, newMemory];
          await saveMemories(updatedMemories);
        }
      } else {
        const newMemory: Memory = {
          id: Date.now().toString(),
          title: `${t('memoryGarden.addMemory')} ${memories.length + 1}`,
          description: t('memoryGarden.noMemoriesSubtitle'),
          imageUri: imageUri,
          date,
          category: 'General',
          story: t('memoryGarden.aiGeneratedStory')
        };
        const updatedMemories = [...memories, newMemory];
        await saveMemories(updatedMemories);
      }
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert(t('memoryGarden.permissionRequired'), t('memoryGarden.cameraPermissionDenied'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const date = new Date().toISOString().split('T')[0];
      
      // Convert to base64 for web to persist across reloads
      let imageUri = asset.uri;
      if (Platform.OS === 'web' && asset.uri) {
        try {
          const response = await fetch(asset.uri);
          const blob = await response.blob();
          const reader = new FileReader();
          imageUri = await new Promise((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.error('Error converting image to base64:', error);
        }
      }
      
      if (apiConnected) {
        try {
          const name = asset.fileName || asset.uri.split('/').pop() || `photo_${Date.now()}.jpg`;
          const type = (asset as any).mimeType || 'image/jpeg';
          await memoryGardenApi.uploadPhotosAndGenerateStory(
            [
              {
                uri: asset.uri,
                name,
                type,
              },
            ],
            date,
            'Clear sky',
            'Unknown'
          );
          await loadMemories();
        } catch (e) {
          console.error('Upload failed, saving locally instead:', e);
          const newMemory: Memory = {
            id: Date.now().toString(),
            title: `${t('memoryGarden.addMemory')} ${memories.length + 1}`,
            description: t('memoryGarden.noMemoriesSubtitle'),
            imageUri: imageUri,
            date,
            category: 'Photo',
            story: t('memoryGarden.aiGeneratedStory')
          };
          const updatedMemories = [...memories, newMemory];
          await saveMemories(updatedMemories);
        }
      } else {
        const newMemory: Memory = {
          id: Date.now().toString(),
          title: `${t('memoryGarden.addMemory')} ${memories.length + 1}`,
          description: t('memoryGarden.noMemoriesSubtitle'),
          imageUri: imageUri,
          date,
          category: 'Photo',
          story: t('memoryGarden.aiGeneratedStory')
        };
        const updatedMemories = [...memories, newMemory];
        await saveMemories(updatedMemories);
      }
    }
  };

  const showAddOptions = async () => {
    console.log('Add memory button pressed!');
    if (apiConnected) {
      // Load available images from server
      await loadAvailableImages();
      setShowImagesModal(true);
    } else {
      // If not connected to API, show alert
      Alert.alert(t('memoryGarden.error'), t('memoryGarden.failedToLoad'));
    }
  };

  const closeAddModal = () => {
    // This function is no longer used but kept for compatibility
  };

  const closeImagesModal = () => {
    setShowImagesModal(false);
  };

  const renderMemory = ({ item }: { item: Memory }) => (
    <TouchableOpacity 
      style={styles.memoryCard}
      onPress={() => router.push(`/memory-detail/${item.id}`)}
    >
      <Image source={{ uri: item.imageUri }} style={styles.memoryImage} />
      <View style={styles.memoryInfo}>
        <Text style={styles.memoryTitle}>{item.title}</Text>
        <Text style={styles.memoryDate}>{item.date}</Text>
        <Text style={styles.memoryDescription} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderImageItem = ({ item }: { item: {id: string, storyId: string, url: string, date: string} }) => (
    <TouchableOpacity 
      style={styles.imageCard}
      onPress={() => {
        // Navigate to the story detail page for this image
        closeImagesModal();
        router.push(`/memory-detail/${item.storyId}`);
      }}
    >
      <Image source={{ uri: item.url }} style={styles.imageThumbnail} />
      <View style={styles.imageInfo}>
        <Text style={styles.imageDate}>{item.date}</Text>
        <Text style={styles.imageId} numberOfLines={1}>
          Story: {item.storyId.substring(0, 8)}...
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{
            title: t("memoryGarden.title"),
            headerTitleAlign: "center",
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DD6B20" />
          <Text style={styles.loadingText}>{t('memoryGarden.loadingMemories')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: t("memoryGarden.title"),
          headerTitleAlign: "center",
        }}
      />
      
      {memories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="flower-outline" size={80} color="#DD6B20" />
          <Text style={styles.emptyTitle}>{t('memoryGarden.noMemories')}</Text>
          <Text style={styles.emptySubtitle}>
            {t('memoryGarden.noMemoriesSubtitle')}
          </Text>
          <TouchableOpacity 
            style={styles.addFirstButton}
            onPress={() => {
              console.log('Button pressed!');
              showAddOptions();
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={24} color="white" />
            <Text style={styles.addFirstButtonText}>{t('memoryGarden.addFirstMemory')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={memories}
            renderItem={renderMemory}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.memoriesList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
          <TouchableOpacity 
            style={styles.fab}
            onPress={showAddOptions}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </>
      )}

      {/* Images Selection Modal */}
      <Modal
        visible={showImagesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeImagesModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.imagesModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('memoryGarden.chooseMethod')}</Text>
              <Text style={styles.modalSubtitle}>
                {t('memoryGarden.chooseMethod')}
              </Text>
            </View>
            
            {imagesLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#DD6B20" />
                <Text style={styles.loadingText}>{t('memoryGarden.loading')}</Text>
              </View>
            ) : (
              <FlatList
                data={availableImages}
                renderItem={renderImageItem}
                keyExtractor={(item) => `${item.storyId}-${item.id}`}
                numColumns={2}
                contentContainerStyle={styles.imagesList}
              />
            )}
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={closeImagesModal}
            >
              <Ionicons name="close" size={24} color="#718096" />
              <Text style={[styles.modalButtonText, styles.cancelButtonText]}>{t('memoryGarden.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3748',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DD6B20',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  addFirstButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  memoriesList: {
    padding: 16,
    paddingBottom: 80,
  },
  memoryCard: {
    flex: 1,
    margin: 8,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  memoryImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  memoryInfo: {
    padding: 12,
  },
  memoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  memoryDate: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 6,
  },
  memoryDescription: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 18,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DD6B20',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: '#F7FAFC',
    borderColor: '#E2E8F0',
  },
  cancelButtonText: {
    color: '#718096',
  },
  imagesModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  imagesList: {
    padding: 16,
    paddingBottom: 80,
  },
  imageCard: {
    flex: 1,
    margin: 8,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  imageThumbnail: {
    width: '100%',
    height: 100,
    resizeMode: 'cover',
  },
  imageInfo: {
    padding: 8,
  },
  imageDate: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 4,
  },
  imageId: {
    fontSize: 12,
    color: '#4A5568',
    fontWeight: '500',
  },
});