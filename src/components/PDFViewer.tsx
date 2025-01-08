import React, {useState, useRef, useEffect, useCallback} from 'react';
import {launchImageLibrary} from 'react-native-image-picker';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Image,
  Alert,
  ImageStyle,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import Pdf from 'react-native-pdf';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {colors, typography, spacing, shadows} from '../styles/theme';
import PDFToolbar from './PDFToolbar';

interface Annotation {
  id: string;
  type: 'text' | 'image';
  content: string;
  position: {
    x: number;
    y: number;
    page: number;
  };
  scale: number;
}

interface PDFViewerProps {
  uri: string;
  onClose?: () => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({uri, onClose}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] =
    useState<Annotation | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({x: 0, y: 0});
  const [initialTouchDistance, setInitialTouchDistance] = useState<
    number | null
  >(null);
  const [initialScale, setInitialScale] = useState(1);
  const pdfRef = useRef(null);

  const loadAnnotations = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(`pdf_annotations_${uri}`);
      if (saved) {
        setAnnotations(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading annotations:', error);
    }
  }, [uri]);

  useEffect(() => {
    loadAnnotations();
  }, [loadAnnotations]);

  const handleLoadComplete = (numberOfPages: number) => {
    setIsLoading(false);
    setTotalPages(numberOfPages);
  };

  const handlePageChanged = (page: number) => {
    setCurrentPage(page);
  };

  const handleError = (error: object) => {
    console.error('PDF Error:', error);
    setIsLoading(false);
  };

  const handleAddText = () => {
    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type: 'text',
      content: 'Enter text here',
      position: {
        x: 100,
        y: 100,
        page: currentPage,
      },
      scale: 1,
    };
    setAnnotations([...annotations, newAnnotation]);
    setSelectedAnnotation(newAnnotation);
    setIsEditing(true);
  };

  const handleAddImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 1,
        includeBase64: true,
      });

      if (result.assets && result.assets[0]?.base64) {
        const newAnnotation: Annotation = {
          id: Date.now().toString(),
          type: 'image',
          content: `data:image/jpeg;base64,${result.assets[0].base64}`,
          position: {
            x: 100,
            y: 100,
            page: currentPage,
          },
          scale: 1,
        };
        setAnnotations([...annotations, newAnnotation]);
        setSelectedAnnotation(newAnnotation);
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSave = async () => {
    try {
      await AsyncStorage.setItem(
        `pdf_annotations_${uri}`,
        JSON.stringify(annotations),
      );
      setIsEditing(false);
      setSelectedAnnotation(null);
      Alert.alert('Success', 'Changes saved successfully');
    } catch (error) {
      console.error('Error saving annotations:', error);
      Alert.alert('Error', 'Failed to save changes');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedAnnotation(null);
    loadAnnotations();
  };

  const handleRemoveAnnotation = (id: string) => {
    const updatedAnnotations = annotations.filter(anno => anno.id !== id);
    setAnnotations(updatedAnnotations);
    setSelectedAnnotation(null);
  };

  const getDistance = (touches: any[]) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const renderAnnotations = () => {
    return annotations
      .filter(anno => anno.position.page === currentPage)
      .map(anno => {
        const panResponder = PanResponder.create({
          onStartShouldSetPanResponder: () => isEditing,
          onMoveShouldSetPanResponder: () => isEditing,
          onPanResponderGrant: (e: GestureResponderEvent) => {
            if (!isEditing) return;

            const touches = e.nativeEvent.touches;
            if (touches.length === 2) {
              // Pinch start
              const distance = getDistance(touches);
              setInitialTouchDistance(distance);
              setInitialScale(anno.scale || 1);
            } else if (touches.length === 1) {
              // Drag start
              const {pageX, pageY} = e.nativeEvent;
              setDragOffset({
                x: pageX - anno.position.x,
                y: pageY - anno.position.y,
              });
              setSelectedAnnotation(anno);
              setIsDragging(true);
            }
          },
          onPanResponderMove: (e: GestureResponderEvent) => {
            if (!isEditing) return;

            const touches = e.nativeEvent.touches;
            if (touches.length === 2 && initialTouchDistance) {
              // Pinch move
              const distance = getDistance(touches);
              const scale = Math.max(
                0.5,
                Math.min(3, (initialScale * distance) / initialTouchDistance),
              );

              const updated = annotations.map(a =>
                a.id === anno.id ? {...a, scale} : a,
              );
              setAnnotations(updated);
            } else if (touches.length === 1 && isDragging) {
              // Drag move
              const {pageX, pageY} = e.nativeEvent;
              const updated = annotations.map(a =>
                a.id === selectedAnnotation?.id
                  ? {
                      ...a,
                      position: {
                        ...a.position,
                        x: pageX - dragOffset.x,
                        y: pageY - dragOffset.y,
                      },
                    }
                  : a,
              );
              setAnnotations(updated);
            }
          },
          onPanResponderRelease: () => {
            setIsDragging(false);
            setInitialTouchDistance(null);
          },
        });

        return (
          <View
            key={anno.id}
            {...panResponder.panHandlers}
            style={[
              styles.annotation,
              {
                left: anno.position.x,
                top: anno.position.y,
                transform: [{scale: anno.scale || 1}],
              },
              isEditing && {
                borderWidth: 1,
                borderColor: colors.primary,
                borderStyle: 'dashed',
              },
            ]}>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveAnnotation(anno.id)}>
              <Text style={styles.removeButtonText}>×</Text>
            </TouchableOpacity>
            {anno.type === 'text' ? (
              <TextInput
                style={styles.annotationText}
                value={anno.content}
                onChangeText={text => {
                  const updated = annotations.map(a =>
                    a.id === anno.id ? {...a, content: text} : a,
                  );
                  setAnnotations(updated);
                }}
                multiline
                editable={isEditing}
              />
            ) : (
              <Image
                source={{uri: anno.content}}
                style={styles.annotationImage as ImageStyle}
                resizeMode="contain"
              />
            )}
          </View>
        );
      });
  };

  return (
    <SafeAreaView style={styles.container}>
      <PDFToolbar
        onSave={handleSave}
        onCancel={handleCancel}
        onAddText={handleAddText}
        onAddImage={handleAddImage}
        isEditing={isEditing}
      />
      <View style={styles.pdfContainer}>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
        <Pdf
          ref={pdfRef}
          source={{uri}}
          style={styles.pdf}
          onLoadComplete={handleLoadComplete}
          onPageChanged={handlePageChanged}
          onError={handleError}
          enablePaging={true}
          horizontal={false}
        />
        {renderAnnotations()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  removeButton: {
    position: 'absolute',
    right: -8,
    top: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    ...shadows.small,
  },
  removeButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 20,
    textAlign: 'center',
  },
  annotation: {
    position: 'absolute',
    minWidth: 100,
    minHeight: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 4,
    padding: spacing.xs,
    ...shadows.small,
  },
  annotationText: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    letterSpacing: typography.body.letterSpacing,
    fontWeight: '400',
    color: colors.text,
  },
  annotationImage: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
    ...shadows.small,
  },
  toolbarButton: {
    width: 80,
  },
  toolbarButtonText: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    letterSpacing: typography.body.letterSpacing,
    fontWeight: '400',
    color: colors.primary,
  },
  pageInfo: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    letterSpacing: typography.caption.letterSpacing,
    fontWeight: '400',
    color: colors.gray1,
  },
  pdfContainer: {
    flex: 1,
  },
  pdf: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});

export default PDFViewer;
