import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
  Alert,
} from 'react-native';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {colors, typography, spacing} from './src/styles/theme';
import PDFViewer from './src/components/PDFViewer';

// Sample PDF URL
const SAMPLE_PDF_URL =
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

const App = () => {
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkCachedPDF();
  }, []);

  const checkCachedPDF = async () => {
    try {
      const cachedUri = await AsyncStorage.getItem('cachedPdfUri');
      if (cachedUri) {
        const exists = await RNFS.exists(cachedUri);
        if (exists) {
          setPdfUri(cachedUri);
        }
      }
    } catch (error) {
      console.error('Error checking cached PDF:', error);
    }
  };

  const downloadAndCachePDF = async () => {
    setIsLoading(true);
    try {
      // Create a unique filename
      const filename = 'sample.pdf';
      const localPath = `${RNFS.DocumentDirectoryPath}/${filename}`;

      // Download the PDF
      await RNFS.downloadFile({
        fromUrl: SAMPLE_PDF_URL,
        toFile: localPath,
      }).promise;

      // Cache the URI
      await AsyncStorage.setItem('cachedPdfUri', localPath);
      setPdfUri(localPath);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      Alert.alert('Error', 'Failed to download PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClosePDF = () => {
    setPdfUri(null);
  };

  if (pdfUri) {
    return <PDFViewer uri={pdfUri} onClose={handleClosePDF} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>PDF Viewer Demo</Text>
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={downloadAndCachePDF}
          disabled={isLoading}>
          <Text style={styles.buttonText}>
            {isLoading ? 'Loading...' : 'Load Sample PDF'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.title1.fontSize,
    lineHeight: typography.title1.lineHeight,
    letterSpacing: typography.title1.letterSpacing,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    letterSpacing: typography.body.letterSpacing,
    fontWeight: '600',
    color: colors.background,
  },
});

export default App;
