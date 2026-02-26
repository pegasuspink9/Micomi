import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Keyboard, SafeAreaView, ScrollView, TouchableOpacity, Modal, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import { gameScale } from '../Responsiveness/gameResponsive';
import { renderHighlightedText } from '../Actual Game/GameQuestions/utils/syntaxHighligther';
import { useRouter } from 'expo-router';
import MainLoading from '../Actual Game/Loading/MainLoading';

// --- OPTIMIZED TAB COMPONENTS ---
const FileTab = React.memo(({ file, isActive, isFirst, onTabPress, onDeletePress }) => (
  <Pressable
    onPress={() => onTabPress(file.id)}
    style={[
      styles.webTab,
      isActive && styles.webTabActive,
      isFirst && styles.webTabFirst,
    ]}
  >
    <Text style={[
      styles.webTabText, 
      isActive && styles.webTabTextActive
    ]}>
      {file.label}
    </Text>
    
    <TouchableOpacity 
      style={styles.deleteButton}
      onPress={() => onDeletePress(file.id)}
    >
      <Text style={styles.deleteButtonText}>×</Text>
    </TouchableOpacity>
  </Pressable>
), (prev, next) => {
  return prev.file.id === next.file.id &&
         prev.file.label === next.file.label &&
         prev.isActive === next.isActive &&
         prev.isFirst === next.isFirst;
});

const OutputTab = React.memo(({ isActive, onTabPress }) => (
  <Pressable
    onPress={onTabPress}
    style={[
      styles.webTab,
      styles.webTabLast,
      isActive && styles.webTabActive,
    ]}
  >
    <Text style={[
      styles.webTabText, 
      isActive && styles.webTabTextActive
    ]}>
      Output
    </Text>
  </Pressable>
));

// --- ISOLATED & MEMOIZED EDITOR COMPONENT ---
const FileEditor = React.memo(({ initialCode, fileId, lang, onCodeChange }) => {
  const [code, setCode] = useState(initialCode);

  useEffect(() => {
    const timer = setTimeout(() => {
      onCodeChange(fileId, code);
    }, 500); 
    return () => clearTimeout(timer);
  },[code, fileId, onCodeChange]);

  const lines = code.split('\n');

   const renderedLineNumbers = ( 
    <View style={styles.interactiveLineNumbers}>
      {Array.from({ length: lines.length + 1 }).map((_, i) => (
        <Text key={i} style={styles.interactiveLineNumberText}>{i + 1}</Text>
      ))}
    </View>
  );



  const renderedHighlights = useMemo(() => (
    <Text style={styles.interactiveHighlightedLayer} pointerEvents="none">
      {lines.map((line, i) => (
        <React.Fragment key={i}>
          {renderHighlightedText(line, lang)}
          {i < lines.length - 1 ? '\n' : ''}
        </React.Fragment>
      ))}
    </Text>
  ), [lines, lang]);

  return (
    <View style={styles.interactiveBody}>
      {renderedLineNumbers}
      
      <View style={styles.interactiveInputWrapper}>
        {renderedHighlights}
        
        <TextInput
          style={styles.interactiveInput}
          multiline={true}
          value={code}
          onChangeText={setCode}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          cursorColor="#f8f8f2"
        />
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  return prevProps.fileId === nextProps.fileId && 
         prevProps.lang === nextProps.lang &&
         prevProps.onCodeChange === nextProps.onCodeChange;
});

export default function CodePlayGround() {
  const router = useRouter();
  
  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation (doors opening) shortly after mount
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleBack = () => {
    setIsExiting(true); // Trigger doors closing
    // Wait for the closing animation (300ms) before routing back
    setTimeout(() => {
      router.back();
    }, 400); 
  };

  const[files, setFiles] = useState([
    { id: 'html_1', label: 'index.html', lang: 'html', code: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Playground</title>\n</head>\n<body>\n  <h1 id="greeting">Hello World!</h1>\n  <p>Welcome to the Micomi Code Playground.</p>\n</body>\n</html>' },
    { id: 'css_1', label: 'style.css', lang: 'css', code: '#greeting {\n  color: #ff5f56;\n  text-align: center;\n  margin-top: 50px;\n  font-family: "DynaPuff", sans-serif;\n}\n\np {\n  text-align: center;\n  color: #495057;\n  font-family: monospace;\n}' },
    { id: 'js_1', label: 'script.js', lang: 'javascript', code: '// Add your JavaScript here\nconsole.log("Playground ready!");\n\n// Example:\n// document.getElementById("greeting").style.color = "#27ca3f";' },
    { id: 'text_1', label: 'notes.txt', lang: 'text', code: 'This is a generic text file.\nYou can use it for notes or planning your code.' }
  ]);

  const [activeTab, setActiveTab] = useState('html_1');
  const [showDropdown, setShowDropdown] = useState(false);
  const[fileToDelete, setFileToDelete] = useState(null); 
  
  const [isNamingModalVisible, setIsNamingModalVisible] = useState(false);
  const [newFileLang, setNewFileLang] = useState(null);
  const [newFileName, setNewFileName] = useState('');

  const combinedHtml = useMemo(() => {
    const allHtml = files.filter(f => f.lang === 'html').map(f => f.code).join('\n');
    const allCss = files.filter(f => f.lang === 'css').map(f => f.code).join('\n');
    const allJs = files.filter(f => f.lang === 'javascript').map(f => f.code).join('\n');

    let finalHtml = allHtml;
    
    if (!finalHtml.includes('<head>')) {
      finalHtml = `<head></head><body>${finalHtml}</body>`;
    }
    
    const styleTag = `<style>${allCss}</style>`;
    const scriptTag = `<script>${allJs}</script>`;

    if (finalHtml.includes('</head>')) {
      finalHtml = finalHtml.replace('</head>', `${styleTag}</head>`);
    } else {
      finalHtml = `${styleTag}${finalHtml}`;
    }

    if (finalHtml.includes('</body>')) {
      finalHtml = finalHtml.replace('</body>', `${scriptTag}</body>`);
    } else {
      finalHtml = `${finalHtml}${scriptTag}`;
    }
    
    return finalHtml;
  }, [files]);

  const updateFileCode = useCallback((id, newCode) => {
    setFiles(prevFiles => prevFiles.map(f => f.id === id ? { ...f, code: newCode } : f));
  },[]);

  const openNamingModal = useCallback((lang) => {
    setNewFileLang(lang);
    setNewFileName('');
    setIsNamingModalVisible(true);
    setShowDropdown(false);
  },[]);

  const confirmAddFile = useCallback(() => {
    if (!newFileName.trim()) return;

    let finalName = newFileName.trim();
    if (newFileLang === 'html' && !finalName.endsWith('.html')) finalName += '.html';
    if (newFileLang === 'css' && !finalName.endsWith('.css')) finalName += '.css';
    if (newFileLang === 'javascript' && !finalName.endsWith('.js')) finalName += '.js';

    const newFile = {
      id: `${newFileLang}_${Date.now()}`,
      label: finalName,
      lang: newFileLang,
      code: ''
    };

    setFiles(prev => [...prev, newFile]);
    setActiveTab(newFile.id);
    setIsNamingModalVisible(false);
    setNewFileLang(null);
  }, [newFileName, newFileLang]);

  const confirmDelete = useCallback(() => {
    const updatedFiles = files.filter(f => f.id !== fileToDelete);
    setFiles(updatedFiles);
    
    if (activeTab === fileToDelete) {
      setActiveTab(updatedFiles.length > 0 ? updatedFiles[0].id : 'output');
    }
    setFileToDelete(null);
  }, [files, fileToDelete, activeTab]);

  const toggleDropdown = useCallback(() => {
    setShowDropdown(prev => !prev);
  },[]);

  const handleTabPress = useCallback((id) => {
    setActiveTab(id);
    setShowDropdown(false);
  },[]);

  const handleOutputTabPress = useCallback(() => {
    setActiveTab('output');
    setShowDropdown(false);
    Keyboard.dismiss();
  },[]);

  const handleDeletePress = useCallback((id) => {
    setFileToDelete(id);
  },[]);

  const activeFile = useMemo(() => files.find(f => f.id === activeTab), [files, activeTab]);

  const renderedDropdownMenu = useMemo(() => {
    if (!showDropdown) return null;
    return (
      <View style={styles.dropdownMenu}>
        <Pressable style={styles.dropdownItem} onPress={() => openNamingModal('html')}>
          <Text style={styles.dropdownItemText}>+ HTML File</Text>
        </Pressable>
        <Pressable style={styles.dropdownItem} onPress={() => openNamingModal('css')}>
          <Text style={styles.dropdownItemText}>+ CSS File</Text>
        </Pressable>
        <Pressable style={[styles.dropdownItem, { borderBottomWidth: 0 }]} onPress={() => openNamingModal('javascript')}>
          <Text style={styles.dropdownItemText}>+ JS File</Text>
        </Pressable>
      </View>
    );
  }, [showDropdown, openNamingModal]);

  const renderedContentArea = useMemo(() => {
    if (activeTab !== 'output' && activeFile) {
      return (
        <FileEditor 
          key={activeFile.id}
          initialCode={activeFile.code}
          fileId={activeFile.id}
          lang={activeFile.lang}
          onCodeChange={updateFileCode}
        />
      );
    }
    if (activeTab === 'output') {
      return (
        <View style={styles.outputContainer}>
          <WebView
            source={{ html: combinedHtml }}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            originWhitelist={['*']}
            scalesPageToFit={false}
          />
        </View>
      );
    }
    return null;
  },[activeTab, activeFile, combinedHtml, updateFileCode]);

  const renderedDeleteModal = useMemo(() => (
    <Modal
      visible={!!fileToDelete}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setFileToDelete(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Delete File?</Text>
          <Text style={styles.modalMessage}>
            Are you sure you want to delete this file? This action cannot be undone.
          </Text>
          <View style={styles.modalButtonRow}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.modalCancelButton]} 
              onPress={() => setFileToDelete(null)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.modalDeleteButton]} 
              onPress={confirmDelete}
            >
              <Text style={styles.modalButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  ), [fileToDelete, confirmDelete]);

  const renderedNamingModal = useMemo(() => (
    <Modal
      visible={isNamingModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setIsNamingModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Name your file</Text>
          <TextInput
            style={styles.modalInput}
            value={newFileName}
            onChangeText={setNewFileName}
            placeholder={`e.g. main.${newFileLang === 'javascript' ? 'js' : newFileLang}`}
            placeholderTextColor="#888"
            autoFocus={true}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.modalButtonRow}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.modalCancelButton]} 
              onPress={() => setIsNamingModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.modalConfirmButton]} 
              onPress={confirmAddFile}
            >
              <Text style={styles.modalButtonText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  ),[isNamingModalVisible, newFileName, newFileLang, confirmAddFile]);

  return (
    <>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar hidden={true} />
        
        <View style={styles.container}>
          <View style={styles.headerTitleContainer}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>{'< Back'}</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Code Playground 🚀</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.editorContainer}>
            <View style={styles.editorHeader}>
              
              <Pressable 
                style={styles.addButton} 
                onPress={toggleDropdown}
              >
                <Text style={styles.addButtonText}>+</Text>
              </Pressable>

              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.tabsScrollContainer}
                contentContainerStyle={styles.tabsContainer}
              >
                {files.map((file, index) => (
                  <FileTab 
                    key={file.id}
                    file={file}
                    isActive={activeTab === file.id}
                    isFirst={index === 0}
                    onTabPress={handleTabPress}
                    onDeletePress={handleDeletePress}
                  />
                ))}
                
                <OutputTab 
                  isActive={activeTab === 'output'} 
                  onTabPress={handleOutputTabPress} 
                />
              </ScrollView>

              {renderedDropdownMenu}
            </View>

            <View style={styles.contentArea}>
              {renderedContentArea}
            </View>
          </View>
        </View>

        {renderedDeleteModal}
        {renderedNamingModal}
      </SafeAreaView>

      {/* Loading Overlay */}
      <MainLoading visible={isLoading} />
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1a1a2e' },
  container: { flex: 1, padding: 0 },
  headerTitleContainer: {
    flexDirection: 'row',
    paddingVertical: gameScale(10),
    paddingHorizontal: gameScale(15),
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: gameScale(2),
    borderBottomColor: '#0a0a0a',
  },
  backButton: {
    padding: gameScale(5),
  },
  backButtonText: {
    color: '#4dabf7',
    fontFamily: 'Grobold',
    fontSize: gameScale(14),
  },
  placeholder: {
    width: gameScale(50), 
  },
  title: { fontSize: gameScale(20), fontFamily: 'DynaPuff', color: '#ffffff' },
  editorContainer: {
    backgroundColor: '#1e1e1e',
    flex: 1, 
    width: '100%',
    overflow: 'hidden',
  },
  editorHeader: {
    backgroundColor: '#2d2d30',
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: gameScale(8),
    borderTopWidth: gameScale(1),
    borderTopColor: '#505050',
    position: 'relative',
    zIndex: 50,
  },
  addButton: { paddingHorizontal: gameScale(12), paddingBottom: gameScale(6), justifyContent: 'center', alignItems: 'center' },
  addButtonText: { color: '#ffffff', fontSize: gameScale(20), fontWeight: 'bold' },
  dropdownMenu: {
    position: 'absolute',
    top: gameScale(35),
    left: gameScale(10),
    backgroundColor: '#3c3c3c',
    borderRadius: gameScale(6),
    borderWidth: gameScale(1),
    borderColor: '#555',
    zIndex: 100,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  dropdownItem: { paddingVertical: gameScale(10), paddingHorizontal: gameScale(15), borderBottomWidth: gameScale(1), borderBottomColor: '#505050' },
  dropdownItemText: { color: '#ffffff', fontFamily: 'DynaPuff', fontSize: gameScale(12) },
  tabsScrollContainer: { flex: 1 },
  tabsContainer: { flexDirection: 'row', alignItems: 'flex-end', paddingRight: gameScale(15) },
  webTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3c3c3c',
    paddingVertical: gameScale(7),
    paddingHorizontal: gameScale(12),
    marginRight: gameScale(2),
    borderTopLeftRadius: gameScale(6),
    borderTopRightRadius: gameScale(6),
    borderTopWidth: gameScale(1),
    borderLeftWidth: gameScale(1),
    borderRightWidth: gameScale(1),
    borderTopColor: '#555',
    borderLeftColor: '#555',
    borderRightColor: '#555',
  },
  webTabActive: { backgroundColor: '#000d2f', borderTopColor: '#1177bb', borderLeftColor: '#1177bb', borderRightColor: '#1177bb', paddingHorizontal: gameScale(16), marginBottom: gameScale(-1), zIndex: 10 },
  webTabFirst: { marginLeft: 0 },
  webTabLast: { marginRight: 0 },
  webTabText: { color: '#d1d5d9', fontSize: gameScale(11), fontFamily: 'DynaPuff', fontWeight: '500' },
  webTabTextActive: { color: '#ffffff', fontWeight: '600' },
  deleteButton: { marginLeft: gameScale(8), backgroundColor: '#ff5f56', width: gameScale(14), height: gameScale(14), borderRadius: gameScale(7), alignItems: 'center', justifyContent: 'center' },
  deleteButtonText: { color: '#ffffff', fontSize: gameScale(10), fontWeight: 'bold', lineHeight: gameScale(12) },
  contentArea: { flex: 1, backgroundColor: '#000d2f' },
  interactiveBody: { flexDirection: 'row', flex: 1 },
  interactiveLineNumbers: {
    paddingVertical: gameScale(12),
    paddingHorizontal: gameScale(8),
    backgroundColor: '#1e1e1e',
    borderRightWidth: gameScale(1),
    borderRightColor: '#3a3a3a',
    alignItems: 'center',
    minWidth: gameScale(35),
  },
  interactiveLineNumberText: { color: '#ffffff7e', fontSize: gameScale(14), fontFamily: 'monospace', lineHeight: gameScale(22) },
  interactiveInputWrapper: { flex: 1, position: 'relative' },
  interactiveHighlightedLayer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    padding: gameScale(12),
    fontFamily: 'monospace',
    fontSize: gameScale(15),
    lineHeight: gameScale(22),
    textAlignVertical: 'top',
    includeFontPadding: false, 
  },
  interactiveInput: {
    flex: 1,
    color: 'rgba(255, 255, 255, 0)', 
    backgroundColor: 'transparent',
    fontFamily: 'monospace',
    fontSize: gameScale(15),
    padding: gameScale(12),
    textAlignVertical: 'top',
    lineHeight: gameScale(22),
    includeFontPadding: false, 
  },
  outputContainer: { flex: 1, backgroundColor: '#ffffff' },
  webview: { flex: 1, backgroundColor: '#ffffff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: {
    width: '80%',
    backgroundColor: '#1e3a5f',
    borderRadius: gameScale(12),
    padding: gameScale(20),
    borderWidth: gameScale(2),
    borderColor: '#4a90d9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: gameScale(4) },
    shadowOpacity: 0.5,
    shadowRadius: gameScale(5),
    elevation: 10,
  },
  modalTitle: { color: '#ffffff', fontSize: gameScale(20), fontFamily: 'Grobold', textAlign: 'center', marginBottom: gameScale(15) },
  modalMessage: { color: '#d1d5d9', fontSize: gameScale(14), fontFamily: 'DynaPuff', textAlign: 'center', marginBottom: gameScale(20) },
  modalInput: {
    backgroundColor: '#0d253f', color: '#ffffff', fontFamily: 'monospace',
    fontSize: gameScale(14), padding: gameScale(12), borderRadius: gameScale(8),
    borderWidth: gameScale(1), borderColor: '#4dabf7', marginBottom: gameScale(20),
  },
  modalButtonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  modalButton: { flex: 1, paddingVertical: gameScale(10), borderRadius: gameScale(8), alignItems: 'center', marginHorizontal: gameScale(5), borderWidth: gameScale(1) },
  modalCancelButton: { backgroundColor: '#3c3c3c', borderColor: '#555' },
  modalDeleteButton: { backgroundColor: '#ff5f56', borderColor: '#cc4c45' },
  modalConfirmButton: { backgroundColor: '#4caf50', borderColor: '#388e3c' },
  modalButtonText: { color: '#ffffff', fontFamily: 'Grobold', fontSize: gameScale(14) },
});